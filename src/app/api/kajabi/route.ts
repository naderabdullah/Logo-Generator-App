// src/app/api/kajabi/route.ts - UPDATED with correct field mappings for Kajabi webhooks
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('=== KAJABI WEBHOOK WITH AUTH ===');

    try {
        const body = await request.text();
        const kajabiData = JSON.parse(body);

        // Log the raw webhook data for debugging
        console.log('Raw Kajabi webhook received:', JSON.stringify(kajabiData, null, 2));

        // Extract order data based on webhook type
        let email: string = '';
        let productName: string = '';
        let amount: number = 0;
        let eventType: string = kajabiData.event || 'unknown';

        if (kajabiData.event === 'payment.succeeded') {
            // Payment.succeeded webhook structure
            email = kajabiData.member?.email || '';
            productName = kajabiData.offer?.title || '';
            amount = kajabiData.payment_transaction?.amount_paid || 0;

        } else if (kajabiData.event === 'purchase.created') {
            // Purchase.created webhook structure
            email = kajabiData.payload?.member_email || '';
            productName = kajabiData.payload?.offer_title || '';
            amount = kajabiData.payload?.amount_paid || 0;

        } else {
            // Try to handle unknown webhook format (fallback to old structure)
            email = kajabiData.contact?.email || kajabiData.member?.email || '';
            productName = kajabiData.offer?.name || kajabiData.offer?.title || '';
            amount = kajabiData.amount || kajabiData.payment_transaction?.amount_paid || 0;
        }

        console.log('Kajabi order received:', {
            id: kajabiData.id,
            event: eventType,
            email: email,
            product: productName,
            amount: amount
        });

        // Extract order data
        const orderNumber = `kaj_${kajabiData.id}`;
        const cleanEmail = email.toLowerCase();

        if (!kajabiData.id || !cleanEmail) {
            console.log('Missing required data:', {
                hasId: !!kajabiData.id,
                hasEmail: !!cleanEmail,
                rawEmail: email
            });
            return NextResponse.json({
                error: 'Missing required data',
                details: {
                    id: kajabiData.id ? 'present' : 'missing',
                    email: cleanEmail ? 'present' : 'missing'
                },
                event: eventType
            }, { status: 400 });
        }

        // Step 1: Authenticate as kajabi-direct@system.com to get JWT token
        const authToken = await authenticateKajabiDistributor();

        // Step 2: Call App Manager API with proper JWT authentication
        const result = await callAppManagerAPIWithAuth(orderNumber, {
            ...kajabiData,
            // Add normalized fields
            normalizedEmail: cleanEmail,
            normalizedProductName: productName,
            normalizedAmount: amount,
            eventType: eventType
        }, authToken);

        console.log('✅ Order created successfully:', orderNumber);
        return NextResponse.json({
            success: true,
            message: "Kajabi order processed successfully",
            orderNumber: orderNumber,
            eventType: eventType,
            result: result
        });

    } catch (error: any) {
        console.error('❌ Webhook error:', error);
        return NextResponse.json({
            error: 'Webhook failed',
            details: error.message
        }, { status: 500 });
    }
}

// Authenticate as kajabi-direct@system.com distributor
async function authenticateKajabiDistributor() {
    if (!process.env.API_ENDPOINT || !process.env.API_KEY) {
        throw new Error('Missing API configuration');
    }

    if (!process.env.KAJABI_DISTRIBUTOR_PASSWORD) {
        throw new Error('Missing KAJABI_DISTRIBUTOR_PASSWORD environment variable');
    }

    console.log('Authenticating as kajabi-direct@system.com...');

    const loginResponse = await fetch(`${process.env.API_ENDPOINT}/app-manager?action=verifyCredentials`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.API_KEY,
        },
        body: JSON.stringify({
            email: 'kajabi-direct@system.com',
            password: process.env.KAJABI_DISTRIBUTOR_PASSWORD
        }),
    });

    const loginResponseText = await loginResponse.text();
    console.log('Login response:', loginResponse.status, loginResponseText);

    if (!loginResponse.ok) {
        throw new Error(`Authentication failed: ${loginResponse.status} - ${loginResponseText}`);
    }

    const loginData = JSON.parse(loginResponseText);
    return loginData.token;
}

// Call App Manager API with JWT authentication
async function callAppManagerAPIWithAuth(orderNumber: string, kajabiData: any, authToken: string) {
    if (!process.env.API_ENDPOINT || !process.env.API_KEY) {
        throw new Error('Missing API configuration');
    }

    console.log('Calling App Manager API with JWT authentication...');

    const response = await fetch(`${process.env.API_ENDPOINT}/app-manager?action=insertAppPurchaseOrder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.API_KEY,
            'Authorization': `Bearer ${authToken}`, // 🔑 This provides the distributorId
        },
        body: JSON.stringify({
            orderNumber: orderNumber,
            // Additional webhook metadata
            source: 'kajabi',
            eventType: kajabiData.eventType,
            email: kajabiData.normalizedEmail,
            productName: kajabiData.normalizedProductName,
            amount: kajabiData.normalizedAmount,
            kajabiOrderId: kajabiData.id,
            // Store original webhook for reference
            originalWebhookData: kajabiData
        }),
    });

    const responseText = await response.text();
    console.log('App Manager API response:', response.status, responseText);

    if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    return JSON.parse(responseText);
}

export async function GET() {
    return NextResponse.json({
        message: 'Kajabi webhook ready with authentication',
        status: 'Will authenticate as kajabi-direct@system.com',
        supportedEvents: [
            'payment.succeeded',
            'purchase.created',
            'unknown (fallback handling)'
        ],
        requirements: [
            'kajabi-direct@system.com distributor must exist',
            'KAJABI_DISTRIBUTOR_PASSWORD environment variable must be set'
        ],
        fieldMappings: {
            'payment.succeeded': {
                email: 'member.email',
                product: 'offer.title',
                amount: 'payment_transaction.amount_paid'
            },
            'purchase.created': {
                email: 'payload.member_email',
                product: 'payload.offer_title',
                amount: 'payload.amount_paid'
            }
        },
        test: 'POST Kajabi webhook data to this endpoint'
    });
}