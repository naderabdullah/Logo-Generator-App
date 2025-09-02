// src/app/api/auth/dynamo-login/route.ts - Updated to use AppUsers table
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Function to generate JWT token using AppId as the user identifier
function generateToken(appId: string, email: string): string {
  return jwt.sign(
      { id: appId, email },
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

export async function POST(request: NextRequest) {
  try {
    console.log('=== DYNAMODB LOGIN API CALLED ===');

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
      );
    }

    // Find user by email using EmailIndex GSI in AppUsers table
    console.log('Searching for user in AppUsers table...');
    const result = await dynamoDB.query({
      TableName: 'AppUsers',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'Email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      console.log('User not found:', email);
      return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
      );
    }

    const user = result.Items[0];
    console.log('User found, checking status and password...');

    // Check if user account is active (explicit active status required)
    const userStatus = user.Status || user.status; // Handle both uppercase and lowercase
    if (userStatus !== 'active' && userStatus !== 'pending') {
      console.log('User account is not active, status:', userStatus, 'for email:', email);

      // Provide specific error messages based on status
      if (userStatus === 'inactive') {
        return NextResponse.json(
            { error: 'This account has been deactivated. Please contact support if you need to reactivate your account.' },
            { status: 403 }
        );
      } else {
        return NextResponse.json(
            { error: 'Account is not active. Please contact support to activate your account.' },
            { status: 403 }
        );
      }
    }

    // AppUsers table stores passwords as plain text, not bcrypt hashed
    const userPassword = user.Password || user.password;
    if (!userPassword) {
      console.log('No password field found. Available fields:', Object.keys(user));
      return NextResponse.json(
          { error: 'User authentication data not found' },
          { status: 500 }
      );
    }

    // Compare passwords directly (plain text comparison for AppUsers table)
    const isMatch = password === userPassword;
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
      );
    }

    console.log('Login successful for:', email);

    // Update last login time in AppUsers table using composite primary key
    await dynamoDB.update({
      TableName: 'AppUsers',
      Key: {
        AppId: user.AppId,
        EmailSubAppId: user.EmailSubAppId
      },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': new Date().toISOString()
      }
    }).promise();

    // Get logo credits from Supabase
    const supabaseUser = await supabaseAuth.getUserByEmail(user.Email);
    if (!supabaseUser) {
      console.log('No logo credits found for user, creating default...');
      // Create default logo credits if they don't exist
      await supabaseAuth.createUser({
        email: user.Email,
        logosCreated: 0,
        logosLimit: 5
      });

      // Fetch the newly created user
      const newSupabaseUser = await supabaseAuth.getUserByEmail(user.Email);

      // Generate JWT token using AppId as the user identifier
      const token = generateToken(user.AppId, user.Email);

      // Create response with user data from both databases
      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          email: user.Email,
          logosCreated: newSupabaseUser?.logosCreated || 0,
          logosLimit: newSupabaseUser?.logosLimit || 5,
          remainingLogos: Math.max(0, (newSupabaseUser?.logosLimit || 5) - (newSupabaseUser?.logosCreated || 0))
        }
      });

      // Set auth cookie
      return setAuthCookie(response, token);
    }

    // Generate JWT token using AppId as the user identifier
    const token = generateToken(user.AppId, user.Email);

    // Create response with user data from both databases
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        email: user.Email,
        logosCreated: supabaseUser.logosCreated,
        logosLimit: supabaseUser.logosLimit,
        remainingLogos: Math.max(0, supabaseUser.logosLimit - supabaseUser.logosCreated)
      }
    });

    // Set auth cookie
    return setAuthCookie(response, token);

  } catch (error: any) {
    console.error('=== DYNAMODB LOGIN API ERROR ===');
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
      { message: 'DynamoDB Login API endpoint. Use POST to authenticate.' },
      { status: 200 }
  );
}