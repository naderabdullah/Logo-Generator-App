import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to check environment variables
export async function GET(request: NextRequest) {
  // Check if the API key exists and mask it for security
  const apiKey = process.env.OPENROUTER_API_KEY;
  const maskedApiKey = apiKey ? 
    `${apiKey.substring(0, 4)}...${apiKey.slice(-4)}` : 
    'Not set';
  
  const envVars = {
    apiKeyExists: !!apiKey,
    apiKeyFirstFourChars: apiKey ? apiKey.substring(0, 4) : 'None',
    maskedApiKey,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Not set',
    nodeEnv: process.env.NODE_ENV || 'Not set',
    // List all environment variables (excluding their values for security)
    availableEnvVars: Object.keys(process.env)
      .filter(key => !key.includes('SECRET') && !key.includes('KEY'))
  };
  
  return NextResponse.json(envVars);
}