// src/app/api/catalog/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth, CatalogLogo } from '@/lib/supabaseAuth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '30');
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;
        
        // Fetch paginated catalog logos metadata (fast, no images)
        const { logos, total } = await supabaseAuth.getCatalogLogosMetadata(offset, limit, search);
        
        // Calculate stats only on first page
        let stats = null;
        if (page === 1) {
            stats = await supabaseAuth.getCatalogLogosStats();
        }
        
        return NextResponse.json({
            logos: logos,
            stats: stats,
            pagination: {
                page,
                limit,
                total: total,
                totalPages: Math.ceil(total / limit),
                hasMore: offset + logos.length < total
            }
        });
        
    } catch (error: any) {
        console.error('Error fetching public catalog:', error);
        return NextResponse.json(
            { error: 'Failed to fetch catalog' },
            { status: 500 }
        );
    }
}