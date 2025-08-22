// src/app/api/catalog/image/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabaseAuth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params as required by Next.js
        const { id } = await params;
        const logoId = id;
        
        if (!logoId) {
            return NextResponse.json(
                { error: 'Logo ID is required' },
                { status: 400 }
            );
        }
        
        // Fetch the specific logo image only - NO AUTH REQUIRED (public endpoint)
        const logoImage = await supabaseAuth.getCatalogLogoImage(logoId);
        
        // Return only the image data
        return NextResponse.json({
            id: logoImage.id,
            image_data_uri: logoImage.image_data_uri
        });
        
    } catch (error: any) {
        console.error('Error fetching logo image:', error);
        return NextResponse.json(
            { error: 'Failed to fetch image' },
            { status: 500 }
        );
    }
}