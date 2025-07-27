// src/app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from '../../../lib/supabaseAuth';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Function to get current user from request
async function getCurrentUser(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(
      accessToken, 
      process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret'
    ) as { id: number, email: string };
    
    // Get user auth data from DynamoDB
    const dynamoResult = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: decoded.id }
    }).promise();
    
    if (!dynamoResult.Item) {
      return null;
    }
    
    // Get user logo credits from Supabase
    const supabaseUser = await supabaseAuth.getUserByEmail(dynamoResult.Item.email);
    
    if (!supabaseUser) {
      return null;
    }
    
    // Combine auth data from DynamoDB with logo data from Supabase
    return {
      id: dynamoResult.Item.id,
      email: dynamoResult.Item.email,
      logosCreated: supabaseUser.logosCreated,
      logosLimit: supabaseUser.logosLimit
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// GET endpoint - Return user's data and logo usage statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      email: user.email,
      logosCreated: user.logosCreated,
      logosLimit: user.logosLimit,
      remainingLogos: Math.max(0, user.logosLimit - user.logosCreated)
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - Update user data (e.g., after logo limit changes)
export async function PATCH(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { logosLimit } = await request.json();
    
    // Validate input
    if (logosLimit !== undefined && (logosLimit < 0 || !Number.isInteger(logosLimit))) {
      return NextResponse.json(
        { error: 'Invalid logos limit' },
        { status: 400 }
      );
    }
    
    // Update user logo data in Supabase (not DynamoDB)
    const updates: any = {};
    if (logosLimit !== undefined) updates.logosLimit = logosLimit;
    
    // Find the Supabase user by email and update
    const supabaseUser = await supabaseAuth.getUserByEmail(user.email);
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'User logo credits not found' },
        { status: 404 }
      );
    }
    
    const updatedUser = await supabaseAuth.updateUser(supabaseUser.id, updates);
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        email: user.email,
        logosCreated: updatedUser.logosCreated,
        logosLimit: updatedUser.logosLimit,
        remainingLogos: Math.max(0, updatedUser.logosLimit - updatedUser.logosCreated)
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}