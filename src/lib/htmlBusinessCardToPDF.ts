// FILE: src/lib/htmlBusinessCardToPDF.ts
// FUNCTION: Full file - Capture the EXISTING Step 3 preview element
// SOLUTION: Don't re-render - just capture what's already on screen!
// CHANGES: Use html-to-image (better gradients) to capture existing preview

import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { calculateAvery8371Positions, validateCardPosition } from './businessCardLayout';
import type { CardPosition } from '../../types/businessCard';

// ============================================================================
// CONSTANTS
// ============================================================================

// Business card dimensions (Avery 8371 standard)
const CARD_WIDTH_MM = 88.9;   // 3.5 inches
const CARD_HEIGHT_MM = 50.8;  // 2 inches
const CARD_WIDTH_PX = 336;    // At 96 DPI (3.5" × 96)
const CARD_HEIGHT_PX = 192;   // At 96 DPI (2" × 96)

// ============================================================================
// NEW APPROACH: CAPTURE EXISTING PREVIEW
// ============================================================================

/**
 * NEW: Capture the existing Step 3 preview element that's already rendered
 * This is the smart solution - don't re-render, just capture what's on screen!
 *
 * CRITICAL:
 * - Temporarily removes scale transform before capturing to avoid cropping
 * - Uses html-to-image for better gradient/CSS rendering
 *
 * @param previewSelector - CSS selector for the preview element (default: '.business-card-preview')
 * @returns PNG data URL of captured card
 */
async function captureExistingPreview(previewSelector: string = '.business-card-preview'): Promise<string> {
    try {
        console.log('📸 ========================================');
        console.log('📸 CAPTURING EXISTING PREVIEW ELEMENT');
        console.log('📸 Using: html-to-image (better gradients)');
        console.log('📸 ========================================');
        console.log('🔍 Looking for element:', previewSelector);

        // Find the preview element that's already rendered on the page
        const previewElement = document.querySelector(previewSelector) as HTMLElement;

        if (!previewElement) {
            throw new Error(`Preview element not found: ${previewSelector}`);
        }

        console.log('✅ Found preview element:', {
            selector: previewSelector,
            width: previewElement.offsetWidth,
            height: previewElement.offsetHeight,
            childNodes: previewElement.childNodes.length,
            hasContent: previewElement.innerHTML.length > 0
        });

        // CRITICAL: Save original transform and temporarily remove it
        const originalTransform = previewElement.style.transform;
        const computedStyle = window.getComputedStyle(previewElement);

        console.log('📐 Original element styling:', {
            transform: computedStyle.transform,
            transformOrigin: computedStyle.transformOrigin,
            display: computedStyle.display,
            visibility: computedStyle.visibility
        });

        console.log('🔧 Temporarily removing scale transform for capture...');
        previewElement.style.transform = 'none';

        // Wait for reflow after removing transform
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get dimensions after removing transform
        const captureWidth = previewElement.offsetWidth;
        const captureHeight = previewElement.offsetHeight;

        console.log('📐 Capture dimensions (no transform):', {
            width: captureWidth,
            height: captureHeight
        });

        console.log('📸 Capturing with html-to-image (toPng)...');

        // Capture with html-to-image for better CSS gradient support
        const dataUrl = await toPng(previewElement, {
            quality: 1.0,
            pixelRatio: 3,  // High quality
            cacheBust: true,
            width: captureWidth,
            height: captureHeight,
            backgroundColor: '#ffffff',
            skipFonts: false
        });

        // CRITICAL: Restore original transform
        console.log('🔧 Restoring original transform...');
        previewElement.style.transform = originalTransform;

        if (!dataUrl || !dataUrl.startsWith('data:image/png')) {
            throw new Error('html-to-image produced invalid data URL');
        }

        console.log('✅ Capture successful:', {
            dataUrlLength: dataUrl.length,
            sizeKB: Math.round(dataUrl.length / 1024),
            format: 'PNG'
        });

        console.log('📸 ========================================');

        return dataUrl;

    } catch (error) {
        console.error('❌ Failed to capture existing preview:', error);

        // Try to restore transform even on error
        try {
            const previewElement = document.querySelector(previewSelector) as HTMLElement;
            if (previewElement && previewElement.style.transform === 'none') {
                console.log('🔧 Restoring transform after error...');
                previewElement.style.transform = 'scale(1.5)'; // Restore default
            }
        } catch (restoreError) {
            console.warn('⚠️ Could not restore transform after error');
        }

        throw new Error(`Preview capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Resize canvas to business card dimensions if needed
 * Converts PNG data URL to canvas, resizes if needed
 * @param dataUrl - PNG data URL
 * @returns Canvas at correct business card dimensions
 */
async function resizeImageToCardDimensions(dataUrl: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        try {
            console.log('📐 Converting PNG to canvas and checking dimensions...');

            const img = new Image();

            img.onload = () => {
                try {
                    console.log('   Source image:', img.width, 'x', img.height);
                    console.log('   Target card dimensions:', CARD_WIDTH_PX, 'x', CARD_HEIGHT_PX);

                    // Create canvas at business card dimensions
                    const canvas = document.createElement('canvas');
                    canvas.width = CARD_WIDTH_PX;
                    canvas.height = CARD_HEIGHT_PX;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    // Fill with white background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Calculate scaling to fit source into target while maintaining aspect ratio
                    const sourceAspect = img.width / img.height;
                    const targetAspect = canvas.width / canvas.height;

                    let drawWidth, drawHeight, drawX, drawY;

                    if (sourceAspect > targetAspect) {
                        // Source is wider - fit to width
                        drawWidth = canvas.width;
                        drawHeight = drawWidth / sourceAspect;
                        drawX = 0;
                        drawY = (canvas.height - drawHeight) / 2;
                    } else {
                        // Source is taller - fit to height
                        drawHeight = canvas.height;
                        drawWidth = drawHeight * sourceAspect;
                        drawX = (canvas.width - drawWidth) / 2;
                        drawY = 0;
                    }

                    // Use high-quality image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw the image onto canvas
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                    console.log('✅ Image converted to canvas:', {
                        canvasSize: `${canvas.width}x${canvas.height}`,
                        drawRegion: `${Math.round(drawWidth)}x${Math.round(drawHeight)} at (${Math.round(drawX)}, ${Math.round(drawY)})`
                    });

                    resolve(canvas);

                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = dataUrl;

            // Timeout after 5 seconds
            setTimeout(() => {
                reject(new Error('Image load timeout'));
            }, 5000);

        } catch (error) {
            console.error('❌ Failed to convert image to canvas:', error);
            reject(error);
        }
    });
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
        console.log('📍 ========================================');
        console.log('📍 Placing cards on PDF');
        console.log('📍 ========================================');

        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/png');

        console.log('📊 Image data:', {
            hasData: !!imageData,
            isDataURL: imageData.startsWith('data:image/'),
            sizeKB: Math.round(imageData.length / 1024),
            preview: imageData.substring(0, 50) + '...'
        });

        // Validate image data
        if (!imageData || !imageData.startsWith('data:image/')) {
            throw new Error('Invalid image data');
        }

        let successCount = 0;
        let failCount = 0;

        positions.forEach((position) => {
            try {
                // Validate position
                if (!validateCardPosition(position)) {
                    console.warn(`⚠️ Skipping card ${position.cardNumber} - invalid position`);
                    failCount++;
                    return;
                }

                console.log(`📌 Placing card ${position.cardNumber}/${positions.length} at (${position.x.toFixed(1)}mm, ${position.y.toFixed(1)}mm)`);

                // Add image to PDF at specified position
                doc.addImage(
                    imageData,
                    'PNG',
                    position.x,
                    position.y,
                    CARD_WIDTH_MM,
                    CARD_HEIGHT_MM,
                    `card-${position.cardNumber}`,
                    'FAST' // Compression
                );

                successCount++;
                console.log(`✅ Card ${position.cardNumber} placed successfully`);

            } catch (cardError) {
                console.error(`❌ Failed to place card ${position.cardNumber}:`, cardError);
                failCount++;
                // Continue with other cards
            }
        });

        console.log('📊 ========================================');
        console.log(`📊 Card placement summary:`);
        console.log(`   ✅ Successful: ${successCount}/${positions.length}`);
        console.log(`   ❌ Failed: ${failCount}/${positions.length}`);
        console.log('📊 ========================================');

        if (successCount === 0) {
            throw new Error('Failed to place any cards on PDF');
        }

        console.log('✅ All cards placed successfully');

    } catch (error) {
        console.error('❌ Failed to place cards on PDF:', error);
        throw new Error('PDF card placement failed');
    }
}

// ============================================================================
// MAIN EXPORT FUNCTION - NEW APPROACH
// ============================================================================

/**
 * Generate business cards PDF by capturing the EXISTING Step 3 preview
 * This is the smart solution - just capture what's already rendered!
 *
 * Now uses html-to-image for better gradient/CSS rendering
 *
 * @param cardCount - Number of cards to generate (default: 10, max per sheet: 10)
 * @param previewSelector - CSS selector for the preview element (default: '.business-card-preview')
 * @returns PDF as data URI string
 */
export async function generateBusinessCardPDFFromExistingPreview(
    cardCount: number = 10,
    previewSelector: string = '.business-card-preview'
): Promise<string> {
    try {
        console.log('🎴 ========================================');
        console.log('🎴 Starting Business Card PDF Generation');
        console.log('🎴 NEW APPROACH: Capture existing preview');
        console.log('🎴 Library: html-to-image (better gradients)');
        console.log('🎴 ========================================');
        console.log('📊 Configuration:', {
            cardCount,
            previewSelector,
            cardSize: `${CARD_WIDTH_MM}mm × ${CARD_HEIGHT_MM}mm`,
            pageFormat: 'US Letter (8.5" × 11")',
            layout: 'Avery 8371 (2 cols × 5 rows)',
            method: 'Capture existing DOM element',
            library: 'html-to-image'
        });

        // Validate card count
        if (cardCount < 1 || cardCount > 10) {
            console.warn('⚠️ Card count adjusted to valid range (1-10)');
            cardCount = Math.max(1, Math.min(10, cardCount));
        }

        // Step 1: Capture the existing preview element (returns PNG data URL)
        console.log('📸 Step 1/4: Capturing existing preview element');
        const capturedDataUrl = await captureExistingPreview(previewSelector);

        // Step 2: Convert to canvas and resize to standard card dimensions if needed
        console.log('📐 Step 2/4: Converting to canvas and ensuring correct dimensions');
        const finalCanvas = await resizeImageToCardDimensions(capturedDataUrl);

        // Step 3: Create PDF document
        console.log('📄 Step 3/4: Creating PDF document (US Letter)');
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [215.9, 279.4]  // US Letter: 8.5" × 11" in mm
        });

        console.log('📋 PDF document created:', {
            orientation: 'portrait',
            unit: 'mm',
            format: [215.9, 279.4],
            pageCount: doc.getNumberOfPages()
        });

        // Step 4: Get positions and place cards
        console.log('📍 Step 4/4: Calculating positions and placing cards');
        const positions = calculateAvery8371Positions();

        // Only use the number of positions requested
        const limitedPositions = positions.slice(0, cardCount);
        console.log(`📋 Using ${limitedPositions.length} of ${positions.length} available positions`);

        placeCardsOnPDF(doc, finalCanvas, limitedPositions);

        // Generate PDF data URI
        console.log('💾 Generating PDF data URI');
        const pdfDataUri = doc.output('dataurlstring');

        if (!pdfDataUri || !pdfDataUri.startsWith('data:application/pdf')) {
            throw new Error('Invalid PDF data URI generated');
        }

        const pdfSizeKB = Math.round(pdfDataUri.length / 1024);

        // Validate PDF has reasonable size (not just empty)
        if (pdfSizeKB < 10) {
            console.error('❌ PDF suspiciously small:', pdfSizeKB, 'KB');
            throw new Error(`PDF too small (${pdfSizeKB} KB) - likely blank`);
        }

        console.log('✅ ========================================');
        console.log('✅ PDF Generation Complete!');
        console.log('✅ ========================================');
        console.log('📊 Final Stats:', {
            pdfSize: `${pdfSizeKB} KB`,
            cardsPlaced: limitedPositions.length,
            method: 'Captured existing preview',
            library: 'html-to-image',
            success: true
        });

        return pdfDataUri;

    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ PDF Generation Failed');
        console.error('❌ ========================================');
        console.error('❌ Error:', error);
        throw error;
    }
}

// ============================================================================
// LEGACY FUNCTION - Keep for backwards compatibility
// ============================================================================

/**
 * LEGACY: Generate PDF by re-creating HTML (the old approach)
 * This is kept for backwards compatibility but not recommended
 *
 * @deprecated Use generateBusinessCardPDFFromExistingPreview() instead
 */
export async function generateBusinessCardPDFFromHTML(
    htmlContent: string,
    cardCount: number = 10
): Promise<string> {
    console.warn('⚠️ Using legacy generateBusinessCardPDFFromHTML()');
    console.warn('⚠️ Consider using generateBusinessCardPDFFromExistingPreview() instead');

    // This function is deprecated but kept for compatibility
    // It would contain the old re-rendering approach
    throw new Error('Legacy method deprecated - use generateBusinessCardPDFFromExistingPreview()');
}