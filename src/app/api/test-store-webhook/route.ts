import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('🧪 Testing store webhook handler with:', body);

        // Get auth token first
        const authToken = await getAuthToken();

        // Call the lambda function
        const result = await callLambdaStoreHandler(body, authToken);

        return NextResponse.json({
            success: true,
            message: "Store webhook test completed",
            result: result
        });

    } catch (error: any) {
        console.error('❌ Test error:', error);
        return NextResponse.json({
            error: 'Test failed',
            details: error.message
        }, { status: 500 });
    }
}

async function getAuthToken() {
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

    const loginData = await loginResponse.json();
    return loginData.token;
}

async function callLambdaStoreHandler(orderData: any, authToken: string) {
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

    if (!response.ok) {
        throw new Error(`Lambda error: ${response.status} - ${responseText}`);
    }

    return JSON.parse(responseText);
}

export async function GET() {
    return NextResponse.json({
        message: 'Store webhook test endpoint',
        usage: 'POST JSON data to test the store webhook handler',
        expectedFields: [
            'orderNumber (required)',
            'email (required)',
            'customerName (optional)',
            'amount (optional)',
            'offerTitle (optional)',
            'transactionId (optional)',
            'currency (optional)',
            'source (required)'
        ]
    });
}