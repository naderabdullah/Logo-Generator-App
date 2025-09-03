// src/app/api/stripe/webhook/route.ts - REFACTORED FOR APPUSERS TABLE
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

const APP_ID = 'logo-generator';

// Initialize Stripe only if the API key is available
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
  });
}

// Initialize DynamoDB client for AppUsers lookup
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Helper function to parse the raw body
async function getRawBody(request: NextRequest): Promise<Buffer> {
  const text = await request.text();
  return Buffer.from(text);
}

// Function to update user's logo limit using AppUsers table
async function updateUserLogoLimit(userEmail: string, appId: string, quantity: number) {
  try {
    console.log(`🔍 Starting credit update for user: ${userEmail} (AppId: ${appId}), adding ${quantity} credits`);

    // Step 1: Verify user exists in AppUsers table using EmailIndex GSI
    const appUsersResult = await dynamoDB.query({
      TableName: 'AppUsers',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'Email = :email AND AppId = :appId',
      ExpressionAttributeValues: {
        ':email': userEmail.toLowerCase(),
        ':appId': appId
      }
    }).promise();

    if (!appUsersResult.Items || appUsersResult.Items.length === 0) {
      throw new Error(`User ${userEmail} not found in AppUsers table for AppId: ${appId}`);
    }

    const appUser = appUsersResult.Items[0];
    console.log(`✅ Found user in AppUsers: ${appUser.Email} (Status: ${appUser.Status})`);

    // Step 2: Verify user is active
    if (appUser.Status !== 'active' && appUser.Status !== 'pending') {
      throw new Error(`User ${userEmail} has invalid status: ${appUser.Status}`);
    }

    // Step 3: Get current user data from Supabase for logo credits
    const supabaseUser = await supabaseAuth.getUserByEmail(userEmail);

    if (!supabaseUser) {
      // If user doesn't exist in Supabase, create them with the purchased credits
      console.log(`📝 User ${userEmail} not found in Supabase, creating with ${quantity} credits`);

      const newUser = await supabaseAuth.createUser({
        email: userEmail,
        logosCreated: 0,
        logosLimit: quantity // Start with the purchased amount
      });

      console.log(`✅ Created new Supabase user: ${userEmail} with ${quantity} logo credits`);
      return { success: true, newLimit: quantity, created: true };
    }

    // Step 4: Calculate new limit - ALWAYS add to existing limit
    const currentLimit = supabaseUser.logosLimit || 0;
    const newLimit = currentLimit + quantity;

    console.log(`📊 Updating Supabase user ${userEmail} logo limit: ${currentLimit} + ${quantity} = ${newLimit}`);

    // Step 5: Update the user's logo limit in Supabase
    const updatedUser = await supabaseAuth.updateUser(supabaseUser.id, {
      logosLimit: newLimit
    });

    console.log(`✅ User ${userEmail} logo limit updated from ${currentLimit} to ${newLimit} in Supabase`);
    return { success: true, newLimit, updatedUser, created: false };

  } catch (error) {
    console.error(`❌ Error updating user logo limit for ${userEmail}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return NextResponse.json(
          { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' },
          { status: 500 }
      );
    }

    // Get the raw body for signature verification
    const rawBody = await getRawBody(request);

    // Get the signature from the request headers
    const signature = request.headers.get('stripe-signature') || '';

    if (!signature) {
      return NextResponse.json(
          { error: 'Missing Stripe signature' },
          { status: 400 }
      );
    }

    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
          { error: `Webhook Error: ${err.message}` },
          { status: 400 }
      );
    }

    console.log(`🎯 Processing Stripe webhook event: ${event.type}`);

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log(`💳 Processing payment for session: ${session.id}`);
      console.log(`💰 Payment status: ${session.payment_status}`);
      console.log(`📋 Metadata:`, session.metadata);

      // Check if the payment was successful
      if (session.payment_status === 'paid') {

        // Get required metadata (new format only)
        const userEmail = session.metadata?.userEmail;
        const appId = session.metadata?.appId;
        const quantity = parseInt(session.metadata?.quantity || '0');

        // Validate required metadata
        if (!userEmail || !appId || !quantity || quantity <= 0) {
          console.error('❌ Missing or invalid required metadata:', {
            userEmail,
            appId,
            quantity,
            allMetadata: session.metadata
          });
          return NextResponse.json(
              { error: 'Missing required metadata: userEmail, appId, and quantity are required' },
              { status: 400 }
          );
        }

        console.log(`✅ Processing payment: email=${userEmail}, appId=${appId}, quantity=${quantity}`);

        // Update user logo credits
        const result = await updateUserLogoLimit(userEmail, appId, quantity);

        console.log(`🎉 Payment processing completed successfully:`, {
          sessionId: session.id,
          userEmail,
          appId,
          quantity,
          result
        });

      } else {
        console.log(`⚠️ Payment not completed. Status: ${session.payment_status}`);
      }
    }

    // Return success response
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
        { error: error.message || 'Webhook handler failed' },
        { status: 500 }
    );
  }
}

// Disable body parsing for this route (required for Stripe webhooks)
export const config = {
  api: {
    bodyParser: false,
  },
};