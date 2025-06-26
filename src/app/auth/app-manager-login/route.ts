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

// Function to generate a new user ID
async function generateNewUserId(): Promise<number> {
  try {
    // Get all users to find the highest ID
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
    // Fallback to timestamp-based ID
    return Date.now();
  }
}

// Function to create or update user from app manager data
async function createOrUpdateUserFromAppManager(email: string, password: string, appManagerData: any) {
  try {
    // Check if user already exists
    const existingUserResult = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
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
      // Create new user
      console.log('Creating new user from app manager registration');
      
      const newUserId = await generateNewUserId();
      const hashedPassword = await bcrypt.hash(password, 12);
      
      user = {
        id: newUserId,
        email: email,
        password: hashedPassword,
        logosCreated: 0,
        logosLimit: 10, // Default limit, this might be overridden by app manager data
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        appManagerData: appManagerData
      };
      
      // Set logo limit based on app manager subscription if available
      if (appManagerData.subAppId === 'premium' || appManagerData.linkType === 'premium') {
        user.logosLimit = 100; // Premium users get more logos
      } else {
        user.logosLimit = 10; // Default limit
      }
      
      await dynamoDB.put({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Item: user
      }).promise();
    }
    
    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, appManagerToken, appManagerData } = await request.json();
    
    if (!email || !appManagerToken || !appManagerData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Processing app manager login for:', email);
    
    // Verify the app manager token (basic validation)
    // In a production environment, you might want to validate this token with the app manager API
    if (!appManagerToken || appManagerToken.length < 10) {
      return NextResponse.json(
        { error: 'Invalid app manager token' },
        { status: 401 }
      );
    }
    
    // Extract password from app manager data or use a default
    // Note: In a real implementation, you might not have the password from app manager
    // You might need to generate a temporary password or use a different approach
    const password = appManagerData.password || email + '_temp_' + Date.now();
    
    // Create or update user
    const user = await createOrUpdateUserFromAppManager(email, password, appManagerData);
    
    // Generate JWT tokens (same as existing login)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret',
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh-token-secret',
      { expiresIn: '7d' }
    );
    
    console.log('App manager login successful for user:', user.email);
    
    // Create response and set cookies (same as existing login)
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        logosCreated: user.logosCreated || 0,
        logosLimit: user.logosLimit || 10
      }
    });
    
    // Set HTTP-only cookies for tokens
    response.cookies.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });
    
    response.cookies.set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('App manager login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}