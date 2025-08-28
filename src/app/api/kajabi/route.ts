// src/app/api/kajabi/route.ts - BULLETPROOF ERROR HANDLING VERSION
import { NextRequest, NextResponse } from 'next/server';

// SAFE: Initialize DynamoDB only if credentials are available
let dynamoDB: any = null;
let dynamoDbError: string | null = null;

try {
    // Only require AWS SDK if credentials are present
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        const { DynamoDB } = require('aws-sdk');
        dynamoDB = new DynamoDB.DocumentClient({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });
    } else {
        dynamoDbError = 'Missing AWS credentials';
    }
} catch (initError: any) {
    dynamoDbError = `DynamoDB initialization failed: ${initError.message}`;
}

// Safe environment variable check
function getEnvironmentStatus() {
    return {
        hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        tableName: process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders',
        nodeEnv: process.env.NODE_ENV || 'unknown',
        dynamoDbError: dynamoDbError,
        hasDynamoClient: !!dynamoDB
    };
}

export async function POST(request: NextRequest) {
    console.log('=== KAJABI WEBHOOK POST CALLED ===');
    console.log('Timestamp:', new Date().toISOString());

    // Wrap everything in try-catch to prevent 500 crashes
    try {
        const envStatus = getEnvironmentStatus();
        console.log('Environment status:', envStatus);

        // Check if we have basic requirements
        if (!envStatus.hasDynamoClient) {
            console.error('❌ DynamoDB client not available:', envStatus.dynamoDbError);
            return NextResponse.json({
                success: false,
                error: 'Database configuration error',
                details: envStatus.dynamoDbError || 'DynamoDB client not initialized',
                environment: envStatus
            }, { status: 500 });
        }

        // Debug request information
        console.log('📥 Received webhook request');
        console.log('User-Agent:', request.headers.get('user-agent') || 'none');
        console.log('Content-Type:', request.headers.get('content-type') || 'none');
        console.log('Method:', request.method);

        // Safely get request body
        let body: string;
        let kajabiData: any;

        try {
            body = await request.text();
            console.log('Raw body length:', body.length);
            console.log('Raw body preview:', body.substring(0, 300) + (body.length > 300 ? '...' : ''));
        } catch (bodyError: any) {
            console.error('❌ Failed to read request body:', bodyError.message);
            return NextResponse.json({
                success: false,
                error: 'Failed to read request body',
                details: bodyError.message
            }, { status: 400 });
        }

        if (!body || body.length === 0) {
            console.error('❌ Empty request body');
            return NextResponse.json({
                success: false,
                error: 'Empty request body'
            }, { status: 400 });
        }

        // Safely parse JSON
        try {
            kajabiData = JSON.parse(body);
            console.log('✅ JSON parsed successfully');
            console.log('Kajabi data keys:', Object.keys(kajabiData));
        } catch (parseError: any) {
            console.error('❌ JSON Parse Error:', parseError.message);
            console.error('Raw body that failed to parse:', body);
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON in request body',
                details: parseError.message,
                rawBody: body.substring(0, 500) // Include part of raw body for debugging
            }, { status: 400 });
        }

        // Extract and validate purchase data
        let purchaseData: any;
        try {
            purchaseData = extractPurchaseData(kajabiData);
            if (!purchaseData.isValid) {
                console.error('❌ Invalid purchase data:', purchaseData.error);
                return NextResponse.json({
                    success: false,
                    error: 'Invalid purchase data',
                    details: purchaseData.error,
                    kajabiData: kajabiData // Include for debugging
                }, { status: 400 });
            }
        } catch (extractError: any) {
            console.error('❌ Data extraction error:', extractError.message);
            return NextResponse.json({
                success: false,
                error: 'Failed to extract purchase data',
                details: extractError.message,
                kajabiData: kajabiData
            }, { status: 400 });
        }

        // Store in DynamoDB with comprehensive error handling
        try {
            await storePurchaseOrder(purchaseData);
            console.log('✅ Successfully processed Kajabi purchase');

            return NextResponse.json({
                success: true,
                message: "Order processed successfully",
                orderNumber: purchaseData.orderNumber,
                timestamp: new Date().toISOString()
            }, { status: 200 });

        } catch (storageError: any) {
            console.error('❌ Storage error:', storageError.message);
            return NextResponse.json({
                success: false,
                error: 'Failed to store purchase order',
                details: storageError.message,
                orderData: purchaseData,
                environment: envStatus
            }, { status: 500 });
        }

    } catch (unexpectedError: any) {
        console.error('❌ UNEXPECTED ERROR:', unexpectedError);
        console.error('Stack trace:', unexpectedError.stack);

        return NextResponse.json({
            success: false,
            error: 'Unexpected server error',
            details: unexpectedError.message,
            timestamp: new Date().toISOString(),
            environment: getEnvironmentStatus()
        }, { status: 500 });
    }
}

function extractPurchaseData(kajabiData: any) {
    console.log('Extracting purchase data...');

    try {
        // Comprehensive validation with detailed error messages
        if (!kajabiData) {
            return { isValid: false, error: 'No data provided in webhook payload' };
        }

        if (typeof kajabiData !== 'object') {
            return { isValid: false, error: 'Webhook payload is not an object' };
        }

        if (!kajabiData.id) {
            return {
                isValid: false,
                error: 'Missing order ID in Kajabi data',
                availableFields: Object.keys(kajabiData)
            };
        }

        if (!kajabiData.contact) {
            return {
                isValid: false,
                error: 'Missing contact object in Kajabi data',
                availableFields: Object.keys(kajabiData)
            };
        }

        if (!kajabiData.contact.email) {
            return {
                isValid: false,
                error: 'Missing customer email in contact object',
                contactFields: Object.keys(kajabiData.contact || {})
            };
        }

        // Enhanced data extraction with safe parsing
        const extractedData = {
            isValid: true,
            orderNumber: `kaj_${kajabiData.id}`,
            email: String(kajabiData.contact.email).toLowerCase().trim(),
            productId: kajabiData.offer?.id || 'unknown',
            productName: kajabiData.offer?.name || 'Unknown Product',
            amount: parseFloat(kajabiData.amount || '0'),
            currency: kajabiData.currency || 'USD',
            affiliateId: kajabiData.affiliate?.id || null,
            affiliateEmail: kajabiData.affiliate?.email || null,
            purchaseDate: kajabiData.created_at || new Date().toISOString(),
            kajabiOrderId: kajabiData.id,
            customerName: kajabiData.contact?.first_name && kajabiData.contact?.last_name
                ? `${kajabiData.contact.first_name} ${kajabiData.contact.last_name}`
                : null,
            // Raw data for debugging
            rawKajabiData: kajabiData
        };

        console.log('✅ Purchase data extracted successfully');
        console.log('Order Number:', extractedData.orderNumber);
        console.log('Email:', extractedData.email);

        return extractedData;

    } catch (extractError: any) {
        console.error('❌ Error during data extraction:', extractError.message);
        return {
            isValid: false,
            error: `Data extraction failed: ${extractError.message}`,
            kajabiData: kajabiData
        };
    }
}

async function storePurchaseOrder(purchaseData: any) {
    console.log('=== ATTEMPTING DYNAMODB STORAGE ===');

    const envStatus = getEnvironmentStatus();
    console.log('DynamoDB Environment Status:', envStatus);

    if (!dynamoDB) {
        throw new Error(`DynamoDB client not available: ${envStatus.dynamoDbError}`);
    }

    const tableName = envStatus.tableName;
    const distributorId = 'kajabi-direct';
    const orderNumber = purchaseData.orderNumber;

    // Create the order record
    const orderRecord = {
        DistributorId: distributorId,
        OrderNumber: orderNumber,
        CreatedAt: new Date().toISOString(),
        Status: 'completed',
        Email: purchaseData.email,
        ProductId: purchaseData.productId,
        ProductName: purchaseData.productName,
        Amount: purchaseData.amount,
        Currency: purchaseData.currency,
        PurchaseDate: purchaseData.purchaseDate,
        Source: 'kajabi',
        KajabiOrderId: purchaseData.kajabiOrderId,
        ...(purchaseData.affiliateId && { AffiliateId: purchaseData.affiliateId }),
        ...(purchaseData.affiliateEmail && { AffiliateEmail: purchaseData.affiliateEmail }),
        ...(purchaseData.customerName && { CustomerName: purchaseData.customerName })
    };

    console.log('Order record to store:', JSON.stringify(orderRecord, null, 2));

    try {
        console.log('📝 Attempting DynamoDB PUT operation...');

        const result = await dynamoDB.put({
            TableName: tableName,
            Item: orderRecord,
            ConditionExpression: 'attribute_not_exists(DistributorId) AND attribute_not_exists(OrderNumber)'
        }).promise();

        console.log('✅ DynamoDB PUT successful');
        console.log('✅ Order stored successfully:');
        console.log('    DistributorId:', distributorId);
        console.log('    OrderNumber:', orderNumber);
        console.log('    HTTP Status:', result.$response?.httpResponse?.statusCode);

        return result;

    } catch (dynamoError: any) {
        console.error('❌ DYNAMODB ERROR:');
        console.error('    Error name:', dynamoError.name);
        console.error('    Error code:', dynamoError.code);
        console.error('    Error message:', dynamoError.message);
        console.error('    Table:', tableName);
        console.error('    Region:', envStatus.awsRegion);
        console.error('    Composite key:');
        console.error('      DistributorId:', distributorId);
        console.error('      OrderNumber:', orderNumber);

        // Provide specific error context
        let errorContext = '';
        if (dynamoError.code === 'ConditionalCheckFailedException') {
            errorContext = 'Order already exists (this is normal for duplicate webhooks)';
        } else if (dynamoError.code === 'ResourceNotFoundException') {
            errorContext = `Table '${tableName}' not found in region '${envStatus.awsRegion}'`;
        } else if (dynamoError.code === 'UnauthorizedException' || dynamoError.code === 'InvalidSignatureException') {
            errorContext = 'AWS credentials invalid or insufficient permissions';
        } else if (dynamoError.code === 'ValidationException') {
            errorContext = 'Data validation error - check table schema';
        }

        throw new Error(`DynamoDB operation failed: ${dynamoError.message} ${errorContext ? '(' + errorContext + ')' : ''}`);
    }
}

// BULLETPROOF GET method that never crashes
export async function GET(request: NextRequest) {
    console.log('📥 GET request to Kajabi webhook endpoint');
    console.log('Timestamp:', new Date().toISOString());

    // This method should NEVER throw an exception
    try {
        const envStatus = getEnvironmentStatus();
        console.log('Environment check:', envStatus);

        // Test 1: Basic environment variables
        if (!envStatus.hasAwsAccessKey || !envStatus.hasAwsSecretKey) {
            return NextResponse.json({
                message: 'Kajabi webhook endpoint has configuration issues',
                status: 'error',
                error: 'Missing AWS credentials',
                details: {
                    hasAwsAccessKey: envStatus.hasAwsAccessKey,
                    hasAwsSecretKey: envStatus.hasAwsSecretKey,
                    awsRegion: envStatus.awsRegion,
                    tableName: envStatus.tableName
                },
                environment: envStatus.nodeEnv,
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }

        // Test 2: DynamoDB client availability
        if (!dynamoDB) {
            return NextResponse.json({
                message: 'Kajabi webhook endpoint has database issues',
                status: 'error',
                error: 'DynamoDB client not available',
                details: envStatus.dynamoDbError || 'Unknown DynamoDB initialization error',
                environment: envStatus,
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }

        // Test 3: DynamoDB connectivity (with timeout and error handling)
        let databaseStatus = 'unknown';
        let itemCount = 'unknown';
        let connectionError = null;

        try {
            console.log('Testing DynamoDB connection...');

            // Use Promise.race to add timeout
            const dbTest = dynamoDB.scan({
                TableName: envStatus.tableName,
                Limit: 1
            }).promise();

            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('DynamoDB connection timeout')), 5000)
            );

            const testResult = await Promise.race([dbTest, timeout]);

            databaseStatus = 'connected';
            itemCount = testResult.Count || 0;
            console.log('✅ DynamoDB connection successful');

        } catch (dbError: any) {
            console.error('❌ DynamoDB connection failed:', dbError.message);
            databaseStatus = 'error';
            connectionError = dbError.message;

            // Don't fail the whole endpoint, just report the database issue
        }

        // Always return a successful response with full diagnostic info
        return NextResponse.json({
            message: databaseStatus === 'connected'
                ? 'Kajabi webhook endpoint is active and DynamoDB is accessible'
                : 'Kajabi webhook endpoint is active but has database issues',
            status: databaseStatus === 'connected' ? 'ready' : 'partial',
            environment: envStatus.nodeEnv,
            timestamp: new Date().toISOString(),
            diagnostics: {
                databaseStatus,
                itemCount,
                connectionError,
                tableName: envStatus.tableName,
                region: envStatus.awsRegion,
                hasCredentials: envStatus.hasAwsAccessKey && envStatus.hasAwsSecretKey,
                dynamoDbError: envStatus.dynamoDbError
            },
            url: 'This endpoint is ready to receive Kajabi webhooks'
        }, {
            status: databaseStatus === 'connected' ? 200 : 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (fatalError: any) {
        // Last resort error handling - should never crash
        console.error('❌ FATAL ERROR in GET endpoint:', fatalError);

        try {
            return NextResponse.json({
                message: 'Kajabi webhook endpoint encountered a fatal error',
                status: 'fatal_error',
                error: fatalError.message || 'Unknown fatal error',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'unknown',
                stack: process.env.NODE_ENV === 'development' ? fatalError.stack : undefined
            }, { status: 500 });
        } catch (responseError) {
            // If even JSON response fails, return plain text
            console.error('❌ Cannot return JSON response:', responseError);
            return new NextResponse('Fatal webhook error', { status: 500 });
        }
    }
}

export async function OPTIONS() {
    // CORS preflight - keep this simple and safe
    try {
        return NextResponse.json({}, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    } catch (error) {
        // Fallback for CORS
        return new NextResponse('', {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
}