// src/app/api/kajabi-test-simple/route.ts - Simple webhook test
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const timestamp = new Date().toISOString();

    try {
        const body = await request.text();
        console.log('=== SIMPLE KAJABI TEST ===');
        console.log('Timestamp:', timestamp);
        console.log('Headers:', Object.fromEntries(request.headers.entries()));
        console.log('Body length:', body.length);
        console.log('Raw body:', body);

        if (body) {
            try {
                const parsed = JSON.parse(body);
                console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('Body is not valid JSON');
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook test received successfully',
            timestamp,
            bodyLength: body.length,
            hasData: !!body
        });

    } catch (error: any) {
        console.error('Test webhook error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp
        });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Simple Kajabi webhook test endpoint',
        instructions: [
            '1. Set this URL as your Kajabi webhook URL',
            '2. Make a test purchase',
            '3. Check the logs to see what data is received',
            '4. Then switch back to the main /api/kajabi endpoint'
        ],
        timestamp: new Date().toISOString()
    });
}