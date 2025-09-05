// src/app/api/kajabi/route.ts - Simple approach calling new store webhook handler
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('=== KAJABI WEBHOOK (SIMPLE) ===');

    try {
        const body = await request.text();
        const kajabiData = JSON.parse(body);

        console.log('Raw Kajabi webhook:', JSON.stringify(kajabiData, null, 2));

        const eventType = kajabiData.event || 'unknown';

        // Only process payment.succeeded events
        if (eventType !== 'payment.succeeded') {
            console.log(`ℹ️ Ignoring event: ${eventType} (only processing payment.succeeded)`);
            return NextResponse.json({
                success: true,
                message: `Event ${eventType} ignored`,
                action: 'ignored'
            });
        }

        // Extract simple fields from payment.succeeded
        const email = kajabiData.member?.email || '';
        const firstName = kajabiData.member?.first_name || '';
        const lastName = kajabiData.member?.last_name || '';
        const customerName = `${firstName} ${lastName}`.trim();
        const amount = kajabiData.payment_transaction?.amount_paid || 0;
        const offerTitle = kajabiData.offer?.title || '';
        const orderNumber = `${kajabiData.id}`; // No kaj_ prefix
        const transactionId = kajabiData.payment_transaction?.id || '';
        const currency = kajabiData.payment_transaction?.currency || 'USD';

        console.log('Extracted data:', {
            orderNumber,
            email,
            customerName,
            amount,
            offerTitle,
            transactionId
        });

        // Validate required fields
        if (!kajabiData.id || !email || !offerTitle) {
            return NextResponse.json({
                error: 'Missing required data',
                details: {
                    id: kajabiData.id ? 'present' : 'missing',
                    email: email ? 'present' : 'missing',
                    offerTitle: offerTitle ? 'present' : 'missing'
                }
            }, { status: 400 });
        }

        // Authenticate
        const authToken = await authenticateKajabiDistributor();

        // Call NEW store webhook handler with simple parameters
        const result = await callStoreWebhookHandler({
            orderNumber,
            email,
            customerName,
            amount,
            offerTitle,
            transactionId,
            currency,
            source: 'kajabi'
        }, authToken);

        console.log('✅ Kajabi order processed:', orderNumber);
        return NextResponse.json({
            success: true,
            message: "Kajabi payment.succeeded processed",
            orderNumber,
            email,
            amount,
            offerTitle,
            result
        });

    } catch (error: any) {
        console.error('❌ Kajabi webhook error:', error);
        return NextResponse.json({
            error: 'Kajabi webhook failed',
            details: error.message
        }, { status: 500 });
    }
}

// Call new store webhook handler
async function callStoreWebhookHandler(orderData: any, authToken: string) {
    if (!process.env.API_ENDPOINT || !process.env.API_KEY) {
        throw new Error('Missing API configuration');
    }

    console.log('📤 Calling store webhook handler...');

    const response = await fetch(`${process.env.API_ENDPOINT}/app-manager?action=insertStoreWebhookOrder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.API_KEY,
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    console.log('Store webhook handler response:', response.status, responseText);

    if (!response.ok) {
        throw new Error(`Handler error: ${response.status} - ${responseText}`);
    }

    return JSON.parse(responseText);
}

// Authenticate as kajabi-direct@system.com
async function authenticateKajabiDistributor() {
    if (!process.env.API_ENDPOINT || !process.env.API_KEY) {
        throw new Error('Missing API configuration');
    }

    if (!process.env.KAJABI_DISTRIBUTOR_PASSWORD) {
        throw new Error('Missing KAJABI_DISTRIBUTOR_PASSWORD environment variable');
    }

    console.log('🔐 Authenticating...');

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

    if (!loginResponse.ok) {
        throw new Error(`Authentication failed: ${loginResponse.status} - ${loginResponseText}`);
    }

    const loginData = JSON.parse(loginResponseText);
    return loginData.token;
}

export async function GET() {
    return NextResponse.json({
        message: 'Kajabi webhook (simple store approach)',
        description: 'Processes payment.succeeded events and calls store webhook handler',
        approach: 'simple_store_webhook_handler',
        dataExtracted: [
            'orderNumber (no kaj_ prefix)',
            'email',
            'customerName (first + last)',
            'amount',
            'offerTitle',
            'transactionId',
            'currency',
            'source: kajabi'
        ],
        apiCall: 'insertStoreWebhookOrder (NEW action)',
        existingLogic: 'insertAppPurchaseOrder (UNCHANGED)',
        test: 'POST Kajabi payment.succeeded webhook'
    });
}