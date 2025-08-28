// src/app/api/kajabi-debug/route.ts - UPDATED with Kajabi password check
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('🔍 Debug endpoint called');

    try {
        // Test environment variables without trying to initialize anything
        const envCheck = {
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV || 'unknown',

            // AWS Configuration
            aws: {
                hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
                hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION || 'us-east-1',
                accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 4) + '***' : 'missing'
            },

            // DynamoDB Configuration
            dynamodb: {
                tableName: process.env.DYNAMODB_PURCHASE_ORDERS_TABLE || 'AppPurchaseOrders',
                hasTableEnvVar: !!process.env.DYNAMODB_PURCHASE_ORDERS_TABLE
            },

            // API Configuration
            api: {
                hasApiEndpoint: !!process.env.API_ENDPOINT,
                hasApiKey: !!process.env.API_KEY,
                endpoint: process.env.API_ENDPOINT ? 'configured' : 'missing'
            },

            // 🆕 KAJABI-SPECIFIC Configuration
            kajabi: {
                hasDistributorPassword: !!process.env.KAJABI_DISTRIBUTOR_PASSWORD,
                passwordLength: process.env.KAJABI_DISTRIBUTOR_PASSWORD ? process.env.KAJABI_DISTRIBUTOR_PASSWORD.length : 0,
                webhookReady: !!(process.env.API_ENDPOINT && process.env.API_KEY && process.env.KAJABI_DISTRIBUTOR_PASSWORD)
            }
        };

        // Test AWS SDK availability
        let awsSdkStatus = 'unknown';
        let awsSdkError = null;

        try {
            const { DynamoDB } = require('aws-sdk');
            awsSdkStatus = 'available';

            // Try to create client (but don't use it yet)
            if (envCheck.aws.hasAccessKey && envCheck.aws.hasSecretKey) {
                const testClient = new DynamoDB.DocumentClient({
                    region: envCheck.aws.region,
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                });
                awsSdkStatus = 'client_created';
            }
        } catch (sdkError: any) {
            awsSdkStatus = 'error';
            awsSdkError = sdkError.message;
        }

        return NextResponse.json({
            status: 'debug_info',
            message: 'Environment debugging information',
            environment: envCheck,
            awsSdk: {
                status: awsSdkStatus,
                error: awsSdkError
            },
            recommendations: generateRecommendations(envCheck, awsSdkStatus)
        }, {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (debugError: any) {
        console.error('❌ Debug endpoint error:', debugError);

        // Return error info even if debug fails
        return NextResponse.json({
            status: 'debug_error',
            message: 'Debug endpoint encountered an error',
            error: debugError.message,
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV || 'unknown'
        }, { status: 500 });
    }
}

function generateRecommendations(envCheck: any, awsSdkStatus: string) {
    const recommendations = [];

    // 🆕 KAJABI-SPECIFIC Checks
    if (!envCheck.kajabi.hasDistributorPassword) {
        recommendations.push('🚨 CRITICAL: Set KAJABI_DISTRIBUTOR_PASSWORD environment variable for webhook authentication');
    } else {
        recommendations.push('✅ KAJABI_DISTRIBUTOR_PASSWORD is configured');
    }

    if (!envCheck.kajabi.webhookReady) {
        recommendations.push('❌ Kajabi webhook not ready - missing required environment variables');
    } else {
        recommendations.push('🎉 Kajabi webhook is ready for production!');
    }

    // Existing checks
    if (!envCheck.aws.hasAccessKey || !envCheck.aws.hasSecretKey) {
        recommendations.push('❌ Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
    }

    if (!envCheck.api.hasApiEndpoint || !envCheck.api.hasApiKey) {
        recommendations.push('❌ Set API_ENDPOINT and API_KEY environment variables');
    }

    if (!envCheck.dynamodb.hasTableEnvVar) {
        recommendations.push('⚠️ Consider setting DYNAMODB_PURCHASE_ORDERS_TABLE environment variable');
    }

    if (awsSdkStatus === 'error') {
        recommendations.push('❌ AWS SDK issue detected - check package.json dependencies');
    }

    if (envCheck.nodeEnv !== 'production') {
        recommendations.push('ℹ️ Running in non-production environment');
    }

    if (recommendations.length === 1 && recommendations[0].includes('non-production')) {
        recommendations.push('✅ Environment looks good - ready to test webhook');
    }

    return recommendations;
}

// Also provide POST for testing
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();

        return NextResponse.json({
            message: 'Debug POST endpoint received data',
            bodyLength: body.length,
            bodyPreview: body.substring(0, 200),
            timestamp: new Date().toISOString(),
            headers: {
                contentType: request.headers.get('content-type'),
                userAgent: request.headers.get('user-agent')
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Debug POST failed',
            details: error.message
        }, { status: 500 });
    }
}