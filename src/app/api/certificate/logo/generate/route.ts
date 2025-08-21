// src/app/api/certificate/logo/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateLogoCertificateId, generateLogoCertificate } from '@/lib/certificateGenerator';

export async function POST(request: NextRequest) {
    try {
        console.log('📄 Logo certificate generation request received');

        // Parse the request body
        const body = await request.json();
        const { clientEmail, logoId, logoImageBase64 } = body;

        if (!clientEmail || !logoId || !logoImageBase64) {
            return NextResponse.json(
                { error: 'Missing required fields: clientEmail, logoId, and logoImageBase64 are required' },
                { status: 400 }
            );
        }

        console.log('✅ Generating logo certificate for:', {
            clientEmail: clientEmail.substring(0, 3) + '...',
            logoId,
            imageDataLength: logoImageBase64.length
        });

        // Convert base64 to buffer
        const logoImageBuffer = Buffer.from(logoImageBase64, 'base64');

        // Generate certificate ID with all verification data embedded
        const certificateId = generateLogoCertificateId(clientEmail, logoId, logoImageBuffer);

        const certificateData = {
            clientEmail,
            resellerEmail: 'SMARTY LOGOS™ PLATFORM', // You can make this dynamic if needed
            logoId,
            certificateId,
            logoImageBuffer,
            issueDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        console.log('📝 Logo certificate data prepared:', {
            clientEmail: certificateData.clientEmail,
            logoId: certificateData.logoId,
            certificateId: certificateData.certificateId,
            issueDate: certificateData.issueDate
        });

        // Generate the PDF (stateless - no database storage!)
        console.log('📄 Generating logo certificate PDF...');
        const pdfBuffer = await generateLogoCertificate(certificateData);

        console.log('✅ Logo certificate PDF generated successfully, size:', pdfBuffer.length);

        // Return the PDF as a downloadable file
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="logo-certificate-${logoId}-${Date.now()}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
        });

    } catch (error: any) {
        console.error('❌ Logo certificate generation failed:', error);

        return NextResponse.json(
            {
                error: 'Certificate generation failed',
                details: error.message || 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}