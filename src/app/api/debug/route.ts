// src/app/api/debug/route.ts - Add this temporarily to test config
import { NextRequest, NextResponse } from 'next/server';

// Add to src/app/api/debug/route.ts
export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasApiEndpoint: !!process.env.API_ENDPOINT,
    hasApiKey: !!process.env.API_KEY,
    endpoint: process.env.API_ENDPOINT ? 'configured' : 'missing',
    apiKey: process.env.API_KEY ? 'configured' : 'missing',
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasAwsConfig: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    // Add Supabase checks
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabasePublicUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY
  });
}