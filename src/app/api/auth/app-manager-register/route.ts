// Create this file: src/app/api/auth/app-manager-register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface AppManagerRegistrationData {
  email: string;
  password: string;
  token: string;
  appId: string;
  linkType: string;
  subappId?: string;
  orderNumber?: string;
}

// Function to call App Manager API directly (server-side)
async function callAppManagerAPI(registrationData: AppManagerRegistrationData) {
  try {
    const apiEndpoint = process.env.API_ENDPOINT; // Server-side env var
    const apiKey = process.env.API_KEY; // Server-side env var
    
    if (!apiEndpoint || !apiKey) {
      throw new Error('App Manager API configuration missing');
    }
    
    const apiUrl = `${apiEndpoint}/app-manager?action=verifyAppPurchase`;
    
    console.log('Calling App Manager API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(registrationData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('App Manager API Error:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('App Manager API Success:', data);
    return data;
    
  } catch (error: any) {
    console.error('Error calling App Manager API:', error);
    throw error;
  }
}

// Function to determine logo limit based on registration type
function determineLogoLimit(linkType: string, subappId?: string): number {
  if (subappId === 'premium' || linkType === 'premium') {
    return 100;
  }
  if (linkType === 'generic') {
    return 25;
  }
  return 10; // specific or default
}

// Function to determine subscription type
function determineSubscriptionType(linkType: string, subappId?: string): string {
  if (subappId === 'premium' || linkType === 'premium') {
    return 'premium';
  }
  if (linkType === 'generic') {
    return 'standard';
  }
  return 'basic';
}

// Function to create user in Supabase with App Manager data
async function createSupabaseUserFromAppManager(
  registrationData: AppManagerRegistrationData, 
  appManagerResponse: any
) {
  try {
    console.log('Creating user in Supabase from App Manager registration...');
    
    // Determine logo limits and subscription type based on registration
    const logoLimit = 5;
    const subscriptionType = determineSubscriptionType(registrationData.linkType, registrationData.subappId);
    
    console.log(`Logo limit: ${logoLimit}, Subscription: ${subscriptionType}`);
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    
    // Check if user already exists in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', registrationData.email.toLowerCase())
      .single();
    
    if (existingUser) {
      console.log(`User ${registrationData.email} already exists in Supabase, updating...`);
      
      // Update existing user with new subscription info
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          logosLimit: logoLimit,
          subscription_type: subscriptionType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      
      return updatedUser;
    } else {
      console.log(`Creating new user ${registrationData.email} in Supabase...`);
      
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: registrationData.email.toLowerCase(),
          password: hashedPassword,
          logosCreated: 0,
          logosLimit: logoLimit,
          subscription_type: subscriptionType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      console.log(`✅ Successfully created user in Supabase: ${registrationData.email} (${logoLimit} logo credits)`);
      return newUser;
    }
  } catch (error) {
    console.error('Error in createSupabaseUserFromAppManager:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const registrationData: AppManagerRegistrationData = await request.json();
    
    console.log('Processing dual registration for:', registrationData.email);
    console.log('Registration type:', registrationData.linkType, registrationData.subappId);
    
    // Validate required fields
    if (!registrationData.email || !registrationData.password || !registrationData.token) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, or token' },
        { status: 400 }
      );
    }
    
    // Step 1: Register with App Manager (direct API call)
    console.log('Step 1: Registering with App Manager...');
    let appManagerResponse;
    try {
      appManagerResponse = await callAppManagerAPI(registrationData);
      console.log('✅ App Manager registration successful');
    } catch (appManagerError: any) {
      console.error('App Manager registration failed:', appManagerError);
      return NextResponse.json(
        { 
          error: 'App Manager registration failed', 
          details: appManagerError.message || 'Unknown error'
        },
        { status: 400 }
      );
    }
    
    // Step 2: Create user in Supabase (new unified table)
    console.log('Step 2: Creating user in Supabase...');
    let supabaseUser;
    try {
      supabaseUser = await createSupabaseUserFromAppManager(registrationData, appManagerResponse);
      console.log('✅ Supabase user creation successful');
    } catch (supabaseError: any) {
      console.error('Supabase user creation failed:', supabaseError);
      
      // App Manager registration succeeded but Supabase failed
      console.error(`CRITICAL: User ${registrationData.email} registered in App Manager but failed in Supabase`);
      
      return NextResponse.json(
        { 
          error: 'Registration partially completed. Please contact support.',
          details: 'App Manager registration succeeded but user setup failed.'
        },
        { status: 500 }
      );
    }
    
    // Step 3: Return success with both confirmations
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      appManager: {
        status: 'registered',
        response: appManagerResponse
      },
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        logosCreated: supabaseUser.logosCreated,
        logosLimit: supabaseUser.logosLimit,
        subscription_type: supabaseUser.subscription_type
      }
    });
    
  } catch (error: any) {
    console.error('Error in dual registration:', error);
    return NextResponse.json(
      { 
        error: 'Registration failed', 
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}