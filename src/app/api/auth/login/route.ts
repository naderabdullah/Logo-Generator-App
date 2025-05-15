// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Function to get user by email
async function getUserByEmail(email: string) {
  try {
    const result = await dynamoDB.query({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    }).promise();
    
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Function to compare passwords
async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Function to generate JWT token
function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret',
    { expiresIn: '7d' } // Longer expiry for simplicity
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
    // Parse request body
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Compare passwords
    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = generateToken(user.id, user.email);
    
    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        email: user.email,
        logosCreated: user.logosCreated || 0,
        logosLimit: user.logosLimit || 10
      }
    });
    
    // Set auth cookie
    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}