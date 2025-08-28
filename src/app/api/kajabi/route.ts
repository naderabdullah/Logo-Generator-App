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
    console.log('=== KAJABI WEBHOOK CALLED ===');
    console.log('Timestamp:', new Date().toISOString());

    try {
        // Debug headers and request info
        console.log('📥 Received webhook request');
        console.log('User-Agent:', request.headers.get('user-agent'));
        console.log('Method:', request.method);
        console.log('URL:', request.url);
        console.log('Content-Type:', request.headers.get('content-type'));

        // Get the raw body
        const body = await request.text();
        console.log('Raw body length:', body.length);
        console.log('Raw body preview:', body.substring(0, 200) + '...');

        const kajabiData = JSON.parse(body);

        console.log('Webhook data:', {
            orderId: kajabiData.id,
            customerEmail: kajabiData.contact?.email,
            offerName: kajabiData.offer?.name,
            timestamp: new Date().toISOString()
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
            message: "Order processed successfully",
            orderNumber: purchaseData.orderNumber
        }, { status: 200 }); // Explicitly set 200 status

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
    console.log('=== STORING TO DYNAMODB ===');
    console.log('Table name:', process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders');
    console.log('AWS Region:', process.env.AWS_REGION || 'us-east-1');
    console.log('Has AWS credentials:', !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY));

    const distributorId = 'kajabi-direct';
    const orderNumber = purchaseData.orderNumber;

    // Match composite key structure (DistributorId + OrderNumber)
    const orderRecord = {
        DistributorId: distributorId,               // Partition Key
        OrderNumber: orderNumber,                   // Sort Key
        CreatedAt: new Date().toISOString(),        // Additional attribute
        Status: 'completed'                         // Additional attribute
    };

    console.log('Attempting to store order with composite key:', orderRecord);

    try {
        const result = await dynamoDB.put({
            TableName: process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders',
            Item: orderRecord,
            // FIXED: Condition expression for composite key table
            ConditionExpression: 'attribute_not_exists(DistributorId) AND attribute_not_exists(OrderNumber)',
            // Alternative approach - check the composite key doesn't exist:
            // ConditionExpression: 'attribute_not_exists(#pk) AND attribute_not_exists(#sk)',
            // ExpressionAttributeNames: {
            //   '#pk': 'DistributorId',
            //   '#sk': 'OrderNumber'
            // }
        }).promise();

        console.log('✅ DynamoDB PUT successful:', result);
        console.log('✅ Order stored with composite key - DistributorId:', distributorId, 'OrderNumber:', orderNumber);

    } catch (dynamoError: any) {
        console.error('❌ DYNAMODB ERROR DETAILS:');
        console.error('Error name:', dynamoError.name);
        console.error('Error code:', dynamoError.code);
        console.error('Error message:', dynamoError.message);

        // Log the exact key combination that failed
        console.error('Failed composite key - DistributorId:', distributorId, 'OrderNumber:', orderNumber);

        // Re-throw so the main function can handle it
        throw new Error(`DynamoDB write failed: ${dynamoError.message}`);
    }
}

// Optional: Handle other HTTP methods
export async function GET() {
    console.log('📥 Received GET request to webhook endpoint');
    console.log('Current time:', new Date().toISOString());
    console.log('Environment:', process.env.NODE_ENV);

    return NextResponse.json({
        message: 'Kajabi webhook endpoint is active',
        status: 'ready',
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        url: 'This endpoint is ready to receive Kajabi webhooks'
    }, {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export async function OPTIONS() {
    // Handle preflight requests
    return NextResponse.json({}, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}