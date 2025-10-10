// FILE: src/lib/htmlBusinessCardToPDF.ts
// PURPOSE: Convert injected business card HTML to PDF with Avery 8371 formatting
// USES: html2canvas for HTML rendering, jsPDF for PDF generation

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { calculateAvery8371Positions, validateCardPosition } from './businessCardLayout';
import type { CardPosition } from '../../types/businessCard';

// Business card dimensions (Avery 8371 standard)
const CARD_WIDTH_MM = 88.9;   // 3.5 inches
const CARD_HEIGHT_MM = 50.8;  // 2 inches
const CARD_WIDTH_PX = 336;    // At 96 DPI (3.5" × 96)
const CARD_HEIGHT_PX = 192;   // At 96 DPI (2" × 96)

/**
 * Create a temporary DOM element for rendering business card HTML
 * @param htmlContent - Injected HTML content
 * @returns DOM element ready for html2canvas
 */
function createTemporaryCardElement(htmlContent: string): HTMLElement {
    try {
        console.log('📦 Creating temporary card element for rendering');

        // Create container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = `${CARD_WIDTH_PX}px`;
        container.style.height = `${CARD_HEIGHT_PX}px`;
        container.style.overflow = 'hidden';
        container.style.backgroundColor = '#ffffff';

        // Create card wrapper
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'business-card-preview'; // Use existing class for consistency
        cardWrapper.style.width = '100%';
        cardWrapper.style.height = '100%';
        cardWrapper.innerHTML = htmlContent;

        container.appendChild(cardWrapper);
        document.body.appendChild(container);

        console.log('✅ Temporary element created:', {
            width: container.offsetWidth,
            height: container.offsetHeight
        });

        return container;

    } catch (error) {
        console.error('❌ Failed to create temporary element:', error);
        throw new Error('Card element creation failed');
    }
}

/**
 * Convert HTML element to canvas using html2canvas
 * @param element - HTML element to capture
 * @returns Canvas with rendered card
 */
async function htmlToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    try {
        console.log('🖼️ Converting HTML to canvas with html2canvas');

        const canvas = await html2canvas(element, {
            scale: 3,              // High quality (3x for 300 DPI equivalent)
            useCORS: true,         // Allow cross-origin images (for logos)
            allowTaint: true,      // Allow tainted canvas
            backgroundColor: '#ffffff',
            logging: false,        // Disable html2canvas debug logs
            width: CARD_WIDTH_PX,
            height: CARD_HEIGHT_PX,
            windowWidth: CARD_WIDTH_PX,
            windowHeight: CARD_HEIGHT_PX
        });

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('html2canvas produced invalid canvas');
        }

        console.log('✅ Canvas created successfully:', {
            width: canvas.width,
            height: canvas.height,
            ratio: (canvas.width / canvas.height).toFixed(2)
        });

        return canvas;

    } catch (error) {
        console.error('❌ html2canvas conversion failed:', error);
        throw new Error('Canvas conversion failed');
    }
}

/**
 * Place card images on PDF using Avery 8371 positions
 * @param doc - jsPDF document
 * @param canvas - Canvas with card image
 * @param positions - Array of Avery 8371 positions
 */
function placeCardsOnPDF(
    doc: jsPDF,
    canvas: HTMLCanvasElement,
    positions: CardPosition[]
): void {
    try {
        console.log('📍 Placing cards on PDF using Avery 8371 positions');

        const imageData = canvas.toDataURL('image/png');

        positions.forEach((position, index) => {
            try {
                // Validate position
                if (!validateCardPosition(position)) {
                    console.warn(`⚠️ Skipping card ${position.cardNumber} - invalid position`);
                    return;
                }

                console.log(`📌 Placing card ${position.cardNumber}/10 at (${position.x.toFixed(1)}mm, ${position.y.toFixed(1)}mm)`);

                // Add image to PDF at specified position
                doc.addImage(
                    imageData,
                    'PNG',
                    position.x,
                    position.y,
                    CARD_WIDTH_MM,
                    CARD_HEIGHT_MM,
                    undefined,
                    'FAST' // Compression
                );

            } catch (cardError) {
                console.error(`❌ Failed to place card ${position.cardNumber}:`, cardError);
                // Continue with other cards
            }
        });

        console.log('✅ All cards placed successfully');

    } catch (error) {
        console.error('❌ Failed to place cards on PDF:', error);
        throw new Error('PDF card placement failed');
    }
}

/**
 * Generate business cards PDF from injected HTML
 * Main entry point for PDF generation
 *
 * @param htmlContent - Fully injected HTML with logo and contact info
 * @param cardCount - Number of cards to generate (default: 10, max per sheet: 10)
 * @returns PDF as data URI string
 */
export async function generateBusinessCardPDFFromHTML(
    htmlContent: string,
    cardCount: number = 10
): Promise<string> {

    let temporaryElement: HTMLElement | null = null;

    try {
        console.log('🎴 ========================================');
        console.log('🎴 Starting Business Card PDF Generation');
        console.log('🎴 ========================================');
        console.log('📊 Configuration:', {
            cardCount,
            cardSize: `${CARD_WIDTH_MM}mm × ${CARD_HEIGHT_MM}mm`,
            pageFormat: 'US Letter (8.5" × 11")',
            layout: 'Avery 8371 (2 cols × 5 rows)'
        });

        // Validate inputs
        if (!htmlContent || htmlContent.trim().length === 0) {
            throw new Error('No HTML content provided');
        }

        if (cardCount < 1 || cardCount > 10) {
            console.warn('⚠️ Card count adjusted to valid range (1-10)');
            cardCount = Math.max(1, Math.min(10, cardCount));
        }

        // Step 1: Create temporary DOM element
        console.log('📦 Step 1/4: Creating temporary DOM element');
        temporaryElement = createTemporaryCardElement(htmlContent);

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 2: Convert HTML to canvas
        console.log('🖼️ Step 2/4: Converting HTML to canvas image');
        const canvas = await htmlToCanvas(temporaryElement);

        // Step 3: Create PDF document
        console.log('📄 Step 3/4: Creating PDF document (US Letter)');
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [215.9, 279.4]  // US Letter: 8.5" × 11" in mm
        });

        // Step 4: Get positions and place cards
        console.log('📍 Step 4/4: Calculating positions and placing cards');
        const positions = calculateAvery8371Positions();

        // Only use the number of positions requested
        const limitedPositions = positions.slice(0, cardCount);
        console.log(`📋 Using ${limitedPositions.length} of ${positions.length} available positions`);

        placeCardsOnPDF(doc, canvas, limitedPositions);

        // Generate PDF data URI
        console.log('💾 Generating PDF data URI');
        const pdfDataUri = doc.output('dataurlstring');

        if (!pdfDataUri || !pdfDataUri.startsWith('data:application/pdf')) {
            throw new Error('Invalid PDF data URI generated');
        }

        const pdfSizeKB = Math.round(pdfDataUri.length / 1024);
        console.log('✅ ========================================');
        console.log('✅ PDF Generation Complete!');
        console.log('✅ ========================================');
        console.log('📊 Results:', {
            cardsGenerated: cardCount,
            fileSize: `${pdfSizeKB} KB`,
            dataUriLength: pdfDataUri.length
        });

        return pdfDataUri;

    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ PDF Generation Failed');
        console.error('❌ ========================================');
        console.error('❌ Error details:', error);
        throw error;

    } finally {
        // Cleanup: Remove temporary element
        if (temporaryElement && temporaryElement.parentNode) {
            try {
                temporaryElement.parentNode.removeChild(temporaryElement);
                console.log('🧹 Temporary element cleaned up');
            } catch (cleanupError) {
                console.warn('⚠️ Failed to cleanup temporary element:', cleanupError);
            }
        }
    }
}

/**
 * Generate preview for Step 3 (single card preview)
 * @param htmlContent - Injected HTML
 * @returns Data URI of single card preview
 */
export async function generateCardPreview(htmlContent: string): Promise<string> {
    let temporaryElement: HTMLElement | null = null;

    try {
        console.log('👁️ Generating single card preview');

        temporaryElement = createTemporaryCardElement(htmlContent);
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await htmlToCanvas(temporaryElement);
        const imageDataUri = canvas.toDataURL('image/png');

        console.log('✅ Preview generated successfully');
        return imageDataUri;

    } catch (error) {
        console.error('❌ Preview generation failed:', error);
        throw error;

    } finally {
        if (temporaryElement && temporaryElement.parentNode) {
            temporaryElement.parentNode.removeChild(temporaryElement);
        }
    }
}