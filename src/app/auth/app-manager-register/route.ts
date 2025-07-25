// src/app/api/auth/app-manager-register/route.ts - Updated without subscription types
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabase';

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

// Function to call App Manager API for registration verification
async function callAppManagerAPI(registrationData: AppManagerRegistrationData) {
  if (!process.env.NEXT_PUBLIC_API_ENDPOINT || !process.env.NEXT_PUBLIC_API_KEY) {
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

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/app-manager?action=verifyAppPurchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `App Manager API error: ${response.status}`);
  }

  return await response.json();
}

// Function to generate a new user ID for DynamoDB
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

// Function to determine logo limits based on registration type
function determineLogoLimit(linkType: string, subappId?: string): number {
  if (subappId === 'premium' || linkType === 'premium') {
    return 100;
  }
  if (linkType === 'generic') {
    return 25;
  }
  return 10; // specific or default
}

// Function to save user credentials to DynamoDB
async function saveToDynamoDB(
  registrationData: AppManagerRegistrationData, 
  appManagerResponse: any
) {
  try {
    console.log('Saving user to DynamoDB...');
    
    // Check if user already exists
    const existingUserResult = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': registrationData.email.toLowerCase()
      }
    }).promise();

    // Hash the password for secure storage
    const hashedPassword = await bcrypt.hash(registrationData.password, 12);
    
    if (existingUserResult.Items && existingUserResult.Items.length > 0) {
      // Update existing user
      const existingUser = existingUserResult.Items[0];
      console.log(`Updating existing DynamoDB user: ${registrationData.email}`);
      
      const logoLimit = determineLogoLimit(registrationData.linkType, registrationData.subappId);
      
      await dynamoDB.update({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Key: { id: existingUser.id },
        UpdateExpression: 'SET #pwd = :password, logosLimit = :logosLimit, lastLogin = :lastLogin, appManagerData = :appManagerData',
        ExpressionAttributeNames: {
          '#pwd': 'password'
        },
        ExpressionAttributeValues: {
          ':password': hashedPassword,
          ':logosLimit': logoLimit,
          ':lastLogin': new Date().toISOString(),
          ':appManagerData': appManagerResponse
        }
      }).promise();
      
      return existingUser;
    } else {
      // Create new user
      console.log(`Creating new DynamoDB user: ${registrationData.email}`);
      
      const newUserId = await generateNewUserId();
      const logoLimit = determineLogoLimit(registrationData.linkType, registrationData.subappId);
      
      const newUser = {
        id: newUserId,
        email: registrationData.email.toLowerCase(),
        password: hashedPassword,
        logosCreated: 0,
        logosLimit: logoLimit,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        appManagerData: appManagerResponse
      };
      
      await dynamoDB.put({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Item: newUser
      }).promise();
      
      console.log(`✅ Successfully created DynamoDB user: ${registrationData.email} (${logoLimit} logo credits)`);
      return newUser;
    }
  } catch (error) {
    console.error('Error saving to DynamoDB:', error);
    throw error;
  }
}

// Function to save logo credits tracking to Supabase only
async function saveToSupabaseForCredits(
  email: string,
  dynamoUser: any
) {
  try {
    console.log('Saving logo credits tracking to Supabase...');
    
    // Check if user already exists in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      console.log(`Updating Supabase credits tracking for: ${email}`);
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          logosCreated: dynamoUser.logosCreated,
          logosLimit: dynamoUser.logosLimit,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update Supabase credits: ${updateError.message}`);
      }
      
      return updatedUser;
    } else {
      console.log(`Creating new Supabase credits tracking for: ${email}`);
      
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: email.toLowerCase(),
          // Note: No password stored in Supabase - only for logo credits tracking
          logosCreated: dynamoUser.logosCreated,
          logosLimit: dynamoUser.logosLimit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Failed to create Supabase credits tracking: ${createError.message}`);
      }
      
      console.log(`✅ Successfully created Supabase credits tracking: ${email}`);
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
    console.log('Registration type:', registrationData.linkType, registrationData.subappId);
    
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
      console.error('App Manager registration failed:', appManagerError);
      return NextResponse.json(
        { 
          error: 'App Manager registration failed', 
          details: appManagerError.message || 'Unknown error'
        },
        { status: 400 }
      );
    }
    
    // Step 2: Save user credentials to DynamoDB (primary auth database)
    console.log('Step 2: Saving user credentials to DynamoDB...');
    let dynamoUser;
    try {
      dynamoUser = await saveToDynamoDB(registrationData, appManagerResponse);
      console.log('✅ DynamoDB user creation successful');
    } catch (dynamoError: any) {
      console.error('DynamoDB user creation failed:', dynamoError);
      
      return NextResponse.json(
        { 
          error: 'Registration partially completed. Please contact support.',
          details: 'App Manager registration succeeded but user credential storage failed.'
        },
        { status: 500 }
      );
    }
    
    // Step 3: Create logo credits tracking in Supabase (optional - for logo management only)
    console.log('Step 3: Setting up logo credits tracking in Supabase...');
    try {
      await saveToSupabaseForCredits(registrationData.email, dynamoUser);
      console.log('✅ Supabase credits tracking setup successful');
    } catch (supabaseError: any) {
      console.error('Supabase credits tracking setup failed:', supabaseError);
      // This is non-critical - user can still function without Supabase tracking
      console.log('⚠️ Continuing without Supabase credits tracking');
    }
    
    // Step 4: Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      appManager: {
        status: 'registered',
        response: appManagerResponse
      },
      user: {
        id: dynamoUser.id,
        email: dynamoUser.email,
        logosCreated: dynamoUser.logosCreated,
        logosLimit: dynamoUser.logosLimit
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