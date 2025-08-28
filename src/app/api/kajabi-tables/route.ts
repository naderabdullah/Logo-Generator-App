// src/app/api/kajabi-tables/route.ts - NEW SIMPLE ENDPOINT
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Getting simple table list...');

        const AWS = require('aws-sdk');
        const dynamoDBService = new AWS.DynamoDB({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });

        const tablesResult = await dynamoDBService.listTables().promise();
        const tableNames = tablesResult.TableNames || [];

        console.log('📋 Tables found:', tableNames);

        return NextResponse.json({
            message: 'Tables visible to webhook credentials',
            timestamp: new Date().toISOString(),
            region: process.env.AWS_REGION || 'us-east-1',
            credentialsPrefix: process.env.AWS_ACCESS_KEY_ID ?
                process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '***' : 'missing',
            tableCount: tableNames.length,
            tables: tableNames,
            analysis: {
                hasAppPurchaseOrders: tableNames.includes('AppPurchaseOrders'),
                hasIncomingOrders: tableNames.includes('IncomingOrders'),
                hasUsers: tableNames.includes('Users'),
                hasApps: tableNames.includes('Apps'),
                looksSimilar: tableNames.some(name =>
                    name.toLowerCase().includes('purchase') ||
                    name.toLowerCase().includes('order')
                )
            },
            recommendations: generateSimpleRecommendations(tableNames)
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Simple table list error:', error);

        return NextResponse.json({
            error: 'Failed to list tables',
            details: error.message
        }, { status: 500 });
    }
}

function generateSimpleRecommendations(tables: string[]) {
    const recommendations = [];

    if (tables.length === 0) {
        recommendations.push('❌ No tables found - check AWS credentials and region');
        return recommendations;
    }

    if (tables.includes('AppPurchaseOrders')) {
        recommendations.push('✅ Perfect! AppPurchaseOrders table is accessible');
        recommendations.push('🎉 Your webhook should work - try the original route');
    } else {
        recommendations.push(`❌ AppPurchaseOrders not in your ${tables.length} visible tables`);

        // Look for similar tables
        const orderTables = tables.filter(name =>
            name.toLowerCase().includes('order') ||
            name.toLowerCase().includes('purchase')
        );

        if (orderTables.length > 0) {
            recommendations.push(`💡 Found similar tables: ${orderTables.join(', ')}`);
            recommendations.push('💡 Consider using one of these instead, or check if AppPurchaseOrders is in different AWS account/region');
        } else {
            recommendations.push('💡 No order/purchase related tables found');
            recommendations.push('🔍 You might be in wrong AWS account or region');
        }

        // Check if these look like production tables
        if (tables.some(name => name.includes('Users') || name.includes('App'))) {
            recommendations.push('✅ Tables look production-like, but missing AppPurchaseOrders access');
            recommendations.push('💡 Solution: Update IAM policy to include AppPurchaseOrders table');
        } else {
            recommendations.push('⚠️ Tables don\'t match expected pattern - might be wrong environment');
        }
    }

    return recommendations;
}