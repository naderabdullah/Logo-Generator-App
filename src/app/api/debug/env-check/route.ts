// Create: src/app/api/debug/env-check/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        title: "Environment Variables Check",
        timestamp: new Date().toISOString(),

        environment: {
            // Environment variables check
            API_ENDPOINT: {
                set: !!process.env.API_ENDPOINT,
                value: process.env.API_ENDPOINT ?
                    process.env.API_ENDPOINT.substring(0, 30) + '...' :
                    'NOT SET'
            },
            API_KEY: {
                set: !!process.env.API_KEY,
                length: process.env.API_KEY ? process.env.API_KEY.length : 0
            },
            NEXTAUTH_URL: {
                set: !!process.env.NEXTAUTH_URL,
                value: process.env.NEXTAUTH_URL || 'NOT SET'
            },
            SITE_URL: {
                set: !!process.env.SITE_URL,
                value: process.env.SITE_URL || 'NOT SET'
            }
        },

        // Test URL construction
        testUrls: {
            lambdaUrl: process.env.API_ENDPOINT ?
                `${process.env.API_ENDPOINT}/app-manager?action=sendPasswordReset` :
                'CANNOT CONSTRUCT - API_ENDPOINT MISSING',
            resetUrl: (process.env.NEXTAUTH_URL || process.env.SITE_URL) ?
                `${process.env.NEXTAUTH_URL || process.env.SITE_URL}/reset-password?token=TEST_TOKEN&email=test%40example.com` :
                'CANNOT CONSTRUCT - APP URL MISSING'
        },

        status: {
            ready: !!(process.env.API_ENDPOINT && process.env.API_KEY && (process.env.NEXTAUTH_URL || process.env.SITE_URL)),
            issues: [
                !process.env.API_ENDPOINT && "❌ API_ENDPOINT not set",
                !process.env.API_KEY && "❌ API_KEY not set",
                !(process.env.NEXTAUTH_URL || process.env.SITE_URL) && "❌ Neither NEXTAUTH_URL nor SITE_URL set"
            ].filter(Boolean)
        }
    });
}