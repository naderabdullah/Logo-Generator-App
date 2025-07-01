// src/app/api/debug/route.ts - Add this temporarily to test config
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasApiEndpoint: !!process.env.NEXT_PUBLIC_API_ENDPOINT,
    hasApiKey: !!process.env.NEXT_PUBLIC_API_KEY,
    endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT ? 'configured' : 'missing',
    apiKey: process.env.NEXT_PUBLIC_API_KEY ? 'configured' : 'missing',
    // Add other relevant env vars
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasAwsConfig: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  });
}