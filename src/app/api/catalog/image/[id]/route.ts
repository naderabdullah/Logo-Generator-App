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
        
        // Return the image data with 5-minute caching headers
        return NextResponse.json({
            id: logoImage.id,
            image_data_uri: logoImage.image_data_uri
        }, {
            headers: {
                // Cache for 5 minutes (300 seconds) on both browser and Vercel edge
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
                // Optional: Add ETag for better cache validation
                'ETag': `"logo-${logoImage.id}"`,
                // Set content type for better caching
                'Content-Type': 'application/json',
            }
        });
        
    } catch (error: any) {
        console.error('Error fetching logo image:', error);
        return NextResponse.json(
            { error: 'Failed to fetch image' },
            { 
                status: 500,
                headers: {
                    // Don't cache error responses
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            }
        );
    }
}