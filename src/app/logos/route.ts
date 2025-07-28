// src/app/logos/route.ts - FIXED VERSION with proper authentication
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import jwt from 'jsonwebtoken';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from '../../lib/supabaseAuth';

// Initialize DynamoDB client (needed to get user email from ID)
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// User interface for the combined user data
interface AuthenticatedUser {
  id: number; // DynamoDB ID
  supabaseId: number; // Supabase ID
  email: string;
  logosCreated: number;
  logosLimit: number;
}

// FIXED: Function to get current user from request (matches /api/user/route.ts pattern)
async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null | 'not_allowed'> {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(
      accessToken, 
      process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret'
    ) as { id: number, email: string };
    
    // FIXED: Get user auth data from DynamoDB first
    const dynamoResult = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: decoded.id }
    }).promise();
    
    if (!dynamoResult.Item) {
      return null;
    }
    
    // Check if user account status allows access ('active' or 'pending' only)
    const userStatus = dynamoResult.Item.Status || dynamoResult.Item.status;
    if (userStatus !== 'active' && userStatus !== 'pending') {
      console.log('User account status does not allow access, status:', userStatus, 'for email:', dynamoResult.Item.email);
      return 'not_allowed'; // Return a special value to distinguish from not found
    }
    
    // FIXED: Get user logo credits from Supabase using EMAIL (not ID)
    const supabaseUser = await supabaseAuth.getUserByEmail(dynamoResult.Item.email);
    
    if (!supabaseUser) {
      return null;
    }
    
    // FIXED: Combine auth data from DynamoDB with logo data from Supabase
    return {
      id: dynamoResult.Item.id, // Keep DynamoDB ID for compatibility
      supabaseId: supabaseUser.id, // Add Supabase ID for logo updates
      email: dynamoResult.Item.email,
      logosCreated: supabaseUser.logosCreated,
      logosLimit: supabaseUser.logosLimit
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// GET endpoint - Return user's logo usage statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is not allowed
    if (user === 'not_allowed') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      usage: {
        logosCreated: user.logosCreated,
        logosLimit: user.logosLimit,
        remainingLogos: Math.max(0, user.logosLimit - user.logosCreated)
      }
    });
  } catch (error) {
    console.error('Error fetching logo usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint - Generate logo and update credits
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const referenceImage = formData.get('referenceImage') as File | null;
    const isRevision = formData.get('isRevision') === 'true';
    const originalLogoId = formData.get('originalLogoId') ? parseInt(formData.get('originalLogoId') as string) : undefined;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is not allowed
    if (user === 'not_allowed') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 401 }
      );
    }

    // Check if user has remaining credits (only for new logos, not revisions)
    if (!isRevision && user.logosCreated >= user.logosLimit) {
      return NextResponse.json(
        { error: 'You have reached your logo generation limit. Please upgrade your plan or contact support.' },
        { status: 403 }
      );
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare the image generation request
    const imageRequest: any = {
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json'
    };

    // Add reference image if provided
    if (referenceImage) {
      // Convert file to buffer for OpenAI
      const buffer = Buffer.from(await referenceImage.arrayBuffer());
      const file = await toFile(buffer, referenceImage.name, {
        type: referenceImage.type
      });
      
      // Note: DALL-E 3 doesn't support reference images directly
      // You might need to modify the prompt instead or use a different approach
      imageRequest.prompt += ` (style reference provided)`;
    }

    console.log('Generating image with OpenAI...');
    
    // Generate the image
    const response = await openai.images.generate(imageRequest);
    
    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    const imageData = response.data[0];
    const base64Image = imageData.b64_json;
    
    if (!base64Image) {
      throw new Error('No image data received');
    }

    // Update user's logo count in Supabase (only for new logos, not revisions)
    let finalLogosCreated = user.logosCreated;
    let finalLogosLimit = user.logosLimit;
    
    if (!isRevision) {
      const supabaseUpdatedUser = await supabaseAuth.updateLogoCount(user.supabaseId, 1);
      console.log(`Updated logo count for user ${user.email}: ${supabaseUpdatedUser.logosCreated}/${supabaseUpdatedUser.logosLimit}`);
      
      // Update our counts with the new values
      finalLogosCreated = supabaseUpdatedUser.logosCreated;
      finalLogosLimit = supabaseUpdatedUser.logosLimit;
    }

    // Return the generated image and updated usage statistics
    return NextResponse.json({
      image: {
        type: 'base64',
        data: base64Image
      },
      usage: {
        logosCreated: finalLogosCreated,
        logosLimit: finalLogosLimit,
        remainingLogos: Math.max(0, finalLogosLimit - finalLogosCreated)
      },
      isRevision: isRevision,
      message: isRevision 
        ? 'Logo revision generated successfully' 
        : 'Logo generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating logo:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: 'The image prompt violates OpenAI content policy. Please try a different description.' },
        { status: 400 }
      );
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate logo' },
      { status: 500 }
    );
  }
}