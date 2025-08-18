// src/app/logos/route.ts - MINIMAL UPDATE preserving all existing functionality
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import { supabaseAuth } from '../../lib/supabaseAuth';
import { getCurrentUser, AuthenticatedUser } from '../../lib/auth-utils';

// REMOVED: Duplicate AuthenticatedUser interface (using the one from auth-utils)

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
    const size = formData.get('size') as string || '1024x1024';
    const referenceImage = formData.get('referenceImage') as File | null;
    const isRevision = formData.get('isRevision') === 'true';
    const originalLogoId = formData.get('originalLogoId') ? parseInt(formData.get('originalLogoId') as string) : undefined;

    // NEW ADDITION - Check for bulk generation flag
    const isBulkGeneration = formData.get('isBulkGeneration') === 'true';

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

    // UPDATED - Use superuser status instead of hard-coded email
    // const isPrivilegedBulkGeneration = isBulkGeneration && user.isSuperUser; <== set to this if superuser bypasses logo credit limits for bulk generating
    const isPrivilegedBulkGeneration = false;

    // Check if user has remaining credits (only for new logos, not revisions, not privileged bulk generation)
    if (!isRevision && !isPrivilegedBulkGeneration && user.logosCreated >= user.logosLimit) {
      return NextResponse.json(
          { error: 'You have reached your logo generation limit. Please upgrade your plan or contact support.' },
          { status: 403 }
      );
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
        prompt: prompt,
        quality: "high"
      });
    } else {
      // If no reference image, use images.generate with ONLY model and prompt
      console.log('Using images.generate (no reference image)');
      response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: size as "1024x1024" | "1024x1536" | "1536x1024",
        quality: "high"
      });
    }

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    const imageData = response.data[0];
    const base64Image = imageData.b64_json;

    if (!base64Image) {
      throw new Error('No image data received');
    }

    // Update user's logo count in Supabase (only for new logos, not revisions, not privileged bulk generation)
    let finalLogosCreated = user.logosCreated;
    let finalLogosLimit = user.logosLimit;

    if (!isRevision && !isPrivilegedBulkGeneration) {
      // FIXED: Handle optional supabaseId properly
      const supabaseId = user.supabaseId;
      if (!supabaseId) {
        throw new Error('User Supabase ID not found');
      }

      const supabaseUpdatedUser = await supabaseAuth.updateLogoCount(supabaseId, 1);
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
          : 'Logo generated successfully',
      // UPDATED - Flag to indicate if this was a privileged generation
      isPrivilegedGeneration: isPrivilegedBulkGeneration
    });

  } catch (error: any) {
    console.error('Error generating logo:', error);

    return NextResponse.json(
        { error: error.message || 'Failed to generate logo' },
        { status: 500 }
    );
  }
}