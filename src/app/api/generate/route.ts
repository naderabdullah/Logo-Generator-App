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
    
    // Verify API key is present
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
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
      response = await openai.images.generate({
        model: "gpt-image-1",
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