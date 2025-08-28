// src/app/api/kajabi/route.ts - SIMPLE VERSION USING REGISTRATION PATTERN
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('=== KAJABI WEBHOOK ===');

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

        // Call App Manager API using EXACT same pattern as registration
        const result = await callAppManagerAPI(orderNumber, kajabiData);

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

// Use EXACT same pattern as successful registration route
async function callAppManagerAPI(orderNumber: string, kajabiData: any) {
    if (!process.env.API_ENDPOINT || !process.env.API_KEY) {
        throw new Error('Missing API configuration (same as registration)');
    }

    console.log('Calling App Manager API with same credentials as registration...');

    // Try the insertAppPurchaseOrder with system authentication
    const response = await fetch(`${process.env.API_ENDPOINT}/app-manager?action=insertAppPurchaseOrder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.API_KEY,
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
        // If insertAppPurchaseOrder fails due to auth, the issue is missing kajabi-direct distributor
        if (response.status === 401) {
            throw new Error('Authentication failed - need to create kajabi-direct@system.com distributor in your system');
        }
        throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    return JSON.parse(responseText);
}

export async function GET() {
    return NextResponse.json({
        message: 'Kajabi webhook ready',
        status: 'Using same API pattern as successful registrations',
        solution: 'Create kajabi-direct@system.com distributor to enable authentication',
        test: 'POST Kajabi webhook data to this endpoint'
    });
}