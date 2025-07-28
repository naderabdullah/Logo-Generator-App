// src/app/api/user/route.ts - Updated to check for active/pending users only
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

// Define user type
interface User {
  id: number;
  email: string;
  logosCreated: number;
  logosLimit: number;
}

// Function to get current user from request
async function getCurrentUser(request: NextRequest): Promise<User | null | 'not_allowed'> {
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
    
    // Check if user account status allows access ('active' or 'pending' only)
    const userStatus = dynamoResult.Item.Status || dynamoResult.Item.status;
    if (userStatus !== 'active' && userStatus !== 'pending') {
      console.log('User account status does not allow access, status:', userStatus, 'for email:', dynamoResult.Item.email);
      return 'not_allowed'; // Return a special value to distinguish from not found
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
    
    // Check if user is not allowed
    if (user === 'not_allowed') {
      return NextResponse.json(
        { error: 'Account not active' },
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
    
    // Check if user is not allowed
    if (user === 'not_allowed') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { logosCreated, logosLimit } = body;
    
    // Update user data in Supabase
    const supabaseUser = await supabaseAuth.getUserByEmail(user.email);
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'User not found in Supabase' },
        { status: 404 }
      );
    }
    
    const updates: any = {};
    if (typeof logosCreated === 'number') updates.logosCreated = logosCreated;
    if (typeof logosLimit === 'number') updates.logosLimit = logosLimit;
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }
    
    const updatedUser = await supabaseAuth.updateUser(supabaseUser.id, updates);
    
    return NextResponse.json({
      email: updatedUser.email,
      logosCreated: updatedUser.logosCreated,
      logosLimit: updatedUser.logosLimit,
      remainingLogos: Math.max(0, updatedUser.logosLimit - updatedUser.logosCreated)
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}