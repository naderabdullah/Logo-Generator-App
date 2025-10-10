// FILE: src/lib/businessCardLayout.ts
// PURPOSE: Avery 8371 positioning calculations
// UPDATED: Adjusted top margin based on actual print test (moved up 1/8")

import { CardPosition } from '../../types/businessCard';

/**
 * Calculate positions for Avery 8371 business cards
 * Layout: 2 columns × 5 rows = 10 cards on US Letter (8.5" × 11") paper
 * Card size: 2" × 3.5" (50.8mm × 88.9mm)
 *
 * ADJUSTED SPECIFICATIONS (based on print test):
 * - Page: US Letter (8.5" × 11" = 215.9mm × 279.4mm)
 * - Cards: 2" × 3.5" (50.8mm × 88.9mm)
 * - Layout: 2 columns × 5 rows = 10 cards
 * - Top Margin: 0.375" (9.525mm) - ADJUSTED from 0.5" based on print test
 * - Left Margin: 0.5" (12.7mm)
 * - Gaps: 0.5" (12.7mm) horizontal, 0.0625" (1.6mm) vertical for perforations
 */
export function calculateAvery8371Positions(): CardPosition[] {
    // Card dimensions in mm
    const CARD_WIDTH = 88.9;   // 3.5" horizontal
    const CARD_HEIGHT = 50.8;  // 2" vertical

    // US Letter paper dimensions in mm
    const PAGE_WIDTH = 215.9;   // 8.5"
    const PAGE_HEIGHT = 279.4;  // 11"

    // Avery 8371 margins in mm - ADJUSTED based on print test
    const MARGIN_TOP = 9.525;   // 0.375" (3/8") - REDUCED by 1/8" from print test
    const MARGIN_LEFT = 12.5;   // 0.5" from left edge

    // Small gaps for perforation lines
    const GAP_X = 12.7;   // 0.5" horizontal gap between columns
    const GAP_Y = 1.6;    // 0.0625" vertical gap between rows (1/16")

    console.log('🏷️ Avery 8371 Layout Configuration (PRINT-TEST ADJUSTED):', {
        pageSize: `${PAGE_WIDTH}mm × ${PAGE_HEIGHT}mm`,
        cardSize: `${CARD_WIDTH}mm × ${CARD_HEIGHT}mm`,
        margins: `Top: ${MARGIN_TOP}mm (adjusted -1/8"), Left: ${MARGIN_LEFT}mm`,
        gaps: `X: ${GAP_X}mm, Y: ${GAP_Y}mm`,
        layout: '2 columns × 5 rows',
        adjustment: 'Top margin reduced by 3.175mm (1/8") based on print test'
    });

    const positions: CardPosition[] = [];

    // Generate positions: 2 columns × 5 rows = 10 cards
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 2; col++) {
            const cardNumber = row * 2 + col + 1;

            // const x = MARGIN_LEFT + col * (CARD_WIDTH + GAP_X);
            let x = MARGIN_LEFT + col * (CARD_WIDTH + GAP_X);

            if (col === 0) {
                x += 5.0; // ← Left column pushed LEFT
            } else {
                x -= 5.0; // ← Right column pushed RIGHT
            }
            const y = MARGIN_TOP + row * (CARD_HEIGHT + GAP_Y);

            positions.push({
                x,
                y,
                cardNumber
            });

            console.log(`📍 Card ${cardNumber}: (${x.toFixed(1)}, ${y.toFixed(1)}) Row ${row + 1}, Col ${col + 1}`);
        }
    }

    // Validate all positions
    const invalidPositions = positions.filter(pos => !validateCardPosition(pos));
    if (invalidPositions.length > 0) {
        console.warn('⚠️ Invalid positions found:', invalidPositions);
    } else {
        console.log('✅ All card positions validated successfully');
    }

    return positions;
}

/**
 * Validate if a position is within printable area for US Letter
 */
export function validateCardPosition(position: CardPosition): boolean {
    // US Letter dimensions in mm
    const PAGE_WIDTH = 215.9;   // 8.5"
    const PAGE_HEIGHT = 279.4;  // 11"
    const CARD_WIDTH = 88.9;    // 3.5"
    const CARD_HEIGHT = 50.8;   // 2"

    const isValid = (
        position.x >= 0 &&
        position.y >= 0 &&
        position.x + CARD_WIDTH <= PAGE_WIDTH &&
        position.y + CARD_HEIGHT <= PAGE_HEIGHT
    );

    if (!isValid) {
        console.warn(`❌ Card ${position.cardNumber} position invalid:`, {
            position: `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
            cardEndPosition: `(${(position.x + CARD_WIDTH).toFixed(1)}, ${(position.y + CARD_HEIGHT).toFixed(1)})`,
            pageSize: `${PAGE_WIDTH} × ${PAGE_HEIGHT}`,
            exceedsRight: position.x + CARD_WIDTH > PAGE_WIDTH,
            exceedsBottom: position.y + CARD_HEIGHT > PAGE_HEIGHT
        });
    }

    return isValid;
}