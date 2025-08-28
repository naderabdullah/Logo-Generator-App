// src/app/api/kajabi/route.ts - STEP 3: Test actual DynamoDB operations
import { NextRequest, NextResponse } from 'next/server';

// Step 3: Test actual DynamoDB operations
let awsStatus = 'unknown';
let awsError: string | null = null;
let dynamoDB: any = null;

try {
    console.log('🔄 Importing AWS SDK...');
    const { DynamoDB } = require('aws-sdk');
    awsStatus = 'imported';

    console.log('🔄 Creating DynamoDB client...');
    dynamoDB = new DynamoDB.DocumentClient({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    awsStatus = 'client_created';

} catch (initError: any) {
    console.error('❌ AWS SDK initialization error:', initError);
    awsStatus = 'error';
    awsError = initError.message;
}

export async function GET(request: NextRequest) {
    try {
        console.log('✅ GET endpoint called - Step 3 (DynamoDB operations test)');

        const tableName = process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders';
        let dbTestResult = null;
        let dbError = null;

        // Test actual DynamoDB operation
        if (dynamoDB) {
            try {
                console.log('🔄 Testing DynamoDB scan operation...');

                const testResult = await dynamoDB.scan({
                    TableName: tableName,
                    Limit: 1
                }).promise();

                dbTestResult = {
                    success: true,
                    itemCount: testResult.Count,
                    scannedCount: testResult.ScannedCount
                };

                console.log('✅ DynamoDB scan successful:', dbTestResult);

            } catch (dbErr: any) {
                console.error('❌ DynamoDB scan failed:', dbErr);
                dbError = {
                    name: dbErr.name,
                    code: dbErr.code,
                    message: dbErr.message,
                    statusCode: dbErr.statusCode
                };
            }
        } else {
            dbError = { message: 'DynamoDB client not available' };
        }

        return NextResponse.json({
            message: 'Step 3: DynamoDB operations test',
            status: 'dynamodb_test',
            timestamp: new Date().toISOString(),
            step: 3,
            environment: {
                hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
                hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
                awsRegion: process.env.AWS_REGION || 'us-east-1',
                tableName: tableName,
                nodeEnv: process.env.NODE_ENV || 'unknown'
            },
            aws: {
                status: awsStatus,
                error: awsError,
                hasDynamoClient: !!dynamoDB
            },
            databaseTest: {
                result: dbTestResult,
                error: dbError,
                status: dbTestResult ? 'success' : 'failed'
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ GET error in Step 3:', error);

        return NextResponse.json({
            error: 'Step 3 GET failed',
            details: error.message,
            step: 3,
            awsStatus: awsStatus,
            awsError: awsError
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('✅ POST endpoint called - Step 3 (DynamoDB write test)');

        const body = await request.text();
        let parsedData = null;
        let parseError = null;

        try {
            parsedData = JSON.parse(body);
        } catch (err: any) {
            parseError = err.message;
        }

        // Test DynamoDB write operation if we have valid data
        let writeTestResult = null;
        let writeError = null;

        if (dynamoDB && parsedData && parsedData.id) {
            try {
                console.log('🔄 Testing DynamoDB PUT operation...');

                const tableName = process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders';
                const testOrderNumber = `test_${parsedData.id}_${Date.now()}`;

                const testRecord = {
                    DistributorId: 'kajabi-direct',
                    OrderNumber: testOrderNumber,
                    CreatedAt: new Date().toISOString(),
                    Status: 'test',
                    Email: 'test@example.com',
                    Source: 'webhook_test',
                    TestData: true
                };

                const putResult = await dynamoDB.put({
                    TableName: tableName,
                    Item: testRecord,
                    ConditionExpression: 'attribute_not_exists(DistributorId) AND attribute_not_exists(OrderNumber)'
                }).promise();

                writeTestResult = {
                    success: true,
                    orderNumber: testOrderNumber,
                    httpStatusCode: putResult.$response?.httpResponse?.statusCode
                };

                console.log('✅ DynamoDB PUT successful:', writeTestResult);

            } catch (writeErr: any) {
                console.error('❌ DynamoDB PUT failed:', writeErr);
                writeError = {
                    name: writeErr.name,
                    code: writeErr.code,
                    message: writeErr.message,
                    statusCode: writeErr.statusCode
                };
            }
        }

        return NextResponse.json({
            message: 'Step 3: POST with DynamoDB write test',
            status: 'post_with_dynamodb_test',
            bodyLength: body.length,
            parseError: parseError,
            hasValidJson: !!parsedData,
            timestamp: new Date().toISOString(),
            step: 3,
            aws: {
                status: awsStatus,
                error: awsError,
                hasDynamoClient: !!dynamoDB
            },
            writeTest: {
                attempted: !!(dynamoDB && parsedData && parsedData.id),
                result: writeTestResult,
                error: writeError,
                status: writeTestResult ? 'success' : (writeError ? 'failed' : 'skipped')
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ POST error in Step 3:', error);

        return NextResponse.json({
            error: 'Step 3 POST failed',
            details: error.message,
            step: 3
        }, { status: 500 });
    }
}