// src/app/api/kajabi-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';

// Initialize DynamoDB client (same as your existing setup)
const dynamoDB = new DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function POST(request: NextRequest) {
    try {
        console.log('📥 Received Kajabi webhook');

        // Get the raw body for signature verification
        const body = await request.text();
        const kajabiData = JSON.parse(body);

        console.log('Webhook data:', {
            orderId: kajabiData.id,
            customerEmail: kajabiData.contact?.email,
            offerName: kajabiData.offer?.name
        });

        // Note: Kajabi doesn't provide signature verification
        // Security relies on endpoint obscurity and data validation

        // Extract and validate purchase data
        const purchaseData = extractPurchaseData(kajabiData);
        if (!purchaseData.isValid) {
            console.error('❌ Invalid purchase data:', purchaseData.error);
            return NextResponse.json({ error: purchaseData.error }, { status: 400 });
        }

        // Store in your existing purchase_orders table
        await storePurchaseOrder(purchaseData);

        console.log('✅ Successfully processed Kajabi purchase');
        return NextResponse.json({
            success: true,
            orderNumber: purchaseData.orderNumber
        });

    } catch (error: any) {
        console.error('❌ Webhook processing error:', error);
        return NextResponse.json({
            error: 'Webhook processing failed',
            details: error.message
        }, { status: 500 });
    }
}

function extractPurchaseData(kajabiData: any) {
    console.log('Extracting purchase data...');

    // Validate required fields
    if (!kajabiData.id) {
        return { isValid: false, error: 'Missing order ID' };
    }

    if (!kajabiData.contact?.email) {
        return { isValid: false, error: 'Missing customer email' };
    }

    // Simple data extraction - no product mapping needed
    return {
        isValid: true,
        orderNumber: `kaj_${kajabiData.id}`, // Prefix to identify Kajabi orders
        email: kajabiData.contact.email.toLowerCase().trim(),
        productId: kajabiData.offer?.id || 'unknown',
        productName: kajabiData.offer?.name || 'Unknown Product',
        amount: kajabiData.amount || 0,
        currency: kajabiData.currency || 'USD',
        affiliateId: kajabiData.affiliate?.id || null,
        affiliateEmail: kajabiData.affiliate?.email || null,
        purchaseDate: kajabiData.created_at || new Date().toISOString()
    };
}

async function storePurchaseOrder(purchaseData: any) {
    console.log('Storing purchase order in DynamoDB...');

    // Minimal record - just what's needed for order verification
    const orderRecord = {
        orderNumber: purchaseData.orderNumber,           // Primary key for matching
        email: purchaseData.email,                       // For email verification
        productId: purchaseData.productId,               // Kajabi offer ID (for reference)
        productName: purchaseData.productName,           // Human readable (for reference)
        amount: purchaseData.amount,
        currency: purchaseData.currency,
        affiliateId: purchaseData.affiliateId,           // For tracking
        affiliateEmail: purchaseData.affiliateEmail,
        source: 'kajabi',                                // Track source
        status: 'completed',                             // Payment confirmed
        verified: false,                                 // Will be true after registration
        verifiedAt: null,
        verifiedBy: null,
        purchaseDate: purchaseData.purchaseDate,
        createdAt: new Date().toISOString(),

        // TTL for cleanup (optional - 1 year)
        ttl: Math.floor(Date.now() / 1000) + (86400 * 365)

        // NOTE: No subappId here - let existing registration logic handle it!
    };

    await dynamoDB.put({
        TableName: process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'purchase_orders',
        Item: orderRecord
    }).promise();

    console.log('✅ Order stored:', purchaseData.orderNumber);
}

// Optional: Handle other HTTP methods
export async function GET() {
    return NextResponse.json({
        message: 'Kajabi webhook endpoint is active',
        timestamp: new Date().toISOString()
    });
}