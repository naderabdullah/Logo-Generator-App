// src/app/api/certificate/logo/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyLogoCertificateId } from '@/lib/certificateGenerator';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const certificateId = searchParams.get('id');

        if (!certificateId) {
            return NextResponse.json(
                { error: 'Certificate ID is required' },
                { status: 400 }
            );
        }

        console.log('🔍 Verifying logo certificate (stateless):', certificateId);

        // Stateless verification - all data extracted from certificate ID
        const verification = verifyLogoCertificateId(certificateId);

        if (!verification.isValid) {
            return NextResponse.json(
                { error: 'Certificate verification failed: ' + verification.details },
                { status: 404 }
            );
        }

        console.log('✅ Logo certificate ID structure is valid:', verification);

        // Return certificate details extracted from the ID itself
        return NextResponse.json({
            certificateId,
            logoId: verification.logoId,
            clientEmail: verification.clientEmail,
            issueDate: verification.issueDate,
            status: 'active',
            verified: true,
            verificationMethod: 'stateless_logo_certificate',
            note: 'Logo certificate verified using embedded cryptographic data. No database lookup required.'
        });

    } catch (error: any) {
        console.error('❌ Logo certificate verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}

// POST endpoint for enhanced verification with logo image
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { certificateId, logoImageBase64 } = body;

        if (!certificateId) {
            return NextResponse.json(
                { error: 'Certificate ID is required' },
                { status: 400 }
            );
        }

        console.log('🔍 Enhanced logo certificate verification for:', certificateId);

        // Convert logo image to buffer if provided
        let logoImageBuffer: Buffer | undefined;
        if (logoImageBase64) {
            logoImageBuffer = Buffer.from(logoImageBase64, 'base64');
        }

        // Verify with optional logo image verification
        const verification = verifyLogoCertificateId(certificateId, logoImageBuffer);

        if (!verification.isValid) {
            return NextResponse.json({
                success: false,
                message: 'Invalid logo certificate',
                certificateId
            });
        }

        return NextResponse.json({
            success: true,
            message: logoImageBuffer && verification.logoImageVerified
                ? 'Certificate and logo image fully verified'
                : 'Certificate structure verified',
            certificate: {
                certificateId,
                logoId: verification.logoId,
                clientEmail: verification.clientEmail,
                issueDate: verification.issueDate,
                status: 'active',
                logoImageVerified: verification.logoImageVerified || false,
                verificationMethod: 'enhanced_logo_certificate'
            }
        });

    } catch (error: any) {
        console.error('❌ Enhanced logo certificate verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}