// src/app/api/auth/signup/route.ts - UPDATED for Supabase
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

// Function to generate JWT tokens
function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret',
    { expiresIn: '7d' }
  );
}

// Function to set auth cookie
function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: 'access_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  });
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIGNUP API CALLED (Supabase) ===');
    
    // Parse request body
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const exists = await supabaseAuth.emailExists(email);
    if (exists) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Create user in Supabase
    const user = await supabaseAuth.createUser({
      email,
      password,
      logosLimit: 10, // Default for direct signups
      subscription_type: 'standard'
    });
    
    console.log(`✅ Created Supabase user: ${email} with ${user.logosLimit} logo credits`);
    
    // Generate JWT token
    const token = generateToken(user.id, user.email);
    
    // Create response
    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          email: user.email,
          logosCreated: user.logosCreated,
          logosLimit: user.logosLimit
        }
      },
      { status: 201 }
    );
    
    // Set auth cookie
    return setAuthCookie(response, token);
    
  } catch (error: any) {
    console.error('=== SIGNUP API ERROR ===');
    console.error('Error details:', error);
    
    return NextResponse.json(
      { error: 'Failed to register user: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}