// src/app/api/kajabi/route.ts - MINIMAL TEST VERSION
// Replace your current file with this temporarily

import { NextRequest, NextResponse } from 'next/server';

// Step 1: Just test the basic route without any AWS imports
export async function GET(request: NextRequest) {
    try {
        console.log('✅ GET endpoint called successfully');

        return NextResponse.json({
            message: 'Minimal kajabi endpoint working',
            status: 'basic_success',
            timestamp: new Date().toISOString(),
            step: 1,
            environment: process.env.NODE_ENV || 'unknown'
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Basic GET error:', error);

        return NextResponse.json({
            error: 'Basic GET failed',
            details: error.message,
            step: 1
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('✅ POST endpoint called successfully');

        const body = await request.text();

        return NextResponse.json({
            message: 'Minimal kajabi POST working',
            status: 'basic_post_success',
            bodyLength: body.length,
            timestamp: new Date().toISOString(),
            step: 1
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Basic POST error:', error);

        return NextResponse.json({
            error: 'Basic POST failed',
            details: error.message,
            step: 1
        }, { status: 500 });
    }
}