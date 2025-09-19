// src/app/api/kajabi/route.ts - PERMISSION TESTING VERSION
import { NextRequest, NextResponse } from 'next/server';

let dynamoDB: any = null;
let dynamoDBService: any = null;

try {
    const AWS = require('aws-sdk');

    dynamoDB = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    dynamoDBService = new AWS.DynamoDB({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
} catch (initError: any) {
    console.error('❌ AWS SDK initialization error:', initError);
}

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Testing AppPurchaseOrders table permissions...');

        const tableName = 'AppPurchaseOrders';
        let permissionTests = {
            listTables: null,
            describeTable: null,
            scan: null,
            query: null,
            getItem: null
        };

        // Test 1: Can we list tables? (We know this works from previous test)
        try {
            const tablesResult = await dynamoDBService.listTables().promise();
            permissionTests.listTables = {
                success: true,
                tableCount: tablesResult.TableNames.length,
                hasAppPurchaseOrders: tablesResult.TableNames.includes(tableName)
            };
            console.log('📋 Tables visible to webhook credentials:', tablesResult.TableNames);
        } catch (err: any) {
            permissionTests.listTables = { success: false, error: err.message };
        }

        // Test 2: Can we describe the specific table?
        try {
            const tableDescription = await dynamoDBService.describeTable({
                TableName: tableName
            }).promise();

            permissionTests.describeTable = {
                success: true,
                status: tableDescription.Table.TableStatus,
                itemCount: tableDescription.Table.ItemCount,
                keySchema: tableDescription.Table.KeySchema,
                attributes: tableDescription.Table.AttributeDefinitions,
                billing: tableDescription.Table.BillingModeSummary
            };
        } catch (err: any) {
            permissionTests.describeTable = {
                success: false,
                error: err.message,
                code: err.code,
                statusCode: err.statusCode
            };
        }

        // Test 3: Can we scan the table?
        try {
            const scanResult = await dynamoDB.scan({
                TableName: tableName,
                Limit: 1
            }).promise();

            permissionTests.scan = {
                success: true,
                count: scanResult.Count,
                scannedCount: scanResult.ScannedCount,
                hasItems: (scanResult.Items && scanResult.Items.length > 0)
            };
        } catch (err: any) {
            permissionTests.scan = {
                success: false,
                error: err.message,
                code: err.code,
                statusCode: err.statusCode
            };
        }

        // Test 4: Can we query with the composite key structure?
        try {
            const queryResult = await dynamoDB.query({
                TableName: tableName,
                KeyConditionExpression: 'DistributorId = :distributorId',
                ExpressionAttributeValues: {
                    ':distributorId': 'kajabi-direct'
                },
                Limit: 1
            }).promise();

            permissionTests.query = {
                success: true,
                count: queryResult.Count,
                hasItems: (queryResult.Items && queryResult.Items.length > 0)
            };
        } catch (err: any) {
            permissionTests.query = {
                success: false,
                error: err.message,
                code: err.code,
                statusCode: err.statusCode
            };
        }

        // Test 5: Can we get a specific item?
        try {
            const getResult = await dynamoDB.get({
                TableName: tableName,
                Key: {
                    DistributorId: 'test-distributor',
                    OrderNumber: 'test-order-123'
                }
            }).promise();

            permissionTests.getItem = {
                success: true,
                hasItem: !!getResult.Item
            };
        } catch (err: any) {
            permissionTests.getItem = {
                success: false,
                error: err.message,
                code: err.code,
                statusCode: err.statusCode
            };
        }

        // Generate detailed diagnosis
        const diagnosis = generatePermissionDiagnosis(permissionTests);

        return NextResponse.json({
            message: 'AppPurchaseOrders permission testing results',
            status: 'permission_test',
            timestamp: new Date().toISOString(),
            tableName: tableName,
            region: process.env.AWS_REGION || 'us-east-1',
            credentialsPrefix: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '***' : 'missing',
            tests: permissionTests,
            diagnosis: diagnosis
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Permission test error:', error);

        return NextResponse.json({
            error: 'Permission testing failed',
            details: error.message
        }, { status: 500 });
    }
}

function generatePermissionDiagnosis(tests: any) {
    const diagnosis = [];

    if (tests.listTables?.success) {
        diagnosis.push('✅ Can list DynamoDB tables');
        if (tests.listTables.hasAppPurchaseOrders) {
            diagnosis.push('✅ AppPurchaseOrders table is visible in table list');
        }
    } else {
        diagnosis.push('❌ Cannot list DynamoDB tables');
        return diagnosis.concat(['🚨 Basic DynamoDB access denied - check IAM permissions']);
    }

    if (tests.describeTable?.success) {
        diagnosis.push('✅ Can describe AppPurchaseOrders table structure');
        diagnosis.push(`📊 Table status: ${tests.describeTable.status}`);
        diagnosis.push(`📊 Estimated items: ${tests.describeTable.itemCount || 0}`);

        const keys = tests.describeTable.keySchema?.map((key: any) =>
            `${key.AttributeName} (${key.KeyType})`
        ).join(', ');
        diagnosis.push(`🔑 Keys: ${keys}`);
    } else {
        diagnosis.push('❌ Cannot describe AppPurchaseOrders table');
        diagnosis.push(`🚨 Error: ${tests.describeTable?.error}`);
    }

    if (tests.scan?.success) {
        diagnosis.push('✅ Can scan/read from AppPurchaseOrders table');
        diagnosis.push(`📊 Found ${tests.scan.count} items in scan`);
    } else {
        diagnosis.push('❌ Cannot scan AppPurchaseOrders table');
        diagnosis.push(`🚨 Read permission denied: ${tests.scan?.error}`);
    }

    if (tests.query?.success) {
        diagnosis.push('✅ Can query AppPurchaseOrders table');
    } else {
        diagnosis.push('❌ Cannot query AppPurchaseOrders table');
        diagnosis.push(`🚨 Query error: ${tests.query?.error}`);
    }

    if (tests.getItem?.success) {
        diagnosis.push('✅ Can get individual items from AppPurchaseOrders table');
    } else {
        diagnosis.push('❌ Cannot get items from AppPurchaseOrders table');
        diagnosis.push(`🚨 GetItem error: ${tests.getItem?.error}`);
    }

    // Overall recommendation
    const readPermissions = tests.scan?.success || tests.query?.success || tests.getItem?.success;
    const writePermissions = 'unknown'; // We'll test this in POST

    if (readPermissions) {
        diagnosis.push('🎉 GOOD NEWS: You have READ permissions to AppPurchaseOrders');
        diagnosis.push('📝 Next: Test WRITE permissions with POST request');
    } else {
        diagnosis.push('🚨 PROBLEM: No READ permissions to AppPurchaseOrders table');
        diagnosis.push('💡 Solution: Update IAM policy to include dynamodb:Scan, dynamodb:Query, dynamodb:GetItem');
    }

    return diagnosis;
}

export async function POST(request: NextRequest) {
    try {
        console.log('✅ Testing WRITE permissions to AppPurchaseOrders...');

        const body = await request.text();
        let parsedData = null;

        try {
            parsedData = JSON.parse(body);
        } catch (err: any) {
            return NextResponse.json({
                error: 'Invalid JSON in request body',
                details: err.message
            }, { status: 400 });
        }

        const tableName = 'AppPurchaseOrders';
        let writeTests = {
            put: null,
            update: null,
            delete: null
        };

        // Test 1: Can we PUT (create) a new item?
        if (parsedData && parsedData.id) {
            try {
                const testOrderNumber = `test_${parsedData.id}_${Date.now()}`;

                const testRecord = {
                    DistributorId: 'kajabi-direct',
                    OrderNumber: testOrderNumber,
                    CreatedAt: new Date().toISOString(),
                    Status: 'test',
                    Email: 'test@example.com',
                    Source: 'permission_test',
                    TestData: true
                };

                const putResult = await dynamoDB.put({
                    TableName: tableName,
                    Item: testRecord,
                    ConditionExpression: 'attribute_not_exists(DistributorId) AND attribute_not_exists(OrderNumber)'
                }).promise();

                writeTests.put = {
                    success: true,
                    orderNumber: testOrderNumber,
                    httpStatusCode: putResult.$response?.httpResponse?.statusCode
                };

                console.log('✅ PUT successful, created test record:', testOrderNumber);

                // Test 2: Can we UPDATE the item we just created?
                try {
                    const updateResult = await dynamoDB.update({
                        TableName: tableName,
                        Key: {
                            DistributorId: 'kajabi-direct',
                            OrderNumber: testOrderNumber
                        },
                        UpdateExpression: 'SET #status = :newStatus',
                        ExpressionAttributeNames: {
                            '#status': 'Status'
                        },
                        ExpressionAttributeValues: {
                            ':newStatus': 'updated_test'
                        }
                    }).promise();

                    writeTests.update = { success: true };
                    console.log('✅ UPDATE successful');

                } catch (updateErr: any) {
                    writeTests.update = {
                        success: false,
                        error: updateErr.message,
                        code: updateErr.code
                    };
                }

                // Test 3: Can we DELETE the test item?
                try {
                    const deleteResult = await dynamoDB.delete({
                        TableName: tableName,
                        Key: {
                            DistributorId: 'kajabi-direct',
                            OrderNumber: testOrderNumber
                        }
                    }).promise();

                    writeTests.delete = { success: true };
                    console.log('✅ DELETE successful - test record cleaned up');

                } catch (deleteErr: any) {
                    writeTests.delete = {
                        success: false,
                        error: deleteErr.message,
                        code: deleteErr.code
                    };
                }

            } catch (putErr: any) {
                writeTests.put = {
                    success: false,
                    error: putErr.message,
                    code: putErr.code,
                    statusCode: putErr.statusCode
                };
            }
        }

        const writePermissionDiagnosis = generateWritePermissionDiagnosis(writeTests);

        return NextResponse.json({
            message: 'AppPurchaseOrders WRITE permission test results',
            status: 'write_permission_test',
            timestamp: new Date().toISOString(),
            tableName: tableName,
            writeTests: writeTests,
            diagnosis: writePermissionDiagnosis,
            webhookStatus: writeTests.put?.success ? 'READY' : 'NEEDS_PERMISSIONS'
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Write permission test error:', error);

        return NextResponse.json({
            error: 'Write permission testing failed',
            details: error.message
        }, { status: 500 });
    }
}

function generateWritePermissionDiagnosis(tests: any) {
    const diagnosis = [];

    if (tests.put?.success) {
        diagnosis.push('✅ Can PUT (create) new records in AppPurchaseOrders');
        diagnosis.push('🎉 WEBHOOK WILL WORK - you have write permissions!');
    } else if (tests.put?.error) {
        diagnosis.push('❌ Cannot PUT (create) records in AppPurchaseOrders');
        diagnosis.push(`🚨 Error: ${tests.put.error}`);

        if (tests.put.code === 'UnauthorizedException') {
            diagnosis.push('💡 Solution: Add dynamodb:PutItem permission to your IAM policy');
        } else if (tests.put.code === 'ConditionalCheckFailedException') {
            diagnosis.push('✅ Actually, this error means write permissions work! (Record already exists)');
        }
    } else {
        diagnosis.push('⚠️ PUT test was skipped - send JSON data with "id" field to test');
    }

    if (tests.update?.success) {
        diagnosis.push('✅ Can UPDATE records in AppPurchaseOrders');
    } else if (tests.update?.error) {
        diagnosis.push('❌ Cannot UPDATE records');
        diagnosis.push(`💡 Missing permission: dynamodb:UpdateItem`);
    }

    if (tests.delete?.success) {
        diagnosis.push('✅ Can DELETE records (test cleanup successful)');
    } else if (tests.delete?.error) {
        diagnosis.push('⚠️ Cannot DELETE records (but this is OK for webhook)');
    }

    return diagnosis;
}