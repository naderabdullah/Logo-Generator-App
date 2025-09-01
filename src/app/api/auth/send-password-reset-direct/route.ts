// src/app/api/auth/send-password-reset-direct/route.ts - ENHANCED DEBUG VERSION
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { DynamoDB } from 'aws-sdk';

// Initialize both DynamoDB clients
const dynamoDBClient = new DynamoDB({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Configuration constants
const APPUSERS_TABLE = 'AppUsers';

// Enhanced debug version of findUsersByEmail
async function findUsersByEmail(email: string): Promise<{ success: boolean; users?: any[]; error?: any; debugInfo?: any }> {
    try {
        console.log('🔍 === DEBUGGING DYNAMODB QUERY ===');
        console.log('🔍 Table:', APPUSERS_TABLE);
        console.log('🔍 Index:', 'EmailIndex');
        console.log('🔍 Email:', email);
        console.log('🔍 AWS Region:', process.env.AWS_REGION || 'us-east-1');
        console.log('🔍 AWS Access Key exists:', !!process.env.AWS_ACCESS_KEY_ID);
        console.log('🔍 AWS Secret Key exists:', !!process.env.AWS_SECRET_ACCESS_KEY);

        // Test basic table access first
        console.log('🔍 Step 1: Testing basic table access...');
        try {
            const describeResult = await dynamoDBClient.describeTable({
                TableName: APPUSERS_TABLE
            }).promise();
            console.log('✅ Table exists and is accessible');
            console.log('📊 Table status:', describeResult.Table?.TableStatus);
            console.log('📊 Table item count:', describeResult.Table?.ItemCount);

            // Check if EmailIndex exists
            const indexes = describeResult.Table?.GlobalSecondaryIndexes || [];
            const emailIndex = indexes.find(index => index.IndexName === 'EmailIndex');
            if (emailIndex) {
                console.log('✅ EmailIndex GSI found');
                console.log('📊 EmailIndex status:', emailIndex.IndexStatus);
            } else {
                console.log('❌ EmailIndex GSI NOT FOUND');
                console.log('📊 Available indexes:', indexes.map(i => i.IndexName));
                return {
                    success: false,
                    error: 'EmailIndex GSI not found',
                    debugInfo: { availableIndexes: indexes.map(i => i.IndexName) }
                };
            }
        } catch (describeError) {
            console.error('❌ Table describe failed:', describeError);
            return {
                success: false,
                error: describeError,
                debugInfo: { step: 'table_describe_failed', errorCode: describeError.code }
            };
        }

        // Test query with EmailIndex
        console.log('🔍 Step 2: Attempting EmailIndex query...');
        const queryParams = {
            TableName: APPUSERS_TABLE,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'Email = :email',
            ExpressionAttributeValues: {
                ':email': email.toLowerCase()
            }
        };

        console.log('🔍 Query params:', JSON.stringify(queryParams, null, 2));

        const queryResult = await dynamoDB.query(queryParams).promise();

        console.log('✅ Query successful');
        console.log('📊 Items found:', queryResult.Items?.length || 0);
        console.log('📊 Consumed capacity:', queryResult.ConsumedCapacity);

        if (queryResult.Items && queryResult.Items.length > 0) {
            console.log('📊 Sample user data:', queryResult.Items.map(user => ({
                AppId: user.AppId,
                Email: user.Email,
                SubAppId: user.SubAppId,
                Status: user.Status,
                EmailSubAppId: user.EmailSubAppId
            })));
        }

        return {
            success: true,
            users: queryResult.Items || [],
            debugInfo: {
                itemsFound: queryResult.Items?.length || 0,
                consumedCapacity: queryResult.ConsumedCapacity
            }
        };

    } catch (queryError: any) {
        console.error('❌ Query failed:', queryError);
        console.error('❌ Error code:', queryError.code);
        console.error('❌ Error message:', queryError.message);
        console.error('❌ Full error:', JSON.stringify(queryError, null, 2));

        return {
            success: false,
            error: queryError,
            debugInfo: {
                step: 'query_failed',
                errorCode: queryError.code,
                errorMessage: queryError.message,
                errorName: queryError.name
            }
        };
    }
}

// Main POST handler - ENHANCED DEBUG VERSION
export async function POST(request: NextRequest) {
    console.log('🧪 === DEBUG MODE: Direct AppUsers Password Reset ===');

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log('🔍 Processing password reset for:', email);
        console.log('🔍 Environment check:');
        console.log('  - NODE_ENV:', process.env.NODE_ENV);
        console.log('  - AWS_REGION:', process.env.AWS_REGION);
        console.log('  - Has AWS_ACCESS_KEY_ID:', !!process.env.AWS_ACCESS_KEY_ID);
        console.log('  - Has AWS_SECRET_ACCESS_KEY:', !!process.env.AWS_SECRET_ACCESS_KEY);
        console.log('  - Access Key Preview:', process.env.AWS_ACCESS_KEY_ID?.substring(0, 4) + '...');

        // Test DynamoDB connection first
        console.log('🔍 Testing DynamoDB connection...');
        const result = await findUsersByEmail(email);

        if (!result.success) {
            console.error('❌ DynamoDB query failed:', result.error);

            return NextResponse.json({
                error: 'Database query failed - check console for details',
                debug: {
                    step: 'database_query_failed',
                    errorCode: result.error?.code,
                    errorMessage: result.error?.message,
                    debugInfo: result.debugInfo,
                    table: APPUSERS_TABLE,
                    region: process.env.AWS_REGION || 'us-east-1'
                }
            }, { status: 500 });
        }

        const users = result.users || [];
        console.log(`✅ Query successful - found ${users.length} users`);

        if (users.length === 0) {
            return NextResponse.json({
                message: 'If the email exists in our system, a reset link has been sent',
                debug: {
                    method: 'Direct AppUsers query',
                    usersFound: 0,
                    tableUsed: APPUSERS_TABLE,
                    querySuccessful: true
                }
            });
        }

        // For now, just return success with debug info (no actual email sending until query works)
        return NextResponse.json({
            message: 'Password reset would be sent successfully',
            debug: {
                method: 'Direct AppUsers query',
                usersFound: users.length,
                tableUsed: APPUSERS_TABLE,
                querySuccessful: true,
                userPreview: users.map(u => ({
                    AppId: u.AppId,
                    Status: u.Status,
                    SubAppId: u.SubAppId
                })),
                debugInfo: result.debugInfo
            }
        });

    } catch (error: any) {
        console.error('❌ Outer catch error:', error);
        console.error('❌ Error stack:', error.stack);

        return NextResponse.json({
            error: 'Password reset request failed. Please try again later.',
            debug: {
                errorMessage: error.message,
                errorStack: error.stack,
                errorName: error.name,
                step: 'outer_catch'
            }
        }, { status: 500 });
    }
}

// GET endpoint for testing connection
export async function GET() {
    console.log('🧪 === TESTING DYNAMODB CONNECTION ===');

    try {
        // Test table access
        const describeResult = await dynamoDBClient.describeTable({
            TableName: APPUSERS_TABLE
        }).promise();

        const indexes = describeResult.Table?.GlobalSecondaryIndexes || [];

        return NextResponse.json({
            message: 'DynamoDB Connection Test',
            status: 'success',
            debug: {
                tableName: APPUSERS_TABLE,
                tableStatus: describeResult.Table?.TableStatus,
                itemCount: describeResult.Table?.ItemCount,
                region: process.env.AWS_REGION || 'us-east-1',
                availableIndexes: indexes.map(i => ({
                    name: i.IndexName,
                    status: i.IndexStatus,
                    keys: i.KeySchema
                })),
                hasEmailIndex: indexes.some(i => i.IndexName === 'EmailIndex'),
                awsConfigured: {
                    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
                    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
                    accessKeyPreview: process.env.AWS_ACCESS_KEY_ID?.substring(0, 4) + '...'
                }
            }
        });

    } catch (error: any) {
        console.error('❌ Connection test failed:', error);

        return NextResponse.json({
            message: 'DynamoDB Connection Test Failed',
            status: 'error',
            debug: {
                errorCode: error.code,
                errorMessage: error.message,
                errorName: error.name,
                region: process.env.AWS_REGION || 'us-east-1',
                tableName: APPUSERS_TABLE
            }
        });
    }
}