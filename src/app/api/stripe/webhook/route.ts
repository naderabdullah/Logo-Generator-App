// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDB } from 'aws-sdk';
import { buffer } from 'micro';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
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

// Function to update user's logo limit
async function updateUserLogoLimit(userId: string, quantity: number) {
  try {
    // Get current user data
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: parseInt(userId) }
    }).promise();
    
    const user = result.Item;
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Calculate new limit
    const currentLimit = user.logosLimit || 0;
    const newLimit = currentLimit + quantity;
    
    // Update the user's logo limit
    await dynamoDB.update({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: parseInt(userId) },
      UpdateExpression: 'SET logosLimit = :newLimit',
      ExpressionAttributeValues: {
        ':newLimit': newLimit
      }
    }).promise();
    
    console.log(`User ${userId} logo limit updated from ${currentLimit} to ${newLimit}`);
    return { success: true, newLimit };
  } catch (error) {
    console.error('Error updating user logo limit:', error);
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
        
        // Update user's logo limit
        await updateUserLogoLimit(userId, quantity);
        
        // Log successful payment
        console.log(`Payment successful for user ${userId}, added ${quantity} logo credits`);
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