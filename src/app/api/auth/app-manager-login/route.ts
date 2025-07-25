// src/app/api/auth/app-manager-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Function to generate JWT token
function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret',
    { expiresIn: '7d' }
  );
}

// Function to set auth cookie
function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: 'access_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  });
  
  return response;
}

// Function to authenticate user against DynamoDB
async function authenticateUserFromDynamoDB(email: string, password: string) {
  try {
    console.log('Authenticating user from DynamoDB:', email);
    
    // Find user by email in DynamoDB
    const result = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    }).promise();
    
    if (!result.Items || result.Items.length === 0) {
      console.log('User not found in DynamoDB:', email);
      return null;
    }
    
    const user = result.Items[0];
    console.log('User found in DynamoDB, checking password...');
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return null;
    }
    
    console.log('Password valid for user:', email);
    
    // Update last login time
    await dynamoDB.update({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: user.id },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': new Date().toISOString()
      }
    }).promise();
    
    return user;
    
  } catch (error) {
    console.error('Error authenticating user from DynamoDB:', error);
    throw error;
  }
}

// Function to create or update user from app manager login (for backward compatibility)
async function createOrUpdateUserFromAppManager(email: string, password: string, appManagerData: any) {
  try {
    console.log('Creating/updating user from app manager data...');
    
    // Check if user already exists
    const existingUserResult = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    }).promise();

    let user;
    
    if (existingUserResult.Items && existingUserResult.Items.length > 0) {
      // User exists, update their information
      user = existingUserResult.Items[0];
      console.log('User already exists, updating information');
      
      // Update user with any new information from app manager
      await dynamoDB.update({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Key: { id: user.id },
        UpdateExpression: 'SET lastLogin = :lastLogin, appManagerData = :appManagerData',
        ExpressionAttributeValues: {
          ':lastLogin': new Date().toISOString(),
          ':appManagerData': appManagerData
        }
      }).promise();
      
    } else {
      // Create new user from app manager data
      console.log('Creating new user from app manager data');
      
      const newUserId = await generateNewUserId();
      const hashedPassword = await bcrypt.hash(password, 12);
      
      user = {
        id: newUserId,
        email: email.toLowerCase(),
        password: hashedPassword,
        logosCreated: 0,
        logosLimit: 5, // Everyone gets 5 free logos
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        appManagerData: appManagerData
      };
      
      await dynamoDB.put({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Item: user
      }).promise();
    }
    
    return user;
  } catch (error) {
    console.error('Error creating/updating user from app manager:', error);
    throw error;
  }
}

// Function to generate a new user ID
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different login request formats
    if (body.email && body.password && !body.appManagerToken) {
      // Direct DynamoDB authentication (new primary method)
      console.log('=== DIRECT DYNAMODB LOGIN ===');
      const { email, password } = body;
      
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }
      
      const user = await authenticateUserFromDynamoDB(email, password);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      // Generate JWT token
      const token = generateToken(user.id, user.email);
      
      // Create response with user data
      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          email: user.email,
          logosCreated: user.logosCreated,
          logosLimit: user.logosLimit,
          remainingLogos: Math.max(0, user.logosLimit - user.logosCreated)
        }
      });
      
      // Set auth cookie
      return setAuthCookie(response, token);
      
    } else if (body.appManagerToken && body.appManagerData) {
      // App Manager token processing for backward compatibility
      console.log('=== APP MANAGER TOKEN PROCESSING ===');
      const { email, appManagerToken, appManagerData } = body;
      
      if (!email || !appManagerToken || !appManagerData) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      console.log('Processing app manager login for:', email);
      
      // Verify the app manager token (basic validation)
      if (!appManagerToken || appManagerToken.length < 10) {
        return NextResponse.json(
          { error: 'Invalid app manager token' },
          { status: 401 }
        );
      }
      
      // Extract password from app manager data or use a default
      const password = appManagerData.password || email + '_temp_' + Date.now();
      
      // Create or update user from app manager data
      const user = await createOrUpdateUserFromAppManager(email, password, appManagerData);
      
      // Generate JWT token
      const accessToken = generateToken(user.id, user.email);
      const refreshToken = jwt.sign(
        { id: user.id, email: user.email, type: 'refresh' },
        process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh-token-secret',
        { expiresIn: '30d' }
      );
      
      // Create response
      const response = NextResponse.json({
        message: 'App manager login successful',
        user: {
          email: user.email,
          logosCreated: user.logosCreated,
          logosLimit: user.logosLimit,
          remainingLogos: Math.max(0, user.logosLimit - user.logosCreated)
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });
      
      // Set auth cookies
      setAuthCookie(response, accessToken);
      response.cookies.set({
        name: 'refresh_token',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      });
      
      return response;
    } else {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('=== APP MANAGER LOGIN ERROR ===');
    console.error('Error details:', error);
    
    return NextResponse.json(
      { error: 'Login failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'App Manager Login API endpoint. Use POST to authenticate.' },
    { status: 200 }
  );
}