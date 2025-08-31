// src/app/api/auth/send-password-reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// This will call your Lambda function to handle the password reset
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Call your Lambda function to handle the password reset
    // The Lambda should:
    // 1. Check if user exists in DynamoDB
    // 2. Store the reset token and expiry in the user's record
    // 3. Send the email with the reset link
    const lambdaResponse = await fetch(process.env.LAMBDA_PASSWORD_RESET_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LAMBDA_API_KEY || '',
      },
      body: JSON.stringify({
        action: 'sendPasswordReset',
        email,
        resetToken,
        tokenExpiry,
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`,
      }),
    });

    if (!lambdaResponse.ok) {
      const error = await lambdaResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to send reset email' },
        { status: lambdaResponse.status }
      );
    }

    return NextResponse.json(
      { message: 'Password reset link sent to your email' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Send password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}