// src/app/api/auth/signup/route.ts
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

// Function to check if email already exists
async function emailExists(email: string): Promise<boolean> {
  try {
    // Use a query with a GSI on the email field
    const result = await dynamoDB.query({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    }).promise();
    
    return (result.Items || []).length > 0;
  } catch (error) {
    console.error('Error checking if email exists:', error);
    throw error;
  }
}

// Function to hash password
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Function to generate JWT tokens
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
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const exists = await emailExists(email);
    if (exists) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user in DynamoDB
    // Generate a numeric ID based on current timestamp
    const userId = Date.now();
    const user = {
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      logosCreated: 0,
      logosLimit: 0  // Explicitly set to 0 to fix the issue
    };
    
    await dynamoDB.put({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)'
    }).promise();
    
    // Generate JWT token
    const token = generateToken(userId, email);
    
    // Create response
    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          email: user.email,
          logosCreated: user.logosCreated,
          logosLimit: user.logosLimit
        }
      },
      { status: 201 }
    );
    
    // Set auth cookie
    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Error signing up:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}