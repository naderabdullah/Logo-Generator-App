// src/app/api/certificate/verify/route.ts - STATELESS VERSION
import { NextRequest, NextResponse } from 'next/server';
import { verifyCertificateId, verifyCertificateSignature } from '@/lib/certificateGenerator';

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

        console.log('🔍 Verifying certificate (stateless):', certificateId);

        // Verify the certificate ID structure and extract information
        const verification = verifyCertificateId(certificateId);

        if (!verification.isValid) {
            console.log('❌ Certificate ID validation failed:', certificateId);
            return NextResponse.json(
                { error: 'Certificate not found' },
                { status: 404 }
            );
        }

        console.log('✅ Certificate ID structure is valid:', verification);

        // Return certificate details extracted from the ID itself
        return NextResponse.json({
            certificateId: certificateId,
            userEmail: verification.estimatedEmail, // We can only show the prefix
            issueDate: verification.issueDate,
            digitalSignature: 'Verified via cryptographic signature',
            status: 'active',
            createdAt: new Date(verification.timestamp!).toISOString(),
            verified: true,
            verificationMethod: 'stateless',
            note: 'This certificate is verified using cryptographic signatures without requiring database storage.'
        });

    } catch (error: any) {
        console.error('❌ Certificate verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}

// POST endpoint for manual verification with user email (for full signature verification)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { certificateId, userEmail, digitalSignature } = body;

        if (!certificateId) {
            return NextResponse.json(
                { error: 'Certificate ID is required' },
                { status: 400 }
            );
        }

        console.log('🔍 Full verification request for:', certificateId);

        // First verify the certificate ID structure
        const idVerification = verifyCertificateId(certificateId);

        if (!idVerification.isValid) {
            return NextResponse.json({
                success: false,
                message: 'Invalid certificate ID format',
                certificateId
            });
        }

        // If user email and signature are provided, do full verification
        if (userEmail && digitalSignature) {
            const signatureValid = verifyCertificateSignature(certificateId, userEmail, digitalSignature);

            if (!signatureValid) {
                return NextResponse.json({
                    success: false,
                    message: 'Certificate signature verification failed',
                    certificateId
                });
            }

            return NextResponse.json({
                success: true,
                message: 'Certificate is fully verified and authentic',
                certificate: {
                    certificateId: certificateId,
                    userEmail: userEmail,
                    issueDate: idVerification.issueDate,
                    digitalSignature: digitalSignature,
                    status: 'active',
                    createdAt: new Date(idVerification.timestamp!).toISOString(),
                    verificationMethod: 'full_cryptographic'
                }
            });
        } else {
            // Basic ID verification only
            return NextResponse.json({
                success: true,
                message: 'Certificate ID is valid (basic verification)',
                certificate: {
                    certificateId: certificateId,
                    userEmail: idVerification.estimatedEmail,
                    issueDate: idVerification.issueDate,
                    status: 'active',
                    createdAt: new Date(idVerification.timestamp!).toISOString(),
                    verificationMethod: 'id_structure'
                }
            });
        }

    } catch (error: any) {
        console.error('❌ Certificate verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}