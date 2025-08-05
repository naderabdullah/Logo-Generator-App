// src/app/api/stripe/webhook/route.ts - MORE ROBUST VERSION WITH DETAILED LOGGING
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from '../../../../lib/supabaseAuth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Initialize DynamoDB client
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

// Function to update user's logo limit in Supabase
async function updateUserLogoLimit(userId: string, quantity: number) {
  console.log(`--- Starting credit update for DynamoDB User ID: ${userId}, adding ${quantity} credits. ---`);

  // Step 1: Get user from DynamoDB to find their email
  let dynamoUser;
  try {
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: parseInt(userId, 10) }
    }).promise();
    dynamoUser = result.Item;

    if (!dynamoUser) {
      throw new Error(`User with ID ${userId} not found in DynamoDB.`);
    }
    console.log(`Step 1/4: Found user in DynamoDB. Email: ${dynamoUser.email}`);
  } catch (error) {
    console.error('❌ DYNAMODB FETCH FAILED:', error);
    throw new Error('Failed to retrieve user data from primary database.');
  }

  // Step 2: Get current user data from Supabase using the email
  let supabaseUser;
  try {
    supabaseUser = await supabaseAuth.getUserByEmail(dynamoUser.email);
    if (!supabaseUser) {
      // This is an edge case. If the user authenticated via DynamoDB but doesn't have a Supabase record for credits.
      console.log(`Step 2/4: User ${dynamoUser.email} not found in Supabase. Creating a new record.`);
      const newUser = await supabaseAuth.createUser({
        email: dynamoUser.email,
        logosCreated: 0,
        logosLimit: quantity // Set the initial limit to the purchased amount
      });
      console.log(`✅ New Supabase record created for ${dynamoUser.email} with ${quantity} logo credits.`);
      return { success: true };
    }
    console.log(`Step 2/4: Found user in Supabase. Current limit: ${supabaseUser.logosLimit}`);
  } catch (error) {
    console.error('❌ SUPABASE FETCH FAILED:', error);
    throw new Error('Failed to retrieve user data from credits database.');
  }

  // Step 3: Calculate the new logo limit
  const currentLimit = supabaseUser.logosLimit || 0;
  const newLimit = currentLimit + quantity;
  console.log(`Step 3/4: Calculating new limit: ${currentLimit} (current) + ${quantity} (purchased) = ${newLimit} (new)`);

  // Step 4: Update the user's logo limit in Supabase
  try {
    const updatedUser = await supabaseAuth.updateUser(supabaseUser.id, {
      logosLimit: newLimit
    });
    console.log(`Step 4/4: Supabase user ${dynamoUser.email} logo limit updated to ${updatedUser.logosLimit}.`);
    console.log(`✅ Credit update successful for ${dynamoUser.email}.`);
    return { success: true };
  } catch (error) {
    console.error('❌ SUPABASE UPDATE FAILED:', error);
    throw new Error('Failed to update user credits in database.');
  }
}

// Disable Next.js body parsing for this route to access the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  console.log('--- Stripe Webhook Received ---');
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe environment variables are not set.');
    return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
  }

  const rawBody = await getRawBody(request);
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook request is missing the Stripe-Signature header.');
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`Webhook event verified: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`Processing checkout.session.completed for session: ${session.id}`);

    if (session.payment_status === 'paid') {
      console.log('Payment status is "paid".');
      const userId = session.metadata?.userId;
      const quantityStr = session.metadata?.quantity;
      const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

      if (!userId || !quantity) {
        console.error('❌ Missing critical metadata. UserID:', userId, 'Quantity:', quantity);
        return NextResponse.json({ error: 'Missing required metadata in Stripe session.' }, { status: 400 });
      }

      console.log(`Metadata found - UserID: ${userId}, Quantity: ${quantity}`);

      try {
        await updateUserLogoLimit(userId, quantity);
      } catch (error: any) {
        console.error(`Failed to process webhook event for user ${userId}:`, error.message);
        return NextResponse.json({ error: 'Webhook handler failed during credit update.' }, { status: 500 });
      }

    } else {
      console.log(`Payment status is "${session.payment_status}". No action taken.`);
    }
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}