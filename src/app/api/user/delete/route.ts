// src/app/api/user/delete/route.ts - Updated for soft delete (Status = 'inactive')
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DynamoDB } from 'aws-sdk';

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
    
    return {
      id: dynamoResult.Item.id,
      email: dynamoResult.Item.email,
      status: dynamoResult.Item.Status || dynamoResult.Item.status // Handle both cases
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// DELETE endpoint - Soft delete user account (change Status to 'inactive')
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
    
    // Check if user is already inactive
    if (user.status === 'inactive') {
      return NextResponse.json(
        { error: 'Account is already deactivated' },
        { status: 400 }
      );
    }
    
    console.log(`Starting account deactivation for user: ${user.email}`);
    
    // Update user status to 'inactive' in DynamoDB (soft delete)
    try {
      await dynamoDB.update({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Key: { id: user.id },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'Status'
        },
        ExpressionAttributeValues: {
          ':status': 'inactive'
        }
      }).promise();
      
      console.log(`✅ Account deactivated in DynamoDB: ${user.email}`);
    } catch (dynamoError) {
      console.error('Failed to deactivate user in DynamoDB:', dynamoError);
      return NextResponse.json(
        { error: 'Failed to deactivate account' },
        { status: 500 }
      );
    }
    
    // Note: We're NOT deleting from Supabase - logo credits data is preserved
    console.log(`🎉 Account deactivation completed for: ${user.email}`);
    
    // Create response and clear auth cookie to log user out
    const response = NextResponse.json({
      message: 'Account deactivated successfully',
      details: 'Your account has been deactivated. You have been logged out.'
    });
    
    // Clear all auth cookies
    response.cookies.set({
      name: 'access_token',
      value: '',
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    response.cookies.set({
      name: 'refresh_token',
      value: '',
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return response;
  } catch (error: any) {
    console.error('Error deactivating user account:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate account: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}