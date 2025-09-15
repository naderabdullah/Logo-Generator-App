import jsPDF from 'jspdf';
import { BusinessCardRenderer } from './businessCardRenderer';
import { calculateAvery8371Positions, validateCardPosition } from './businessCardLayout';
import { getBusinessCardTemplate } from '@/data/businessCardTemplates';
import { BusinessCardData } from '../../types/businessCard';

/**
 * Generate business cards PDF with multiple cards per sheet
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

    // Validate card data
    if (!validateBusinessCardData(cardData)) {
        throw new Error('Invalid business card data provided');
    }

    try {
        // Create PDF document (A4, portrait)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Initialize renderer
        const renderer = new BusinessCardRenderer(doc);

        // Get Avery 8371 positions (10 cards per sheet)
        const positions = calculateAvery8371Positions();

        // Calculate number of sheets needed
        const cardsPerSheet = 10;
        const sheetsNeeded = Math.ceil(cardCount / cardsPerSheet);

        for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
            // Add new page for additional sheets
            if (sheet > 0) {
                doc.addPage();
            }

            // Render cards on current sheet
            const startCard = sheet * cardsPerSheet;
            const endCard = Math.min(startCard + cardsPerSheet, cardCount);

            for (let cardIndex = startCard; cardIndex < endCard; cardIndex++) {
                const positionIndex = cardIndex % cardsPerSheet;
                const position = positions[positionIndex];

                // Validate position is within printable area
                if (!validateCardPosition(position)) {
                    console.warn(`Skipping card ${cardIndex + 1} - position out of bounds`);
                    continue;
                }

                // Render the card
                await renderer.renderCard(
                    template.template,
                    cardData,
                    position.x,
                    position.y
                );
            }
        }

        // Convert to buffer and return
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Generated PDF buffer is empty');
        }

        return pdfBuffer;

    } catch (error) {
        console.error('Business card PDF generation failed:', error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validate business card data before processing
 */
function validateBusinessCardData(data: BusinessCardData): boolean {
    // Required fields
    if (!data.name || !data.companyName) {
        return false;
    }

    // Must have at least one contact method
    const hasPhone = data.phones.some(p => p.value);
    const hasEmail = data.emails.some(e => e.value);
    const hasWebsite = data.websites.some(w => w.value);

    if (!hasPhone && !hasEmail && !hasWebsite) {
        return false;
    }

    // Logo validation
    if (!data.logo.logoId && !data.logo.logoDataUri) {
        console.warn('No logo data provided for business card');
    }

    return true;
}

/**
 * Generate preview image for business card (for UI preview)
 */
export async function generateBusinessCardPreview(
    templateId: string,
    cardData: BusinessCardData,
    scale: number = 2
): Promise<string> {
    const template = getBusinessCardTemplate(templateId);
    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    // Create small PDF for preview
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [template.template.cardWidth * scale, template.template.cardHeight * scale]
    });

    const renderer = new BusinessCardRenderer(doc);
    await renderer.renderCard(template.template, cardData, 0, 0);

    // Return as data URI
    return doc.output('datauristring');
}