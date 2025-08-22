// Updated verification API to return both email and handle
// Replace the entire contents of src/app/api/certificate/logo/verify/route.ts

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

        console.log('🔍 Verifying logo certificate with anti-tampering protection:', certificateId);

        // Use the secure verification function with checksum validation
        const verification = verifyLogoCertificateId(certificateId);

        if (!verification.isValid) {
            console.log('❌ Logo certificate verification failed:', verification.details);
            return NextResponse.json(
                { error: 'Certificate verification failed: ' + verification.details },
                { status: 404 }
            );
        }

        console.log('✅ Logo certificate verified successfully with cryptographic protection');

        // Return verified certificate data with both email and handle
        return NextResponse.json({
            certificateId,
            logoId: verification.logoId,
            clientEmail: verification.clientEmail, // ✅ Actual email (discovered or generic)
            clientHandle: verification.clientHandle, // ✅ Username/handle part
            issueDate: verification.issueDate,
            status: 'active',
            verified: true,
            verificationMethod: 'cryptographic_checksum',
            note: 'Certificate verified using cryptographic checksum validation. Same security level as reseller certificates.',
            details: verification.details,
            logoImageVerified: verification.logoImageVerified || false
        });

    } catch (error: any) {
        console.error('❌ Logo certificate verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}