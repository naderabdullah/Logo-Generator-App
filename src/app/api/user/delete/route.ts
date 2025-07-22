// src/app/api/user/delete/route.ts - UPDATED for Supabase
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

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
    ) as { id: number };
    
    // Get user from Supabase
    const user = await supabaseAuth.getUserById(decoded.id);
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// DELETE endpoint - Delete user account
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
    
    // Delete user from Supabase
    await supabaseAuth.deleteUser(user.id);
    
    console.log(`User account deleted: ${user.email}`);
    
    // Create response and clear auth cookie
    const response = NextResponse.json({
      message: 'Account deleted successfully'
    });
    
    // Clear auth cookie
    response.cookies.set({
      name: 'access_token',
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