// src/app/api/kajabi/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';

// Initialize DynamoDB client with explicit configuration
const dynamoDB = new DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Add environment variable validation
function validateEnvironment() {
    const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

export async function POST(request: NextRequest) {
    console.log('=== KAJABI WEBHOOK CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);

    try {
        // Validate environment first
        validateEnvironment();

        // Debug headers and request info
        console.log('📥 Received webhook request');
        console.log('User-Agent:', request.headers.get('user-agent'));
        console.log('Method:', request.method);
        console.log('Content-Type:', request.headers.get('content-type'));

        // Get the raw body
        const body = await request.text();
        console.log('Raw body length:', body.length);
        console.log('Raw body preview:', body.substring(0, 500));

        if (!body || body.length === 0) {
            console.error('❌ Empty request body');
            return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
        }

        let kajabiData;
        try {
            kajabiData = JSON.parse(body);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        console.log('Parsed Kajabi Data:', JSON.stringify(kajabiData, null, 2));

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
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Webhook processing error:', error);
        return NextResponse.json({
            error: 'Webhook processing failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

function extractPurchaseData(kajabiData: any) {
    console.log('Extracting purchase data from:', JSON.stringify(kajabiData, null, 2));

    // Validate required fields with better error messages
    if (!kajabiData) {
        return { isValid: false, error: 'No data provided' };
    }

    if (!kajabiData.id) {
        return { isValid: false, error: 'Missing order ID in Kajabi data' };
    }

    if (!kajabiData.contact?.email) {
        return { isValid: false, error: 'Missing customer email in Kajabi data' };
    }

    // Enhanced data extraction with more fields
    const extractedData = {
        isValid: true,
        orderNumber: `kaj_${kajabiData.id}`, // Prefix to identify Kajabi orders
        email: kajabiData.contact.email.toLowerCase().trim(),
        productId: kajabiData.offer?.id || 'unknown',
        productName: kajabiData.offer?.name || 'Unknown Product',
        amount: parseFloat(kajabiData.amount || '0'),
        currency: kajabiData.currency || 'USD',
        affiliateId: kajabiData.affiliate?.id || null,
        affiliateEmail: kajabiData.affiliate?.email || null,
        purchaseDate: kajabiData.created_at || new Date().toISOString(),
        // Additional fields that might be useful
        kajabiOrderId: kajabiData.id,
        customerName: kajabiData.contact?.first_name && kajabiData.contact?.last_name
            ? `${kajabiData.contact.first_name} ${kajabiData.contact.last_name}`
            : null
    };

    console.log('Extracted purchase data:', JSON.stringify(extractedData, null, 2));
    return extractedData;
}

async function storePurchaseOrder(purchaseData: any) {
    console.log('=== STORING TO DYNAMODB ===');

    const tableName = process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders';
    const region = process.env.AWS_REGION || 'us-east-1';
    const hasCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

    console.log('DynamoDB Configuration:');
    console.log('  Table name:', tableName);
    console.log('  AWS Region:', region);
    console.log('  Has AWS credentials:', hasCredentials);
    console.log('  Environment:', process.env.NODE_ENV);

    const distributorId = 'kajabi-direct';
    const orderNumber = purchaseData.orderNumber;

    // Enhanced order record with all the attributes your system might expect
    const orderRecord = {
        DistributorId: distributorId,               // Partition Key
        OrderNumber: orderNumber,                   // Sort Key
        CreatedAt: new Date().toISOString(),        // Standard timestamp
        Status: 'completed',                        // Order status
        // Additional fields from your analysis
        Email: purchaseData.email,
        ProductId: purchaseData.productId,
        ProductName: purchaseData.productName,
        Amount: purchaseData.amount,
        Currency: purchaseData.currency,
        PurchaseDate: purchaseData.purchaseDate,
        Source: 'kajabi',
        // Optional fields
        ...(purchaseData.affiliateId && { AffiliateId: purchaseData.affiliateId }),
        ...(purchaseData.affiliateEmail && { AffiliateEmail: purchaseData.affiliateEmail }),
        ...(purchaseData.customerName && { CustomerName: purchaseData.customerName }),
        KajabiOrderId: purchaseData.kajabiOrderId
    };

    console.log('Order record to store:', JSON.stringify(orderRecord, null, 2));

    try {
        // Test DynamoDB connection first
        console.log('Testing DynamoDB connection...');

        const result = await dynamoDB.put({
            TableName: tableName,
            Item: orderRecord,
            // More flexible condition - only check if the exact combination exists
            ConditionExpression: 'attribute_not_exists(DistributorId) AND attribute_not_exists(OrderNumber)'
        }).promise();

        console.log('✅ DynamoDB PUT successful');
        console.log('✅ Order stored with composite key:');
        console.log('    DistributorId:', distributorId);
        console.log('    OrderNumber:', orderNumber);
        console.log('    Response metadata:', result.$response?.httpResponse?.statusCode);

        return result;

    } catch (dynamoError: any) {
        console.error('❌ DYNAMODB ERROR DETAILS:');
        console.error('  Error name:', dynamoError.name);
        console.error('  Error code:', dynamoError.code);
        console.error('  Error message:', dynamoError.message);
        console.error('  Failed composite key:');
        console.error('    DistributorId:', distributorId);
        console.error('    OrderNumber:', orderNumber);

        // Check for specific error types
        if (dynamoError.code === 'ConditionalCheckFailedException') {
            console.error('  → Order already exists in database');
        } else if (dynamoError.code === 'ResourceNotFoundException') {
            console.error('  → DynamoDB table not found:', tableName);
        } else if (dynamoError.code === 'UnauthorizedException' || dynamoError.code === 'InvalidSignatureException') {
            console.error('  → AWS credentials issue');
        }

        // Re-throw with more context
        throw new Error(`DynamoDB write failed: ${dynamoError.message} (Code: ${dynamoError.code})`);
    }
}

// Test endpoint for debugging
export async function GET() {
    console.log('📥 Received GET request to Kajabi webhook endpoint');

    try {
        validateEnvironment();

        const tableName = process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders';

        // Test DynamoDB connection
        const testResult = await dynamoDB.scan({
            TableName: tableName,
            Limit: 1
        }).promise();

        return NextResponse.json({
            message: 'Kajabi webhook endpoint is active and DynamoDB is accessible',
            status: 'ready',
            environment: process.env.NODE_ENV || 'unknown',
            timestamp: new Date().toISOString(),
            databaseStatus: 'connected',
            tableName: tableName,
            itemCount: testResult.Count,
            url: 'This endpoint is ready to receive Kajabi webhooks'
        }, {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error: any) {
        console.error('❌ GET endpoint error:', error);

        return NextResponse.json({
            message: 'Kajabi webhook endpoint has configuration issues',
            status: 'error',
            error: error.message,
            environment: process.env.NODE_ENV || 'unknown',
            timestamp: new Date().toISOString()
        }, {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export async function OPTIONS() {
    // Handle preflight requests for CORS
    return NextResponse.json({}, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}