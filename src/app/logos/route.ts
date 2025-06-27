// src/app/logos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../lib/supabase';

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
    ) as { id: string, email: string };
    
    // Get or create user in Supabase
    const { data: user, error } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', decoded.id)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('user_credits')
        .insert({
          user_id: decoded.id,
          email: decoded.email,
          logos_created: 0,
          logos_limit: 10,
          subscription_type: 'premium'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
        return null;
      }
      
      return newUser;
    }
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Function to check revision count for a logo
async function getRevisionCount(userId: string, originalLogoId: number): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('logo_revisions')
      .select('id')
      .eq('user_id', userId)
      .eq('original_logo_id', originalLogoId);
    
    if (error) {
      console.error('Error checking revision count:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error checking revision count:', error);
    return 0;
  }
}

// Function to update user's logo count
async function updateUserLogoCount(userId: string, increment: number = 1) {
  try {
    // First get current count
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('user_credits')
      .select('logos_created')
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching user count:', fetchError);
      throw fetchError;
    }
    
    // Then update with incremented value
    const newCount = (currentUser.logos_created || 0) + increment;
    
    const { data, error } = await supabaseAdmin
      .from('user_credits')
      .update({ logos_created: newCount })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user logo count:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user logo count:', error);
    throw error;
  }
}

// Function to log logo generation
async function logLogoGeneration(userId: string, prompt: string, isRevision: boolean, originalLogoId?: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('logo_generations')
      .insert({
        user_id: userId,
        prompt: prompt,
        model_used: 'gpt-image-1',
        is_revision: isRevision,
        original_logo_id: originalLogoId,
        success: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging logo generation:', error);
    }
    
    return data;
  } catch (error) {
    console.error('Error logging logo generation:', error);
  }
}

// Function to log revision
async function logRevision(userId: string, originalLogoId: number, prompt: string) {
  try {
    const { error } = await supabaseAdmin
      .from('logo_revisions')
      .insert({
        original_logo_id: originalLogoId,
        user_id: userId,
        revision_prompt: prompt
      });
    
    if (error) {
      console.error('Error logging revision:', error);
    }
  } catch (error) {
    console.error('Error logging revision:', error);
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
        logosCreated: user.logos_created || 0,
        logosLimit: user.logos_limit || 10,
        remainingLogos: Math.max(0, (user.logos_limit || 10) - (user.logos_created || 0))
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
    if (!isRevision && user.logos_created >= user.logos_limit) {
      return NextResponse.json(
        { error: 'You have reached your logo generation limit.' },
        { status: 403 }
      );
    }

    // Check revision limit (max 3 revisions per logo)
    if (isRevision && originalLogoId) {
      const revisionCount = await getRevisionCount(user.user_id, originalLogoId);
      
      if (revisionCount >= 3) {
        return NextResponse.json(
          { error: 'You have reached the maximum of 3 revisions for this logo.' },
          { status: 403 }
        );
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
    
    // Log the generation and update credits
    const logoGeneration = await logLogoGeneration(user.user_id, prompt, isRevision, originalLogoId);
    
    // Update the user's logo count if this is not a revision
    if (!isRevision) {
      await updateUserLogoCount(user.user_id);
    }
    
    // Log revision if applicable
    if (isRevision && originalLogoId) {
      await logRevision(user.user_id, originalLogoId, prompt);
    }
    
    // Get updated user data
    const { data: updatedUser } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', user.user_id)
      .single();
    
    // Return success with the image data
    return NextResponse.json({
      success: true,
      message: 'Logo generated successfully',
      image: imageData,
      logoId: logoGeneration?.id,
      usage: {
        logosCreated: updatedUser?.logos_created || user.logos_created,
        logosLimit: updatedUser?.logos_limit || user.logos_limit,
        remainingLogos: Math.max(0, (updatedUser?.logos_limit || user.logos_limit) - (updatedUser?.logos_created || user.logos_created))
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