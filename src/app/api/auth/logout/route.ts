// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Create response
  const response = NextResponse.json({
    message: 'Logged out successfully'
  });
  
  // Clear auth cookie
  response.cookies.set({
    name: 'access_token',
    value: '',
    expires: new Date(0),
    path: '/'
  });
  
  return response;
}