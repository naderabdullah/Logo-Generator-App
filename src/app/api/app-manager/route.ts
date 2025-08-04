import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = request.nextUrl.searchParams.get('action');
    
    // Use server-side environment variables (without  prefix)
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiKey = process.env.API_KEY;
    
    if (!apiEndpoint || !apiKey) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const apiUrl = `${apiEndpoint}/app-manager?action=${action}`;
    console.log('Full API URL:', apiUrl);
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    console.log('API Response status:', response.status);
    
    const responseText = await response.text();
    console.log('API Response body:', responseText);
    
    if (!response.ok) {
      console.error('API Error - Status:', response.status);
      console.error('API Error - Body:', responseText);
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      return NextResponse.json(
        { 
          error: `API returned ${response.status}`,
          details: errorData 
        },
        { status: response.status }
      );
    }
    
    const data = JSON.parse(responseText);
    console.log('Success response:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('=== PROXY ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}