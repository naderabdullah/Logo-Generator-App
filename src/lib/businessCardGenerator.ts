// FILE: src/lib/businessCardGenerator.ts
// ACTION: FULL FILE REPLACEMENT
// PURPOSE: Update to use US Letter format instead of A4 for Avery 8371 compatibility

import jsPDF from 'jspdf';
import { BusinessCardRenderer } from './businessCardRenderer';
import { calculateAvery8371Positions, validateCardPosition } from './businessCardLayout';
import { getBusinessCardTemplate } from '@/data/businessCardTemplates';
import { BusinessCardData } from '../../types/businessCard';

/**
 * Generate business cards PDF with multiple cards per sheet
 * FIXED: Now uses US Letter format for Avery 8371 compatibility
 */
export async function generateBusinessCardsPDF(
    templateId: string,
    cardData: BusinessCardData,
    cardCount: number = 10
): Promise<Buffer> {

    // Validate template exists
    const template = getBusinessCardTemplate(templateId);
    if (!template) {
        throw new Error(`Business card template not found: ${templateId}`);
    }

    // Validate card data is present
    if (!cardData) {
        throw new Error('No business card data provided');
    }

    try {
        console.log('🎴 Starting business card PDF generation:', {
            templateId,
            cardCount,
            format: 'US Letter (8.5" × 11")'
        });

        // Create PDF document - FIXED: Use US Letter instead of A4
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [215.9, 279.4]  // US Letter: 8.5" × 11" in mm
        });

        // Initialize renderer
        const renderer = new BusinessCardRenderer(doc);

        // Get Avery 8371 positions (10 cards per sheet)
        const positions = calculateAvery8371Positions();
        console.log(`📋 Generated ${positions.length} card positions`);

        // Calculate number of sheets needed
        const cardsPerSheet = 10;
        const sheetsNeeded = Math.ceil(cardCount / cardsPerSheet);
        console.log(`📄 Will generate ${sheetsNeeded} sheet(s) for ${cardCount} cards`);

        for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
            // Add new page for additional sheets
            if (sheet > 0) {
                doc.addPage();
                console.log(`📄 Added page ${sheet + 1}`);
            }

            // Render cards on current sheet
            const startCard = sheet * cardsPerSheet;
            const endCard = Math.min(startCard + cardsPerSheet, cardCount);
            console.log(`🎴 Rendering cards ${startCard + 1}-${endCard} on sheet ${sheet + 1}`);

            for (let cardIndex = startCard; cardIndex < endCard; cardIndex++) {
                const positionIndex = cardIndex % cardsPerSheet;
                const position = positions[positionIndex];

                console.log(`🎯 Positioning card ${cardIndex + 1} at (${position.x}, ${position.y})`);

                // Validate position is within printable area
                if (!validateCardPosition(position)) {
                    console.warn(`⚠️ Skipping card ${cardIndex + 1} - position out of bounds`);
                    continue;
                }

                // Render the card
                try {
                    await renderer.renderCard(
                        template.template,
                        cardData,
                        position.x,
                        position.y
                    );
                    console.log(`✅ Card ${cardIndex + 1} rendered successfully`);
                } catch (cardError) {
                    console.error(`❌ Failed to render card ${cardIndex + 1}:`, cardError);
                    // Continue with other cards instead of failing completely
                }
            }

            console.log(`✅ Sheet ${sheet + 1} completed`);
        }

        // Convert to buffer and return
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Generated PDF buffer is empty');
        }

        console.log(`✅ PDF generation completed. Buffer size: ${pdfBuffer.length} bytes`);
        return pdfBuffer;

    } catch (error) {
        console.error('❌ Business card PDF generation failed:', error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validate business card data
 */
function validateBusinessCardData(cardData: BusinessCardData): boolean {
    // Basic validation - ensure required fields exist
    if (!cardData) {
        console.error('❌ No card data provided');
        return false;
    }

    // Check for essential info - correct data structure
    if (!cardData.companyName?.trim() && !cardData.name?.trim()) {
        console.warn('⚠️ No company name or name provided - card may be blank');
    }

    // Check for logo data
    if (!cardData.logo?.logoId && !cardData.logo?.logoDataUri) {
        console.warn('⚠️ No logo data provided for business card');
    }

    return true;
}
/**
 * Debug function to test positioning without generating full PDF
 */
export function debugAvery8371Positioning(): void {
    console.log('🔍 Debug: Avery 8371 Positioning Test');

    const positions = calculateAvery8371Positions();

    console.table(positions.map(pos => ({
        'Card #': pos.cardNumber,
        'X (mm)': pos.x.toFixed(1),
        'Y (mm)': pos.y.toFixed(1),
        'X (in)': (pos.x / 25.4).toFixed(2),
        'Y (in)': (pos.y / 25.4).toFixed(2),
        'Row': Math.floor((pos.cardNumber - 1) / 2) + 1,
        'Col': ((pos.cardNumber - 1) % 2) + 1,
        'Valid': validateCardPosition(pos) ? '✅' : '❌'
    })));

    // Check total layout dimensions
    const maxX = Math.max(...positions.map(p => p.x + 88.9)); // card width
    const maxY = Math.max(...positions.map(p => p.y + 50.8)); // card height

    console.log('\n📐 Layout Validation:');
    console.log(`Page size: 215.9mm × 279.4mm (US Letter)`);
    console.log(`Used area: ${maxX.toFixed(1)}mm × ${maxY.toFixed(1)}mm`);
    console.log(`Margins: Right: ${(215.9 - maxX).toFixed(1)}mm, Bottom: ${(279.4 - maxY).toFixed(1)}mm`);
    console.log(`Layout: 0.5" margins with perforation gaps`);
    console.log(`All positions valid: ${positions.every(validateCardPosition) ? '✅' : '❌'}`);
}

export async function generateBusinessCardPreview(
    templateId: string,
    cardData: BusinessCardData,
    scale: number = 2
): Promise<string> {
    console.log('🎨 Generating business card preview:', { templateId, scale });

    const template = getBusinessCardTemplate(templateId);
    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    try {
        // Create small PDF for preview - use landscape for business cards
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [template.template.cardWidth * scale, template.template.cardHeight * scale]
        });

        const renderer = new BusinessCardRenderer(doc);
        await renderer.renderCard(template.template, cardData, 0, 0);

        // Return as data URI
        const dataUri = doc.output('datauristring');
        console.log('✅ Preview generated successfully');
        return dataUri;

    } catch (error) {
        console.error('❌ Preview generation failed:', error);
        throw new Error(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}