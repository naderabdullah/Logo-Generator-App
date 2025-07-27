// src/app/api/auth/dynamo-login/route.ts
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
    
    // Find user by email in DynamoDB
    console.log('Searching for user in DynamoDB...');
    const result = await dynamoDB.scan({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      FilterExpression: 'email = :email',
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
    console.log('User found, checking password...');
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('Login successful for:', email);
    
    // Update last login time in DynamoDB
    await dynamoDB.update({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: user.id },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': new Date().toISOString()
      }
    }).promise();
    
    // Get logo credits from Supabase
    const supabaseUser = await supabaseAuth.getUserByEmail(user.email);
    if (!supabaseUser) {
      console.log('No logo credits found for user, creating default...');
      // Create default logo credits if they don't exist
      await supabaseAuth.createUser({
        email: user.email,
        logosCreated: 0,
        logosLimit: 5
      });
      // Fetch the newly created user
      const newSupabaseUser = await supabaseAuth.getUserByEmail(user.email);
      
      // Generate JWT token
      const token = generateToken(user.id, user.email);
      
      // Create response with user data from both databases
      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          email: user.email,
          logosCreated: newSupabaseUser?.logosCreated || 0,
          logosLimit: newSupabaseUser?.logosLimit || 5,
          remainingLogos: Math.max(0, (newSupabaseUser?.logosLimit || 5) - (newSupabaseUser?.logosCreated || 0))
        }
      });
      
      // Set auth cookie
      return setAuthCookie(response, token);
    }
    
    // Generate JWT token
    const token = generateToken(user.id, user.email);
    
    // Create response with user data from both databases
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        email: user.email,
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