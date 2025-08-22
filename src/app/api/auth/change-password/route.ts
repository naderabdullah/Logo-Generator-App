// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '../../../../lib/auth-utils';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get current user from auth token
    const user = await getCurrentUser(request);
    
    if (!user || typeof user !== 'object' || !('email' in user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { newPassword } = await request.json();

    console.log(`Changing password for user: ${user.email}`);

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password in DynamoDB
    try {
      await dynamoDB.update({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
        Key: { id: user.id },
        UpdateExpression: 'SET password = :password, passwordUpdatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':password': hashedPassword,
          ':updatedAt': new Date().toISOString()
        }
      }).promise();

      console.log(`✅ Password updated successfully for user: ${user.email}`);

      return NextResponse.json(
        { success: true, message: 'Password changed successfully' },
        { status: 200 }
      );

    } catch (dynamoError) {
      console.error('Failed to update password in DynamoDB:', dynamoError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing your password. Please try again.' },
      { status: 500 }
    );
  }
}