// src/app/api/kajabi/route.ts - STEP 2: Add AWS SDK imports
import { NextRequest, NextResponse } from 'next/server';

// Step 2: Test AWS SDK import and initialization
let awsStatus = 'unknown';
let awsError: string | null = null;
let dynamoDB: any = null;

try {
    console.log('🔄 Attempting to import AWS SDK...');
    const { DynamoDB } = require('aws-sdk');
    awsStatus = 'imported';

    console.log('🔄 Attempting to create DynamoDB client...');
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
        console.log('✅ GET endpoint called - Step 2 (AWS SDK test)');

        const envStatus = {
            hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            awsRegion: process.env.AWS_REGION || 'us-east-1',
            tableName: process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders',
            nodeEnv: process.env.NODE_ENV || 'unknown'
        };

        return NextResponse.json({
            message: 'Step 2: AWS SDK test',
            status: 'aws_sdk_test',
            timestamp: new Date().toISOString(),
            step: 2,
            environment: envStatus,
            aws: {
                status: awsStatus,
                error: awsError,
                hasDynamoClient: !!dynamoDB
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ GET error in Step 2:', error);

        return NextResponse.json({
            error: 'Step 2 GET failed',
            details: error.message,
            step: 2,
            awsStatus: awsStatus,
            awsError: awsError
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('✅ POST endpoint called - Step 2 (AWS SDK test)');

        const body = await request.text();
        console.log('Body length:', body.length);

        // Parse JSON safely
        let parsedData = null;
        let parseError = null;

        try {
            parsedData = JSON.parse(body);
        } catch (err: any) {
            parseError = err.message;
        }

        return NextResponse.json({
            message: 'Step 2: POST with AWS SDK available',
            status: 'post_success_with_aws',
            bodyLength: body.length,
            parseError: parseError,
            hasValidJson: !!parsedData,
            timestamp: new Date().toISOString(),
            step: 2,
            aws: {
                status: awsStatus,
                error: awsError,
                hasDynamoClient: !!dynamoDB
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ POST error in Step 2:', error);

        return NextResponse.json({
            error: 'Step 2 POST failed',
            details: error.message,
            step: 2
        }, { status: 500 });
    }
}