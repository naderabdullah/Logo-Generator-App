// Create: src/app/api/debug/simple-login-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Debug route called');

        // Check environment variables first
        const envCheck = {
            hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
            hasRegion: !!process.env.AWS_REGION,
            hasTable: !!process.env.DYNAMODB_USERS_TABLE,
            region: process.env.AWS_REGION || 'us-east-1',
            tableName: process.env.DYNAMODB_USERS_TABLE || 'users'
        };

        console.log('🔍 Environment check:', envCheck);

        if (!envCheck.hasAwsKey || !envCheck.hasAwsSecret) {
            return NextResponse.json({
                error: 'Missing AWS credentials',
                details: envCheck
            }, { status: 500 });
        }

        // Try to import DynamoDB
        let dynamoDB;
        try {
            const { DynamoDB } = await import('aws-sdk');
            dynamoDB = new DynamoDB.DocumentClient({
                region: envCheck.region,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            });
            console.log('✅ DynamoDB client created');
        } catch (importError) {
            console.error('❌ DynamoDB import error:', importError);
            return NextResponse.json({
                error: 'Failed to import AWS SDK',
                details: importError.message
            }, { status: 500 });
        }

        // Try to get request body
        let email, password;
        try {
            const body = await request.json();
            email = body.email;
            password = body.password;

            if (!email || !password) {
                return NextResponse.json({
                    error: 'Missing email or password',
                    received: { email: !!email, password: !!password }
                }, { status: 400 });
            }

            console.log('📧 Testing login for:', email);
        } catch (bodyError) {
            console.error('❌ Body parsing error:', bodyError);
            return NextResponse.json({
                error: 'Invalid request body',
                details: bodyError.message
            }, { status: 400 });
        }

        // Try to find user in database
        let user, userStatus;
        try {
            console.log('🔍 Scanning DynamoDB for user...');

            const result = await dynamoDB.scan({
                TableName: envCheck.tableName,
                FilterExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': email.toLowerCase()
                }
            }).promise();

            console.log('📊 Scan result:', {
                itemCount: result.Items?.length || 0,
                hasItems: !!(result.Items && result.Items.length > 0)
            });

            if (!result.Items || result.Items.length === 0) {
                return NextResponse.json({
                    success: false,
                    reason: 'USER_NOT_FOUND',
                    message: `No user found with email: ${email}`,
                    details: {
                        tableName: envCheck.tableName,
                        searchEmail: email.toLowerCase()
                    }
                });
            }

            user = result.Items[0];
            userStatus = user.Status || user.status;

            console.log('✅ User found:', {
                id: user.id,
                email: user.email,
                status: userStatus,
                hasPassword: !!user.password
            });

        } catch (dbError) {
            console.error('❌ Database error:', dbError);
            return NextResponse.json({
                error: 'Database query failed',
                details: {
                    message: dbError.message,
                    code: dbError.code,
                    tableName: envCheck.tableName
                }
            }, { status: 500 });
        }

        // Try to check password
        let passwordMatches = false;
        try {
            const bcrypt = await import('bcryptjs');
            passwordMatches = await bcrypt.compare(password, user.password);
            console.log('🔐 Password check:', passwordMatches ? 'MATCH' : 'NO MATCH');
        } catch (bcryptError) {
            console.error('❌ Password check error:', bcryptError);
            return NextResponse.json({
                error: 'Password verification failed',
                details: bcryptError.message
            }, { status: 500 });
        }

        if (!passwordMatches) {
            return NextResponse.json({
                success: false,
                reason: 'INVALID_PASSWORD',
                message: 'Password does not match'
            });
        }

        // Check superuser status (simplified)
        let isSuperUser = false;
        try {
            const envSuperUsers = process.env.SUPERUSER_EMAILS;
            if (envSuperUsers) {
                const superUserList = envSuperUsers.split(',').map(e => e.trim().toLowerCase());
                isSuperUser = superUserList.includes(email.toLowerCase());
            }
            console.log('👑 Superuser check:', {
                isSuperUser,
                envSuperUsers: envSuperUsers || 'NOT SET'
            });
        } catch (superError) {
            console.log('⚠️ Superuser check failed, assuming not superuser');
            isSuperUser = false;
        }

        // Determine outcomes
        const dynamoLoginWouldReject = userStatus !== 'active';
        const getCurrentUserWouldReject = userStatus !== 'active' && userStatus !== 'pending';

        let outcome, explanation;

        if (isSuperUser) {
            outcome = 'SUCCESS_SUPERUSER_BYPASS';
            explanation = 'User is superuser and bypasses all status checks';
        } else if (dynamoLoginWouldReject) {
            outcome = 'BLOCKED_AT_LOGIN';
            explanation = `dynamo-login would reject: status '${userStatus}' is not 'active'`;
        } else {
            outcome = 'SUCCESS_NORMAL_LOGIN';
            explanation = `User passes all checks: status '${userStatus}' is 'active'`;
        }

        console.log('🎯 Final outcome:', outcome);

        return NextResponse.json({
            success: !dynamoLoginWouldReject || isSuperUser,
            outcome,
            explanation,
            details: {
                userFound: true,
                passwordValid: true,
                userStatus,
                isSuperUser,
                dynamoLoginWouldReject,
                getCurrentUserWouldReject,
                environmentSuperUsers: process.env.SUPERUSER_EMAILS || 'NOT SET',
                environmentCheck: envCheck
            }
        });

    } catch (error: any) {
        console.error('💥 Unexpected error in debug route:', error);

        return NextResponse.json({
            error: 'Unexpected error in debug route',
            details: {
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack trace
                type: error.constructor.name
            }
        }, { status: 500 });
    }
}

// Also add a GET endpoint to test if the route works at all
export async function GET() {
    return NextResponse.json({
        message: 'Debug route is working',
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV,
            hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
            awsRegion: process.env.AWS_REGION || 'us-east-1',
            tableName: process.env.DYNAMODB_USERS_TABLE || 'users'
        }
    });
}