// src/app/api/kajabi/route.ts - UPDATED with kajabi-direct authentication
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('=== KAJABI WEBHOOK WITH AUTH ===');

    try {
        const body = await request.text();
        const kajabiData = JSON.parse(body);

        console.log('Kajabi order received:', {
            id: kajabiData.id,
            email: kajabiData.contact?.email,
            product: kajabiData.offer?.name,
            amount: kajabiData.amount
        });

        // Extract order data
        const orderNumber = `kaj_${kajabiData.id}`;
        const email = kajabiData.contact?.email?.toLowerCase?.() || '';

        if (!kajabiData.id || !email) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        // Step 1: Authenticate as kajabi-direct@system.com to get JWT token
        const authToken = await authenticateKajabiDistributor();

        // Step 2: Call App Manager API with proper JWT authentication
        const result = await callAppManagerAPIWithAuth(orderNumber, kajabiData, authToken);

        console.log('✅ Order created successfully:', orderNumber);
        return NextResponse.json({
            success: true,
            message: "Kajabi order processed successfully",
            orderNumber: orderNumber,
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

// NEW: Authenticate as kajabi-direct@system.com distributor
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

// UPDATED: Call App Manager API with JWT authentication
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
            email: kajabiData.contact?.email,
            productName: kajabiData.offer?.name,
            amount: kajabiData.amount,
            kajabiOrderId: kajabiData.id
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
        requirements: [
            'kajabi-direct@system.com distributor must exist',
            'KAJABI_DISTRIBUTOR_PASSWORD environment variable must be set'
        ],
        test: 'POST Kajabi webhook data to this endpoint'
    });
}