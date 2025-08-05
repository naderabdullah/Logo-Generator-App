// src/app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';

// Initialize Stripe only if the API key is available
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
  });
}

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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
    
    // Get user from DynamoDB
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: decoded.id }
    }).promise();
    
    return result.Item;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
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
    // Get the current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { quantity, priceUsd, email } = await request.json();
    
    // Validate input
    if (!quantity || !priceUsd) {
      return NextResponse.json(
        { error: 'Quantity and price are required' },
        { status: 400 }
      );
    }
    
    // Ensure the quantity and price match our allowed options
    const validOptions = [
      { quantity: 1, price: 4.95 },
      { quantity: 3, price: 9.95 },
      { quantity: 6, price: 14.95 },
      { quantity: 9, price: 19.95 }
    ];
    
    const isValidOption = validOptions.some(
      option => option.quantity === quantity && option.price === priceUsd
    );
    
    if (!isValidOption) {
      return NextResponse.json(
        { error: 'Invalid quantity or price' },
        { status: 400 }
      );
    }
    
    // Convert price to cents for Stripe
    const priceInCents = Math.round(priceUsd * 100);
    
    // Get the domain URL for success/cancel URLs
    const domainURL = process.env.SITE_URL || 'http://localhost:3000';
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${quantity} Logo Credit${quantity > 1 ? 's' : ''}`,
              description: `Generate ${quantity} professional logo${quantity > 1 ? 's' : ''} with our AI Logo Generator. Includes 3 free revisions${quantity > 1 ? ' per logo.' : '.'} ${quantity > 1 ? `(${quantity*3} Revisions total)` : ''}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domainURL}/purchase?payment=success&quantity=${quantity}`,
      cancel_url: `${domainURL}/account?payment=cancelled`,
      customer_email: email || user.email,
      metadata: {
        userId: user.id.toString(),
        quantity: quantity.toString(),
      },
    });
    
    // Return the checkout session URL
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}