// src/app/api/auth/app-manager-register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import bcrypt from 'bcryptjs';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { getInitialLogoCredits } from '@/lib/logoCreditsHelper'; // ADDED: Logo credits helper

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

interface AppManagerRegistrationData {
  email: string;
  password: string;
  token: string;
  appId: string;
  linkType: string;
  subappId?: string;
  orderNumber?: string;
}

// Complete callAppManagerAPI function - REPLACE THE ENTIRE FUNCTION
async function callAppManagerAPI(registrationData: AppManagerRegistrationData) {
  if (!process.env.API_ENDPOINT || !process.env.API_KEY) {
    throw new Error('App Manager API configuration missing');
  }

  const requestBody = {
    email: registrationData.email,
    password: registrationData.password,
    token: registrationData.token,
    appId: registrationData.appId,
    linkType: registrationData.linkType,
    ...(registrationData.subappId && { subappId: registrationData.subappId }),
    ...(registrationData.orderNumber && { orderNumber: registrationData.orderNumber })
  };

  console.log('Calling App Manager API with:', { ...requestBody, password: '[REDACTED]' });

  const response = await fetch(`${process.env.API_ENDPOINT}/app-manager?action=verifyAppPurchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorData;
    let rawErrorText;

    try {
      rawErrorText = await response.text();
      console.log('🔍 Raw Lambda error response:', rawErrorText);
      errorData = JSON.parse(rawErrorText);
      console.log('🔍 Parsed Lambda error data:', errorData);
    } catch (parseError) {
      console.log('🔍 Could not parse JSON, using raw text');
      throw new Error(rawErrorText || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Extract ONLY the clean message string - no JSON objects
    let userFriendlyMessage = 'Registration failed. Please try again.';

    // Debug: Show what we're checking
    console.log('🔍 Checking errorData.error:', errorData.error, typeof errorData.error);
    console.log('🔍 Checking errorData.message:', errorData.message, typeof errorData.message);
    console.log('🔍 Checking errorData.code:', errorData.code);

    // Priority order: error > message > code-based message
    if (errorData.error && typeof errorData.error === 'string') {
      userFriendlyMessage = errorData.error;
      console.log('✅ Using errorData.error:', userFriendlyMessage);
    } else if (errorData.message && typeof errorData.message === 'string') {
      userFriendlyMessage = errorData.message;
      console.log('✅ Using errorData.message:', userFriendlyMessage);
    } else if (errorData.code) {
      console.log('✅ Using code-based message for:', errorData.code);
      // Convert technical codes to user-friendly messages
      switch (errorData.code) {
        case 'ORDER_ALREADY_USED':
          userFriendlyMessage = 'This order number has already been used. Please use a different order number.';
          break;
        case 'INVALID_ORDER_NUMBER':
          userFriendlyMessage = 'Invalid order number format. Please check your order number and try again.';
          break;
        case 'DUPLICATE_ORDER':
          userFriendlyMessage = 'This order number already exists. Please use a different order number.';
          break;
        case 'GLOBAL_DUPLICATE_ORDER':
          userFriendlyMessage = 'This order number is already in use. Please use a different order number.';
          break;
        default:
          userFriendlyMessage = errorData.details || errorData.message || 'Registration failed. Please check your information and try again.';
      }
    } else {
      console.log('❌ Could not extract error message, using fallback');
    }

    // Final safety check
    if (typeof userFriendlyMessage !== 'string') {
      console.error('❌ Non-string error message detected:', userFriendlyMessage);
      userFriendlyMessage = 'Registration failed. Please try again.';
    }

    console.log('🎯 Final user-friendly message to throw:', userFriendlyMessage);
    console.log('🎯 Message type:', typeof userFriendlyMessage);

    throw new Error(userFriendlyMessage);
  }

  return await response.json();
}

async function generateNewUserId(): Promise<number> {
  try {
    const result = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      ProjectionExpression: 'id'
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      return 1;
    }

    const maxId = Math.max(...result.Items.map(item => item.id || 0));
    return maxId + 1;
  } catch (error) {
    console.error('Error generating user ID:', error);
    return Date.now();
  }
}

// Interface for user object returned from DynamoDB (no logo fields)
interface DynamoUser {
  id: number;
  email: string;
  password: string;
  createdAt: string;
  lastLogin: string;
  appManagerData: any;
  Status?: string;
}

// Function to save user credentials to DynamoDB
// async function saveToDynamoDB(
//     registrationData: AppManagerRegistrationData,
//     appManagerResponse: any
// ): Promise<DynamoUser> {
//   try {
//     console.log('Saving user to DynamoDB...');
//
//     // Check if user already exists
//     const existingUserResult = await dynamoDB.scan({
//       TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
//       FilterExpression: 'email = :email',
//       ExpressionAttributeValues: {
//         ':email': registrationData.email.toLowerCase()
//       }
//     }).promise();
//
//     // Hash the password for secure storage
//     const hashedPassword = await bcrypt.hash(registrationData.password, 12);
//
//     if (existingUserResult.Items && existingUserResult.Items.length > 0) {
//       // Update existing user
//       const existingUser = existingUserResult.Items[0];
//       console.log(`Updating existing DynamoDB user: ${registrationData.email}`);
//
//       await dynamoDB.update({
//         TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
//         Key: { id: existingUser.id },
//         UpdateExpression: 'SET #pwd = :password, lastLogin = :lastLogin, appManagerData = :appManagerData, #status = :status',
//         ExpressionAttributeNames: {
//           '#pwd': 'password',
//           '#status': 'Status'
//         },
//         ExpressionAttributeValues: {
//           ':password': hashedPassword,
//           ':lastLogin': new Date().toISOString(),
//           ':appManagerData': appManagerResponse,
//           ':status': 'active'
//         }
//       }).promise();
//
//       // Return the updated user object
//       const updatedUser: DynamoUser = {
//         id: existingUser.id,
//         email: existingUser.email,
//         password: hashedPassword,
//         createdAt: existingUser.createdAt || new Date().toISOString(),
//         lastLogin: new Date().toISOString(),
//         appManagerData: appManagerResponse,
//         Status: 'active'
//       };
//
//       return updatedUser;
//     } else {
//       // Create new user
//       console.log(`Creating new DynamoDB user: ${registrationData.email}`);
//
//       const newUserId = await generateNewUserId();
//
//       const newUser: DynamoUser = {
//         id: newUserId,
//         email: registrationData.email.toLowerCase(),
//         password: hashedPassword,
//         createdAt: new Date().toISOString(),
//         lastLogin: new Date().toISOString(),
//         appManagerData: appManagerResponse,
//         Status: 'active'
//       };
//
//       await dynamoDB.put({
//         TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
//         Item: newUser
//       }).promise();
//
//       console.log(`✅ Successfully created DynamoDB user: ${registrationData.email} with active status`);
//       return newUser;
//     }
//   } catch (error) {
//     console.error('Error saving to DynamoDB:', error);
//     throw error;
//   }
// }

// Function to save logo credits tracking to Supabase only
async function saveToSupabaseForCredits(
    email: string,
    // dynamoUserId: number,
    subAppId?: string // ADDED: Optional subAppId parameter
) {
  try {
    console.log('Saving logo credits tracking to Supabase...');

    // ADDED: Get credits based on subapp lookup, fallback to 5 if no subAppId
    const logoCredits = subAppId ? await getInitialLogoCredits(subAppId) : 5;

    // Check if user already exists in Supabase
    const existingUser = await supabaseAuth.getUserByEmail(email.toLowerCase());

    if (existingUser) {
      console.log(`Updating Supabase credits tracking for: ${email}`);

      const updatedUser = await supabaseAuth.updateUser(existingUser.id, {
        logosCreated: 0, // Reset to 0 for new registration
        logosLimit: logoCredits // CHANGED: Dynamic based on subapp (was hardcoded 5)
      });

      return updatedUser;
    } else {
      console.log(`Creating new Supabase credits tracking for: ${email} with ${logoCredits} credits`);

      const newUser = await supabaseAuth.createUser({
        email: email.toLowerCase(),
        // Note: No password stored in Supabase - only for logo credits tracking
        logosCreated: 0,
        logosLimit: logoCredits // CHANGED: Dynamic based on subapp (was hardcoded 5)
      });

      console.log(`✅ Successfully created Supabase credits tracking: ${email} (${logoCredits} logos)`);
      return newUser;
    }
  } catch (error) {
    console.error('Error saving to Supabase for credits:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const registrationData: AppManagerRegistrationData = await request.json();

    console.log('Processing app manager registration for:', registrationData.email);
    console.log('App Manager type:', registrationData.linkType, registrationData.subappId);

    // Validate required fields
    if (!registrationData.email || !registrationData.password || !registrationData.token) {
      return NextResponse.json(
          { error: 'Missing required fields: email, password, or token' },
          { status: 400 }
      );
    }

    // Step 1: Register with App Manager (verify token and registration)
    console.log('Step 1: Registering with App Manager...');
    let appManagerResponse;
    try {
      appManagerResponse = await callAppManagerAPI(registrationData);
      console.log('✅ App Manager registration successful');
    } catch (appManagerError: any) {
      console.error('🔍 App Manager registration failed:', appManagerError);
      console.log('🔍 Error type:', typeof appManagerError);
      console.log('🔍 Is Error instance:', appManagerError instanceof Error);

      if (appManagerError instanceof Error) {
        console.log('🔍 Error.message:', appManagerError.message);
        console.log('🔍 Message type:', typeof appManagerError.message);
      }

      // Extract the clean error message with multiple fallback strategies
      let cleanErrorMessage = 'Registration failed. Please try again.';

      if (appManagerError instanceof Error) {
        cleanErrorMessage = appManagerError.message;
        console.log('✅ Using Error.message:', cleanErrorMessage);
      } else if (typeof appManagerError === 'string') {
        cleanErrorMessage = appManagerError;
        console.log('✅ Using string error:', cleanErrorMessage);
      } else if (appManagerError.message) {
        cleanErrorMessage = appManagerError.message;
        console.log('✅ Using appManagerError.message:', cleanErrorMessage);
      }

      // Aggressive JSON cleaning - multiple strategies
      if (typeof cleanErrorMessage === 'string' && cleanErrorMessage.startsWith('{')) {
        console.log('🔧 Attempting to clean JSON string:', cleanErrorMessage);

        try {
          const parsed = JSON.parse(cleanErrorMessage);
          if (parsed.error && typeof parsed.error === 'string') {
            cleanErrorMessage = parsed.error;
            console.log('✅ Extracted from parsed.error:', cleanErrorMessage);
          } else if (parsed.message && typeof parsed.message === 'string') {
            cleanErrorMessage = parsed.message;
            console.log('✅ Extracted from parsed.message:', cleanErrorMessage);
          }
        } catch (parseError) {
          console.log('🔧 JSON parse failed, trying regex extraction');
          // Fallback: regex extraction
          const errorMatch = cleanErrorMessage.match(/"error":"([^"]+)"/);
          const messageMatch = cleanErrorMessage.match(/"message":"([^"]+)"/);

          if (errorMatch && errorMatch[1]) {
            cleanErrorMessage = errorMatch[1];
            console.log('✅ Extracted via regex from error field:', cleanErrorMessage);
          } else if (messageMatch && messageMatch[1]) {
            cleanErrorMessage = messageMatch[1];
            console.log('✅ Extracted via regex from message field:', cleanErrorMessage);
          }
        }
      }

      console.log('🎯 Final clean error message being returned:', cleanErrorMessage);
      console.log('🎯 Final message type:', typeof cleanErrorMessage);

      return NextResponse.json(
          {
            error: cleanErrorMessage
          },
          { status: 400 }
      );
    }
    // Step 2: Save user credentials to DynamoDB (primary auth database)
    console.log('Step 2: **** SKIPPING **** Saving user credentials to DynamoDB...');
    // let dynamoUser;
    // try {
    //   dynamoUser = await saveToDynamoDB(registrationData, appManagerResponse);
    //   console.log('✅ DynamoDB user creation successful');
    // } catch (dynamoError: any) {
    //   console.error('DynamoDB user creation failed:', dynamoError);
    //
    //   return NextResponse.json(
    //       {
    //         error: 'Registration partially completed. Please contact support.',
    //         details: 'App Manager registration succeeded but user credential storage failed.'
    //       },
    //       { status: 500 }
    //   );
    // }

    // Step 3: Create logo credits tracking in Supabase (required - for logo management)
    console.log('Step 3: Setting up logo credits tracking in Supabase...');
    let supabaseUser;
    try {
      // CHANGED: Pass subappId to the function (was just email and dynamoUser.id)
      supabaseUser = await saveToSupabaseForCredits(
          registrationData.email,
          // dynamoUser.id,
          registrationData.subappId
      );
      console.log('✅ Supabase credits tracking setup successful');
    } catch (supabaseError: any) {
      console.error('Supabase credits tracking setup failed:', supabaseError);
      // This is critical since we need logo tracking
      return NextResponse.json(
          {
            error: 'Registration partially completed. Please contact support.',
            details: 'User credentials saved but logo tracking setup failed.'
          },
          { status: 500 }
      );
    }

    // Step 4: Return success response
    return NextResponse.json({
      success: true,
      message: `Registration completed successfully - ${supabaseUser.logosLimit} free logos included!`, // CHANGED: Dynamic message (was hardcoded "5 free logos")
      appManager: {
        status: 'registered',
        response: appManagerResponse
      },
      user: {
        // id: dynamoUser.id,
        // email: dynamoUser.email,
        logosCreated: supabaseUser.logosCreated,
        logosLimit: supabaseUser.logosLimit // Logo data from Supabase
      }
    });

  } catch (error: any) {
    console.error('Error in app manager registration:', error);
    return NextResponse.json(
        {
          error: 'Registration failed',
          details: error.message || 'Unknown error occurred'
        },
        { status: 500 }
    );
  }
}