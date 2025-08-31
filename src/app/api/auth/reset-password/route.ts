// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword } = await request.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: 'Token, email, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Call your Lambda function to reset the password
    const lambdaResponse = await fetch(process.env.LAMBDA_PASSWORD_RESET_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LAMBDA_API_KEY || '',
      },
      body: JSON.stringify({
        action: 'resetPassword',
        email,
        resetToken: token,
        newPasswordHash: hashedPassword,
      }),
    });

    if (!lambdaResponse.ok) {
      const error = await lambdaResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to reset password' },
        { status: lambdaResponse.status }
      );
    }

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}