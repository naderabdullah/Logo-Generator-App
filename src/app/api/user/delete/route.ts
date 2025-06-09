// src/app/api/user/delete/route.ts
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

// DELETE endpoint - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Delete user from DynamoDB
    await dynamoDB.delete({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: user.id }
    }).promise();
    
    console.log(`User account deleted: ${user.email}`);
    
    // Create response and clear auth cookie
    const response = NextResponse.json({
      message: 'Account deleted successfully'
    });
    
    // Clear auth cookie
    response.cookies.set({
      name: 'access_token',
      value: '',
      expires: new Date(0),
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
