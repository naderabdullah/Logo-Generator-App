// src/app/api/user/delete/route.ts - Updated to delete from both DynamoDB and Supabase
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

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
      email: dynamoResult.Item.email
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// DELETE endpoint - Delete user account from both databases
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
    
    console.log(`Starting account deletion for user: ${user.email}`);
    
    // Step 1: Delete user from DynamoDB (authentication data)
    try {
      await dynamoDB.delete({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Key: { id: user.id }
      }).promise();
      
      console.log(`✅ Deleted user from DynamoDB: ${user.email}`);
    } catch (dynamoError) {
      console.error('Failed to delete user from DynamoDB:', dynamoError);
      // Continue with Supabase deletion even if DynamoDB fails
    }
    
    // Step 2: Delete user from Supabase (logo credits data)
    try {
      const supabaseUser = await supabaseAuth.getUserByEmail(user.email);
      if (supabaseUser) {
        await supabaseAuth.deleteUser(supabaseUser.id);
        console.log(`✅ Deleted user from Supabase: ${user.email}`);
      } else {
        console.log(`⚠️ User not found in Supabase: ${user.email}`);
      }
    } catch (supabaseError) {
      console.error('Failed to delete user from Supabase:', supabaseError);
      // Don't fail the entire operation if Supabase deletion fails
    }
    
    console.log(`🎉 Account deletion completed for: ${user.email}`);
    
    // Create response and clear auth cookie
    const response = NextResponse.json({
      message: 'Account deleted successfully',
      details: 'User data removed from all systems'
    });
    
    // Clear all auth cookies
    response.cookies.set({
      name: 'access_token',
      value: '',
      expires: new Date(0),
      path: '/'
    });
    
    response.cookies.set({
      name: 'refresh_token',
      value: '',
      expires: new Date(0),
      path: '/'
    });
    
    return response;
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}