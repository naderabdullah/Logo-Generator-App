// src/app/api/debug/aws-tables/route.ts - Debug AWS access
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';

export async function GET(request: NextRequest) {
    console.log('🔍 === AWS CREDENTIALS DEBUG ===');

    try {
        // Test different regions
        const regionsToTest = ['us-east-1', 'us-west-2', 'eu-west-1'];
        const results = {};

        for (const region of regionsToTest) {
            console.log(`🔍 Testing region: ${region}`);

            const dynamoDBClient = new DynamoDB({
                region: region,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            });

            try {
                // List tables in this region
                const listResult = await dynamoDBClient.listTables().promise();
                results[region] = {
                    success: true,
                    tableCount: listResult.TableNames?.length || 0,
                    tables: listResult.TableNames || [],
                    hasAppUsers: listResult.TableNames?.includes('AppUsers') || false,
                    hasUsersTable: listResult.TableNames?.includes('users') || false
                };

                console.log(`✅ ${region}: Found ${listResult.TableNames?.length || 0} tables`);
                console.log(`📊 ${region} Tables:`, listResult.TableNames);

            } catch (regionError: any) {
                console.error(`❌ ${region} Error:`, regionError.message);
                results[region] = {
                    success: false,
                    error: regionError.message,
                    errorCode: regionError.code
                };
            }
        }

        // Check if AppUsers exists in ANY region
        const appUsersRegions = Object.entries(results)
            .filter(([region, data]: [string, any]) => data.success && data.hasAppUsers)
            .map(([region]) => region);

        return NextResponse.json({
            message: 'AWS Credentials Debug Results',
            credentials: {
                hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
                hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
                accessKeyPreview: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...',
                configuredRegion: process.env.AWS_REGION || 'us-east-1'
            },
            regions: results,
            summary: {
                appUsersFoundInRegions: appUsersRegions,
                recommendedRegion: appUsersRegions[0] || 'not-found',
                totalRegionsTested: regionsToTest.length
            },
            recommendations: appUsersRegions.length > 0
                ? [`✅ AppUsers table found in: ${appUsersRegions.join(', ')}`,
                    `💡 Update AWS_REGION to: ${appUsersRegions[0]}`]
                : ['❌ AppUsers table not found in any tested region',
                    '💡 Check if you\'re using the correct AWS credentials',
                    '💡 The Lambda might be using different credentials/account']
        });

    } catch (error: any) {
        console.error('❌ Debug failed:', error);

        return NextResponse.json({
            message: 'AWS Debug Failed',
            error: error.message,
            credentials: {
                hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
                hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
                configuredRegion: process.env.AWS_REGION || 'us-east-1'
            }
        });
    }
}