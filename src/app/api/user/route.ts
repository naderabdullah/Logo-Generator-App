// src/app/api/user/route.ts - UPDATED for Supabase
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAuth } from '../../../lib/supabaseAuth';

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
    
    // Get user from Supabase
    const user = await supabaseAuth.getUserById(decoded.id);
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// GET endpoint - Return user's data and logo usage statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      email: user.email,
      logosCreated: user.logosCreated,
      logosLimit: user.logosLimit,
      remainingLogos: Math.max(0, user.logosLimit - user.logosCreated),
      subscription_type: user.subscription_type
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - Update user data (e.g., after upgrading plan)
export async function PATCH(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { logosLimit, subscription_type } = await request.json();
    
    // Validate input
    if (logosLimit !== undefined && (logosLimit < 0 || !Number.isInteger(logosLimit))) {
      return NextResponse.json(
        { error: 'Invalid logos limit' },
        { status: 400 }
      );
    }
    
    // Update user in Supabase
    const updates: any = {};
    if (logosLimit !== undefined) updates.logosLimit = logosLimit;
    if (subscription_type !== undefined) updates.subscription_type = subscription_type;
    
    const updatedUser = await supabaseAuth.updateUser(user.id, updates);
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        email: updatedUser.email,
        logosCreated: updatedUser.logosCreated,
        logosLimit: updatedUser.logosLimit,
        remainingLogos: Math.max(0, updatedUser.logosLimit - updatedUser.logosCreated),
        subscription_type: updatedUser.subscription_type
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}