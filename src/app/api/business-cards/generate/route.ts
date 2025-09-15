import { NextRequest, NextResponse } from 'next/server';
import { generateBusinessCardsPDF } from '@/lib/businessCardGenerator';
import { BusinessCardData } from '../../../../../types/businessCard';



// Only allow POST requests
export async function POST(request: NextRequest) {
    try {
        console.log('🔧 Business card API called');

        const body = await request.json();
        const { templateId, cardData, cardCount = 10 } = body;

        // 🔍 DEBUG: Log what we received
        console.log('📥 API received:', {
            templateId,
            cardCount,
            cardData: {
                companyName: cardData.companyName,
                name: cardData.name,
                title: cardData.title,
                logo: {
                    logoId: cardData.logo?.logoId,
                    hasDataUri: !!cardData.logo?.logoDataUri,
                    dataUriLength: cardData.logo?.logoDataUri?.length
                },
                phones: cardData.phones,
                emails: cardData.emails
            }
        });

        // Validate required parameters
        if (!templateId || !cardData) {
            return NextResponse.json(
                { error: 'Missing required parameters: templateId and cardData are required' },
                { status: 400 }
            );
        }

        console.log('✅ Generating business cards...');

        // Generate PDF
        const pdfBuffer = await generateBusinessCardsPDF(templateId, cardData, cardCount);

        console.log('✅ PDF generated successfully, size:', pdfBuffer.length);

        // Create filename
        const sanitizedCompanyName = cardData.companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const filename = `business-cards-${sanitizedCompanyName}-${Date.now()}.pdf`;

        // Return PDF
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('❌ Business card generation failed:', error);
        return NextResponse.json(
            {
                error: 'Business card generation failed',
                details: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST to generate business cards.' },
        { status: 405 }
    );
}