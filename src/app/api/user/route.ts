// src/app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';

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
    ) as { id: number };
    
    // Get user from DynamoDB
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: decoded.id }
    }).promise();
    
    return result.Item;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// GET endpoint - Get current user's logo usage data
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Return user data - IMPORTANT: Use exactly what's in the database with no defaults
    // The previous version was likely setting a default of 10 for logosLimit
    return NextResponse.json({
      email: user.email,
      logosCreated: user.logosCreated || 0,
      logosLimit: user.logosLimit || 0, // Changed from 10 to 0
      remainingLogos: Math.max(0, (user.logosLimit || 0) - (user.logosCreated || 0))
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - Update logo limit (e.g., after upgrading plan)
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
    if (typeof logosLimit !== 'number' || logosLimit < 0) {
      return NextResponse.json(
        { error: 'Invalid logo limit value' },
        { status: 400 }
      );
    }
    
    // Update logo limit in database
    const result = await dynamoDB.update({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: user.id },
      UpdateExpression: 'SET logosLimit = :limit',
      ExpressionAttributeValues: {
        ':limit': logosLimit
      },
      ReturnValues: 'ALL_NEW'
    }).promise();
    
    const updatedUser = result.Attributes || {
      email: user.email,
      logosCreated: user.logosCreated || 0,
      logosLimit: logosLimit
    };
    
    // Return updated user data
    return NextResponse.json({
      email: updatedUser.email,
      logosCreated: updatedUser.logosCreated || 0,
      logosLimit: updatedUser.logosLimit,
      remainingLogos: Math.max(0, updatedUser.logosLimit - (updatedUser.logosCreated || 0))
    });
  } catch (error) {
    console.error('Error updating logo limit:', error);
    return NextResponse.json(
      { error: 'Failed to update logo limit' },
      { status: 500 }
    );
  }
}