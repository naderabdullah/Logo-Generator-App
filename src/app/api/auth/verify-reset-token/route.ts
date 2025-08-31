// src/app/api/auth/verify-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Call your Lambda function to verify the token
    const lambdaResponse = await fetch(`${process.env.API_ENDPOINT}/app-manager?action=verifyResetToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.API_KEY || '',
      },
      body: JSON.stringify({
        // ✅ NO action in body
        email,
        resetToken: token,
      }),
    });

    if (!lambdaResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { error: 'Failed to verify reset token' },
      { status: 500 }
    );
  }
}