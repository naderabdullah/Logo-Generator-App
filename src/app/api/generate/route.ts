// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const referenceImage = formData.get('referenceImage') as File | null;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Generating image with prompt:', prompt);
    console.log('Reference image provided:', !!referenceImage);
    
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
        model: "dall-e-2",
        image: imageFile,
        prompt: prompt
      });
    } else {
      // If no reference image, use images.generate with ONLY model and prompt
      console.log('Using images.generate (no reference image)');
      response = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt
      });
    }

    // Return the response
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating image:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate image', 
        details: error.message
      },
      { status: 500 }
    );
  }
}