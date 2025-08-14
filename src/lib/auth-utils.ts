// src/lib/auth-utils.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from './supabaseAuth';
import { isSuperUser, getSuperUserStatus } from './superuser-config';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Enhanced user interface with superuser information
export interface AuthenticatedUser {
  id: number;
  supabaseId?: number;
  email: string;
  logosCreated: number;
  logosLimit: number;
  status: string;
  isSuperUser: boolean;
  superUserPrivilege?: string;
}

/**
 * Enhanced getCurrentUser with superuser support
 * This replaces the existing getCurrentUser functions across your API routes
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null | 'not_allowed'> {
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

    // Get user auth data from DynamoDB
    const dynamoResult = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: decoded.id }
    }).promise();

    if (!dynamoResult.Item) {
      return null;
    }

    const user = dynamoResult.Item;
    const userStatus = user.Status || user.status;
    const email = user.email;

    // Check superuser status
    const superUserStatus = getSuperUserStatus(email);

    // Superusers bypass status checks
    if (superUserStatus.isSuperUser) {
      // Still get Supabase data if available
      const supabaseUser = await supabaseAuth.getUserByEmail(email);
      
      return {
        id: user.id,
        supabaseId: supabaseUser?.id,
        email: email,
        logosCreated: supabaseUser?.logosCreated || 0,
        logosLimit: supabaseUser?.logosLimit || 999999, // High limit for superusers
        status: userStatus,
        isSuperUser: true,
        superUserPrivilege: superUserStatus.privilege
      };
    }

    // Regular user status checks (active or pending only)
    if (userStatus !== 'active' && userStatus !== 'pending') {
      console.log('User account status does not allow access, status:', userStatus, 'for email:', email);
      return 'not_allowed';
    }

    // Get user logo credits from Supabase for regular users
    const supabaseUser = await supabaseAuth.getUserByEmail(email);

    if (!supabaseUser) {
      return null;
    }

    // Return regular user data
    return {
      id: user.id,
      supabaseId: supabaseUser.id,
      email: email,
      logosCreated: supabaseUser.logosCreated,
      logosLimit: supabaseUser.logosLimit,
      status: userStatus,
      isSuperUser: false
    };

  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Simple helper to check if current user is a superuser
 */
export async function isCurrentUserSuperUser(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user !== null && user !== 'not_allowed' && user.isSuperUser;
}

/**
 * Middleware helper for superuser-only routes
 */
export async function requireSuperUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const user = await getCurrentUser(request);
  
  if (!user || user === 'not_allowed' || !user.isSuperUser) {
    return null;
  }
  
  return user;
}

/**
 * Enhanced user data response format
 */
export function formatUserResponse(user: AuthenticatedUser) {
  return {
    email: user.email,
    logosCreated: user.logosCreated || 0,
    logosLimit: user.logosLimit || 0,
    remainingLogos: Math.max(0, (user.logosLimit || 0) - (user.logosCreated || 0)),
    status: user.status,
    isSuperUser: user.isSuperUser,
    superUserPrivilege: user.superUserPrivilege
  };
}