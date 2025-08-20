// src/app/api/certificate/generate/route.ts - STATELESS VERSION
import { NextRequest, NextResponse } from 'next/server';
import { generateOwnershipCertificate, generateCertificateId, generateDigitalSignature } from '@/lib/certificateGenerator';

export async function POST(request: NextRequest) {
    try {
        console.log('📄 Certificate generation request received');

        // Parse the request body
        const body = await request.json();
        const { userEmail } = body;

        if (!userEmail) {
            return NextResponse.json(
                { error: 'User email is required' },
                { status: 400 }
            );
        }

        console.log('✅ Generating stateless certificate for:', userEmail);

        // Generate certificate data with enhanced ID that includes user info
        const certificateId = generateCertificateId(userEmail);
        const issueDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const certificateData = {
            userEmail,
            issueDate,
            certificateId,
            digitalSignature: '' // Will be set after generation
        };

        // Generate digital signature
        certificateData.digitalSignature = generateDigitalSignature(certificateData);

        console.log('📝 Stateless certificate data prepared:', {
            userEmail: certificateData.userEmail,
            issueDate: certificateData.issueDate,
            certificateId: certificateData.certificateId,
            signatureLength: certificateData.digitalSignature.length
        });

        // Generate the PDF (no database storage needed!)
        console.log('📄 Generating PDF certificate...');
        const pdfBuffer = await generateOwnershipCertificate(certificateData);

        console.log('✅ PDF generated successfully, size:', pdfBuffer.length);

        // Return the PDF as a downloadable file
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ownership-certificate-${userEmail.split('@')[0]}-${new Date().getFullYear()}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
        });

    } catch (error: any) {
        console.error('❌ Certificate generation failed:', error);

        return NextResponse.json(
            {
                error: 'Certificate generation failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}