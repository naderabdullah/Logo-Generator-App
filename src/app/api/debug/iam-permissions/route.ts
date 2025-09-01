// src/app/api/debug/iam-permissions/route.ts - Debug IAM permissions
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';

export async function GET(request: NextRequest) {
    console.log('🔍 === IAM PERMISSIONS DEBUG ===');

    const dynamoDB = new DynamoDB.DocumentClient({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const dynamoDBClient = new DynamoDB({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const results = {
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...',
            region: process.env.AWS_REGION || 'us-east-1'
        },
        permissionTests: {}
    };

    // Test different DynamoDB operations on different tables
    const tablesToTest = ['users', 'Users', 'AppUsers'];

    for (const tableName of tablesToTest) {
        console.log(`🔍 Testing permissions for table: ${tableName}`);

        const tableResults = {
            tableName,
            operations: {}
        };

        // Test 1: DescribeTable (basic table info)
        try {
            const describeResult = await dynamoDBClient.describeTable({ TableName: tableName }).promise();
            tableResults.operations.describeTable = {
                success: true,
                status: describeResult.Table?.TableStatus,
                itemCount: describeResult.Table?.ItemCount
            };
            console.log(`✅ ${tableName}: DescribeTable SUCCESS`);
        } catch (error: any) {
            tableResults.operations.describeTable = {
                success: false,
                error: error.code,
                message: error.message
            };
            console.log(`❌ ${tableName}: DescribeTable FAILED - ${error.code}`);
        }

        // Test 2: Scan (count items)
        try {
            const scanResult = await dynamoDB.scan({
                TableName: tableName,
                Select: 'COUNT'
            }).promise();

            tableResults.operations.scan = {
                success: true,
                count: scanResult.Count
            };
            console.log(`✅ ${tableName}: Scan SUCCESS - ${scanResult.Count} items`);
        } catch (error: any) {
            tableResults.operations.scan = {
                success: false,
                error: error.code,
                message: error.message
            };
            console.log(`❌ ${tableName}: Scan FAILED - ${error.code}`);
        }

        // Test 3: Query (if table has GSI)
        if (tableName === 'AppUsers') {
            try {
                // Test EmailIndex GSI access
                const queryResult = await dynamoDB.query({
                    TableName: tableName,
                    IndexName: 'EmailIndex',
                    KeyConditionExpression: 'Email = :email',
                    ExpressionAttributeValues: {
                        ':email': 'test@nonexistent.com'
                    },
                    Select: 'COUNT'
                }).promise();

                tableResults.operations.queryGSI = {
                    success: true,
                    indexName: 'EmailIndex',
                    count: queryResult.Count
                };
                console.log(`✅ ${tableName}: Query GSI SUCCESS`);
            } catch (error: any) {
                tableResults.operations.queryGSI = {
                    success: false,
                    error: error.code,
                    message: error.message,
                    indexName: 'EmailIndex'
                };
                console.log(`❌ ${tableName}: Query GSI FAILED - ${error.code}`);
            }
        }

        // Test 4: UpdateItem (write permission test)
        try {
            // Try to update a non-existent item (should fail gracefully)
            await dynamoDB.update({
                TableName: tableName,
                Key: tableName === 'AppUsers'
                    ? { AppId: 'TEST', EmailSubAppId: 'test@permission.check' }
                    : { id: 999999 },
                UpdateExpression: 'SET #testAttr = :testVal',
                ExpressionAttributeNames: {
                    '#testAttr': 'permissionTest'
                },
                ExpressionAttributeValues: {
                    ':testVal': 'test'
                },
                ConditionExpression: 'attribute_exists(id)' // This will fail, but tests permission
            }).promise();

            // If we get here, permission exists (shouldn't happen due to condition)
            tableResults.operations.update = {
                success: true,
                note: 'Write permission exists'
            };
        } catch (error: any) {
            if (error.code === 'ConditionalCheckFailedException') {
                // This is expected - means we have write permission but item doesn't exist
                tableResults.operations.update = {
                    success: true,
                    note: 'Write permission exists (conditional check failed as expected)',
                    hasWritePermission: true
                };
                console.log(`✅ ${tableName}: Write permission EXISTS`);
            } else {
                tableResults.operations.update = {
                    success: false,
                    error: error.code,
                    message: error.message,
                    hasWritePermission: false
                };
                console.log(`❌ ${tableName}: Write permission DENIED - ${error.code}`);
            }
        }

        results.permissionTests[tableName] = tableResults;
    }

    // Generate recommendations
    const recommendations = [];

    // Check AppUsers permissions
    const appUsersPerms = results.permissionTests.AppUsers?.operations;
    if (appUsersPerms) {
        if (!appUsersPerms.describeTable?.success) {
            recommendations.push('❌ Cannot describe AppUsers table - need dynamodb:DescribeTable permission');
        }
        if (!appUsersPerms.scan?.success) {
            recommendations.push('❌ Cannot scan AppUsers table - need dynamodb:Scan permission');
        }
        if (!appUsersPerms.queryGSI?.success) {
            recommendations.push('❌ Cannot query AppUsers GSI - need dynamodb:Query permission');
        }
        if (!appUsersPerms.update?.hasWritePermission) {
            recommendations.push('❌ Cannot update AppUsers table - need dynamodb:UpdateItem permission');
        }

        if (appUsersPerms.describeTable?.success &&
            appUsersPerms.scan?.success &&
            appUsersPerms.queryGSI?.success) {
            recommendations.push('✅ AppUsers permissions look good!');
        }
    }

    // IAM policy suggestion
    const requiredPermissions = [
        'dynamodb:DescribeTable',
        'dynamodb:Scan',
        'dynamodb:Query',
        'dynamodb:UpdateItem',
        'dynamodb:PutItem'
    ];

    const suggestedPolicy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": requiredPermissions,
                "Resource": [
                    `arn:aws:dynamodb:${results.credentials.region}:*:table/AppUsers`,
                    `arn:aws:dynamodb:${results.credentials.region}:*:table/AppUsers/index/*`
                ]
            }
        ]
    };

    return NextResponse.json({
        message: 'IAM Permissions Debug Results',
        ...results,
        recommendations,
        suggestedIAMPolicy: suggestedPolicy,
        instructions: {
            step1: 'Go to AWS IAM Console',
            step2: 'Find the IAM user/role for your access key: ' + (process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...'),
            step3: 'Add the suggested policy above to grant AppUsers table access',
            step4: 'Test again after policy update'
        }
    });
}