// src/app/api/auth/send-password-reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// This will call your Lambda function to handle the password reset
// Quick debug - replace your password reset route temporarily
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🔍 Environment check:', {
      hasApiEndpoint: !!process.env.API_ENDPOINT,
      hasApiKey: !!process.env.API_KEY,
      endpoint: process.env.API_ENDPOINT,
      apiKey: process.env.API_KEY
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000;

    console.log('🔍 About to call Lambda...');

// In your password reset route:
    let lambdaResponse;
    try {
      console.log('🔍 About to call Lambda...');

      lambdaResponse = await fetch(`${process.env.API_ENDPOINT}/app-manager?action=sendPasswordReset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.API_KEY || '',
        },
        body: JSON.stringify({
          email,
          resetToken,
          tokenExpiry,
          resetUrl: `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`,
        }),
      });

      console.log('✅ Fetch completed, status:', lambdaResponse.status);

    } catch (fetchError) {
      console.error('❌ Fetch failed completely:', fetchError);
      console.error('❌ Error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      });

      return NextResponse.json(
          { error: 'Network error: ' + fetchError.message },
          { status: 500 }
      );
    }

    console.log('🔍 Lambda response status:', lambdaResponse.status);
    console.log('🔍 Lambda response headers:', Object.fromEntries(lambdaResponse.headers.entries()));

    // Get the RAW response text first
    const responseText = await lambdaResponse.text();
    console.log('🔍 Lambda RAW response:', responseText);

    if (!lambdaResponse.ok) {
      // Return the actual Lambda error for debugging
      return NextResponse.json({
        error: 'Lambda Error Details',
        lambdaStatus: lambdaResponse.status,
        lambdaResponse: responseText,
        debugInfo: 'Check server console for full details'
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Success' });

  } catch (error) {
    console.error('❌ Outer catch error:', error);
    return NextResponse.json({
      error: 'Network/Connection Error',
      details: error.message
    }, { status: 500 });
  }
}