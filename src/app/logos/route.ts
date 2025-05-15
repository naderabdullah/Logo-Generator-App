// src/app/api/logos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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
    ) as { id: number };
    
    // Get user from DynamoDB
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: decoded.id }
    }).promise();
    
    return result.Item;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Function to update user's logo count
async function updateUserLogoCount(userId: number, increment: number = 1) {
  try {
    const result = await dynamoDB.update({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'users',
      Key: { id: userId },
      UpdateExpression: 'SET logosCreated = logosCreated + :inc',
      ExpressionAttributeValues: {
        ':inc': increment
      },
      ReturnValues: 'ALL_NEW'
    }).promise();
    
    return result.Attributes;
  } catch (error) {
    console.error('Error updating user logo count:', error);
    throw error;
  }
}

// GET endpoint - Return user's logo usage statistics
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Return usage statistics (not the actual logos since they're in IndexedDB)
    return NextResponse.json({
      usage: {
        logosCreated: user.logosCreated || 0,
        logosLimit: user.logosLimit || 10,
        remainingLogos: Math.max(0, (user.logosLimit || 10) - (user.logosCreated || 0))
      }
    });
  } catch (error) {
    console.error('Error fetching logo usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo usage statistics' },
      { status: 500 }
    );
  }
}

// POST endpoint - Generate logo and update usage count
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the form data first to determine if this is a revision
    const formData = await request.formData();
    
    // Extract parameters for logo generation
    const prompt = formData.get('prompt') as string;
    const referenceImage = formData.get('referenceImage') as File | null;
    const originalLogoId = formData.get('originalLogoId') as string | null;
    const isRevision = originalLogoId !== null;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Check limits based on whether this is a revision or original logo
    if (!isRevision) {
      // For original logos, check the global limit
      if ((user.logosLimit || 0) <= 0) {
        return NextResponse.json(
          { error: 'Your account does not have any logo credits. Please upgrade your plan.' },
          { status: 403 }
        );
      }
      
      if ((user.logosCreated || 0) >= (user.logosLimit || 0)) {
        return NextResponse.json(
          { error: 'You have reached your logo creation limit. Please upgrade your plan.' },
          { status: 403 }
        );
      }
    } else if (originalLogoId) {
      // For revisions, check if already reached 3 revisions for this logo
      try {
        // Get all logos with this originalLogoId from DynamoDB
        const revisions = await dynamoDB.query({
          TableName: process.env.DYNAMODB_LOGOS_TABLE || 'logos',
          IndexName: 'originalLogoId-index',
          KeyConditionExpression: 'originalLogoId = :originalId',
          ExpressionAttributeValues: {
            ':originalId': originalLogoId
          }
        }).promise();
        
        const revisionCount = revisions.Items ? revisions.Items.length : 0;
        
        if (revisionCount >= 3) {
          return NextResponse.json(
            { error: 'You have reached the maximum of 3 revisions for this logo.' },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('Error checking revision count:', error);
        // If we can't check, we'll proceed - better UX than blocking
      }
    }

    console.log('Generating image with prompt:', prompt);
    console.log('Reference image provided:', !!referenceImage);
    console.log('Is revision:', isRevision);
    
    // Verify API key is present
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not defined in environment variables');
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    let response;
    
    if (referenceImage) {
      // If a reference image is provided, use the images.edit endpoint
      console.log('Using images.edit with reference image');
      
      // Convert the reference image to the proper format using toFile
      const bytes = await referenceImage.arrayBuffer();
      const imageFile = await toFile(
        new Uint8Array(bytes),
        referenceImage.name,
        { type: referenceImage.type }
      );
      
      // Use images.edit with ONLY model and prompt parameters as requested
      response = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: prompt
      });
    } else {
      // If no reference image, use images.generate with ONLY model and prompt
      console.log('Using images.generate (no reference image)');
      response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt
      });
    }

    // Extract image URL or base64 data
    let imageData;
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
    
    // Update the user's logo count in DynamoDB if this is not a revision
    if (!isRevision) {
      // Only increment count for original logos, not revisions
      await updateUserLogoCount(user.id);
    }
    
    // Return success with the image data
    // The client will handle saving to IndexedDB
    return NextResponse.json({
      success: true,
      message: 'Logo generated successfully',
      image: imageData,
      usage: {
        logosCreated: (user.logosCreated || 0) + (isRevision ? 0 : 1),
        logosLimit: user.logosLimit || 0,
        remainingLogos: Math.max(0, (user.logosLimit || 0) - ((user.logosCreated || 0) + (isRevision ? 0 : 1)))
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