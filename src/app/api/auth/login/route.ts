// src/app/api/auth/login/route.ts - UPDATED for Supabase
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

// Function to generate JWT token
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
    console.log('=== LOGIN API CALLED (Supabase) ===');
    
    // Parse request body
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login attempt for:', email);
    
    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Get user by email from Supabase
    const user = await supabaseAuth.getUserByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('User found, checking password...');
    
    // Compare passwords
    const isMatch = await supabaseAuth.comparePasswords(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('Login successful for:', email);
    
    // Generate JWT token
    const token = generateToken(user.id, user.email);
    
    // Create response with user data
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        email: user.email,
        logosCreated: user.logosCreated,
        logosLimit: user.logosLimit,
        remainingLogos: Math.max(0, user.logosLimit - user.logosCreated)
      }
    });
    
    // Set auth cookie
    return setAuthCookie(response, token);
    
  } catch (error: any) {
    console.error('=== LOGIN API ERROR ===');
    console.error('Error details:', error);
    
    return NextResponse.json(
      { error: 'Login failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Login API endpoint. Use POST to authenticate.' },
    { status: 200 }
  );
}