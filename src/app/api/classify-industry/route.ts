// src/app/api/classify-industry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

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
                { error: 'OpenAI API key is not configured' },
                { status: 500 }
            );
        }

        // Initialize the OpenAI client
        const openai = new OpenAI({
            apiKey: apiKey,
        });

        // Make the API call for text completion
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Fast and cost-effective for classification
            messages: [
                {
                    role: "system",
                    content: "You are a business industry classifier. You must return ONLY the exact industry name from the provided list, nothing else. No explanations, no additional text."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 50, // We only need a short response
            temperature: 0.1, // Low temperature for consistent classification
        });

        const industry = response.choices[0]?.message?.content?.trim();

        if (!industry) {
            throw new Error('No classification received from OpenAI');
        }

        return NextResponse.json({
            industry: industry,
            success: true
        });

    } catch (error: any) {
        console.error('Error in industry classification API:', error);

        return NextResponse.json(
            {
                error: 'Failed to classify industry',
                details: error.message
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'Industry Classification API. Use POST to classify industries.' },
        { status: 200 }
    );
}