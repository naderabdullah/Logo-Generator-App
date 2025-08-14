// src/app/api/catalog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DynamoDB } from 'aws-sdk';
import { supabaseAuth } from '../../../lib/supabaseAuth';
import { getLogo } from '../../utils/indexedDBUtils';
import { getCurrentUser } from '../../../lib/auth-utils';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// GET endpoint - Get catalog logos
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (user === 'not_allowed') {
            return NextResponse.json({ error: 'Account not active' }, { status: 401 });
        }

        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const catalogCode = url.searchParams.get('code');
        const searchTerm = url.searchParams.get('search');
        const limit = url.searchParams.get('limit');
        const offset = url.searchParams.get('offset');

        switch (action) {
            case 'get_by_code':
                if (!catalogCode) {
                    return NextResponse.json(
                        { error: 'Catalog code is required' },
                        { status: 400 }
                    );
                }

                const catalogLogo = await supabaseAuth.getCatalogLogoByCode(catalogCode);
                return NextResponse.json({ catalogLogo });

            case 'search':
                if (!searchTerm) {
                    return NextResponse.json(
                        { error: 'Search term is required' },
                        { status: 400 }
                    );
                }

                const searchResults = await supabaseAuth.searchCatalogLogos(searchTerm);
                return NextResponse.json({ catalogLogos: searchResults });

            case 'stats':
                const stats = await supabaseAuth.getCatalogStats();
                return NextResponse.json({ stats });

            default:
                // Get all catalog logos with pagination
                const catalogLogos = await supabaseAuth.getCatalogLogos(
                    limit ? parseInt(limit) : undefined,
                    offset ? parseInt(offset) : undefined
                );
                return NextResponse.json({ catalogLogos });
        }
    } catch (error: any) {
        console.error('Error in catalog GET:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get catalog data' },
            { status: 500 }
        );
    }
}

// POST endpoint - Add logo to catalog
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (user === 'not_allowed') {
            return NextResponse.json({ error: 'Account not active' }, { status: 401 });
        }

        const { logoKeyId, imageDataUri, parameters, originalCompanyName } = await request.json();

        if (!logoKeyId || !imageDataUri || !parameters || !originalCompanyName) {
            return NextResponse.json(
                { error: 'Missing required fields: logoKeyId, imageDataUri, parameters, originalCompanyName' },
                { status: 400 }
            );
        }

        // Check if logo already exists in catalog
        const existingCatalogLogo = await supabaseAuth.checkLogoInCatalog(logoKeyId);
        if (existingCatalogLogo) {
            return NextResponse.json(
                {
                    error: 'Logo already in catalog',
                    catalogCode: existingCatalogLogo.catalog_code
                },
                { status: 409 }
            );
        }

        // Add to catalog
        const catalogLogo = await supabaseAuth.addToCatalog({
            logoKeyId,
            imageDataUri,
            parameters,
            originalCompanyName,
            createdBy: user.email
        });

        return NextResponse.json({
            message: 'Logo added to catalog successfully',
            catalogLogo
        });

    } catch (error: any) {
        console.error('Error adding to catalog:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add to catalog' },
            { status: 500 }
        );
    }
}

// PUT endpoint - Check if logo is in catalog
export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { logoKeyId } = await request.json();

        if (!logoKeyId) {
            return NextResponse.json(
                { error: 'logoKeyId is required' },
                { status: 400 }
            );
        }

        const catalogLogo = await supabaseAuth.checkLogoInCatalog(logoKeyId);

        return NextResponse.json({
            isInCatalog: !!catalogLogo,
            catalogLogo: catalogLogo || null
        });

    } catch (error: any) {
        console.error('Error checking catalog:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check catalog' },
            { status: 500 }
        );
    }
}