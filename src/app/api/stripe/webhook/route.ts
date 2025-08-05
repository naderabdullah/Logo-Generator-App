// src/app/api/stripe/webhook/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

// Initialize Stripe only if the API key is available
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
  });
}

// Initialize DynamoDB client (still needed to get user email from ID)
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

// FIXED: Function to update user's logo limit in SUPABASE (not DynamoDB)
async function updateUserLogoLimit(userId: string, quantity: number) {
  try {
    console.log(`Starting credit update for user ${userId}, adding ${quantity} credits`);
    
    // Step 1: Get user email from DynamoDB using their ID
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: parseInt(userId) }
    }).promise();
    
    const dynamoUser = result.Item;
    
    if (!dynamoUser) {
      throw new Error(`User with ID ${userId} not found in DynamoDB`);
    }
    
    console.log(`Found user in DynamoDB: ${dynamoUser.email}`);
    
    // Step 2: Get current user data from Supabase
    const supabaseUser = await supabaseAuth.getUserByEmail(dynamoUser.email);
    
    if (!supabaseUser) {
      // If user doesn't exist in Supabase, create them with the purchased credits
      console.log(`User ${dynamoUser.email} not found in Supabase, creating with ${quantity} credits`);
      
      const newUser = await supabaseAuth.createUser({
        email: dynamoUser.email,
        logosCreated: 0,
        logosLimit: quantity // Start with the purchased amount
      });
      
      console.log(`Created new Supabase user: ${dynamoUser.email} with ${quantity} logo credits`);
      return { success: true, newLimit: quantity };
    }
    
    // Step 3: Calculate new limit - ALWAYS add to existing limit
    const currentLimit = supabaseUser.logosLimit || 0;
    const newLimit = currentLimit + quantity;
    
    console.log(`Updating Supabase user ${dynamoUser.email} logo limit: ${currentLimit} + ${quantity} = ${newLimit}`);
    
    // Step 4: Update the user's logo limit in SUPABASE
    const updatedUser = await supabaseAuth.updateUser(supabaseUser.id, {
      logosLimit: newLimit
    });
    
    console.log(`✅ User ${dynamoUser.email} logo limit updated from ${currentLimit} to ${newLimit} in Supabase`);
    return { success: true, newLimit, updatedUser };
    
  } catch (error) {
    console.error('❌ Error updating user logo limit:', error);
    throw error;
  }
}

// Disable body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

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
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if the payment was successful
      if (session.payment_status === 'paid') {
        // Get user ID and quantity from metadata
        const userId = session.metadata?.userId;
        const quantity = parseInt(session.metadata?.quantity || '0');
        
        if (!userId || !quantity) {
          console.error('Missing userId or quantity in session metadata');
          return NextResponse.json(
            { error: 'Missing metadata' },
            { status: 400 }
          );
        }
        
        // FIXED: Update user's logo limit in SUPABASE (not DynamoDB)
        await updateUserLogoLimit(userId, quantity);
        
        // Log successful payment
        console.log(`✅ Payment successful for user ${userId}, added ${quantity} logo credits to Supabase`);
      }
    }
    
    // Return success response
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}