// src/app/logos/route.ts - UPDATED for Supabase users table
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import jwt from 'jsonwebtoken';
import { supabaseAuth } from '../../lib/supabaseAuth';

// Function to get current user from request
async function getCurrentUser(request: NextRequest) {
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
    
    // Get user from Supabase
    const user = await supabaseAuth.getUserById(decoded.id);
    
    return user;
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

    // Build the image generation request
    let imageRequest: any = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    };

    // Handle reference image if provided
    if (referenceImage) {
      const imageBuffer = Buffer.from(await referenceImage.arrayBuffer());
      const imageFile = await toFile(imageBuffer, referenceImage.name, { type: referenceImage.type });
      
      // Note: This example uses DALL-E 3. For image-to-image generation,
      // you might want to use a different approach or model
      imageRequest.prompt = `Based on this reference image, ${prompt}`;
    }

    console.log(`Generating logo for user ${user.email}: ${prompt.substring(0, 50)}...`);

    // Generate the image
    const response = await openai.images.generate(imageRequest);

    // Process the response
    let imageData: any;
    if (response?.data?.[0]?.b64_json) {
      imageData = {
        type: 'base64',
        data: response.data[0].b64_json
      };
    } else if (response?.data?.[0]?.url) {
      imageData = {
        type: 'url',
        data: response.data[0].url
      };
    } else {
      throw new Error('No image data received in the expected format');
    }
    
    // Update the user's logo count if this is not a revision
    let updatedUser = user;
    if (!isRevision) {
      updatedUser = await supabaseAuth.updateLogoCount(user.id, 1);
      console.log(`Updated logo count for ${user.email}: ${updatedUser.logosCreated}/${updatedUser.logosLimit}`);
    }
    
    // Return success with the image data
    return NextResponse.json({
      success: true,
      message: 'Logo generated successfully',
      image: imageData,
      usage: {
        logosCreated: updatedUser.logosCreated,
        logosLimit: updatedUser.logosLimit,
        remainingLogos: Math.max(0, updatedUser.logosLimit - updatedUser.logosCreated)
      }
    });
    
  } catch (error: any) {
    console.error('Error generating logo:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate logo', 
        details: error.message
      },
      { status: 500 }
    );
  }
}