// src/app/api/stripe/webhook/route.ts - CORRECTED VERSION
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

// Helper to read the raw body from the request
async function getRawBody(request: NextRequest): Promise<Buffer> {
  const chunks = [];
  const reader = request.body!.getReader();
  let result;
  do {
    result = await reader.read();
    if (result.value) {
      chunks.push(result.value);
    }
  } while (!result.done);
  return Buffer.concat(chunks);
}


// This function now correctly updates the logo limit in Supabase
async function updateUserLogoLimit(userId: string, quantity: number) {
  try {
    console.log(`Starting credit update for user ID: ${userId}, adding ${quantity} credits.`);

    // 1. Get user email from DynamoDB using their ID
    const dynamoResult = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: parseInt(userId, 10) }
    }).promise();

    if (!dynamoResult.Item) {
      throw new Error(`User with ID ${userId} not found in DynamoDB.`);
    }
    const userEmail = dynamoResult.Item.email;
    console.log(`Found user in DynamoDB: ${userEmail}`);

    // 2. Get current user data from Supabase using the email
    const supabaseUser = await supabaseAuth.getUserByEmail(userEmail);
    if (!supabaseUser) {
      throw new Error(`User with email ${userEmail} not found in Supabase.`);
    }
    console.log(`Found user in Supabase with current limit: ${supabaseUser.logosLimit}`);

    // 3. Calculate the new limit by adding the purchased quantity
    const currentLimit = supabaseUser.logosLimit || 0;
    const newLimit = currentLimit + quantity;

    console.log(`Updating Supabase user ${userEmail} logo limit from ${currentLimit} to ${newLimit}`);

    // 4. Update the user's logo limit in Supabase
    const updatedUser = await supabaseAuth.updateUser(supabaseUser.id, {
      logosLimit: newLimit
    });

    console.log(`✅ Successfully updated logo limit for ${userEmail} to ${updatedUser.logosLimit}.`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error updating user logo limit:', error);
    // It's important to throw the error so the webhook can be retried if configured
    throw error;
  }
}


// Disable Next.js body parsing for this route to access the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook secret is not set.');
    return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 500 });
  }

  const rawBody = await getRawBody(request);
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      const quantityStr = session.metadata?.quantity;
      const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

      if (!userId || !quantity) {
        console.error('Missing userId or quantity in session metadata:', session.metadata);
        return NextResponse.json({ error: 'Missing required metadata in Stripe session.' }, { status: 400 });
      }

      try {
        // Update user's logo limit in Supabase
        await updateUserLogoLimit(userId, quantity);
        console.log(`Payment successful for user ${userId}. Added ${quantity} credits.`);
      } catch (error) {
        console.error(`Failed to update credits for user ${userId}:`, error);
        // Return a 500 to indicate to Stripe that the webhook failed and should be retried.
        return NextResponse.json({ error: 'Failed to update user credits.' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}