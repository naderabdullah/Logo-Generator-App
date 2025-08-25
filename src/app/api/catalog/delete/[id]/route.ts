// src/app/api/catalog/delete/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { requireSuperUser } from '@/lib/auth-utils';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require super user privileges
        const user = await requireSuperUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Super user privileges required.' },
                { status: 403 }
            );
        }

        // Await params as required by Next.js
        const { id } = await params;
        const logoId = id;
        
        if (!logoId) {
            return NextResponse.json(
                { error: 'Logo ID is required' },
                { status: 400 }
            );
        }

        console.log(`Super user ${user.email} attempting to delete catalog logo ${logoId}`);
        
        // Delete the catalog logo from Supabase
        const result = await supabaseAuth.deleteCatalogLogo(parseInt(logoId));
        
        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to delete logo from catalog' },
                { status: 500 }
            );
        }

        console.log(`Successfully deleted catalog logo ${logoId} by super user ${user.email}`);
        
        return NextResponse.json({
            success: true,
            message: 'Logo removed from catalog successfully',
            deletedLogoId: parseInt(logoId)
        });
        
    } catch (error: any) {
        console.error('Error deleting catalog logo:', error);
        return NextResponse.json(
            { error: 'Failed to delete logo from catalog' },
            { status: 500 }
        );
    }
}