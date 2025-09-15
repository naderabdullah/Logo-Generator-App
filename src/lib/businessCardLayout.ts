import { CardPosition } from '../../types/businessCard';

/**
 * Calculate positions for Avery 8371 business cards
 * Layout: 2 columns × 5 rows = 10 cards on 8.5" × 11" paper
 * Card size: 2" × 3.5" (50.8mm × 88.9mm)
 */
export function calculateAvery8371Positions(): CardPosition[] {
    const CARD_WIDTH = 88.9;   // 3.5" in mm (horizontal)
    const CARD_HEIGHT = 50.8;  // 2" in mm (horizontal)

    // Avery 8371 specifications for horizontal cards
    const MARGIN_TOP = 12.7;     // 0.5" from top edge
    const MARGIN_LEFT = 6.35;    // 0.25" from left edge
    const GAP_X = 3.2;           // 0.125" horizontal gap
    const GAP_Y = 1.6;           // 0.0625" vertical gap

    const positions: CardPosition[] = [];

    // Generate positions: 2 columns × 5 rows = 10 cards
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 2; col++) {
            const cardNumber = row * 2 + col + 1;
            positions.push({
                x: MARGIN_LEFT + col * (CARD_WIDTH + GAP_X),
                y: MARGIN_TOP + row * (CARD_HEIGHT + GAP_Y),
                cardNumber
            });
        }
    }

    return positions;
}
/**
 * Validate if a position is within printable area
 */
export function validateCardPosition(position: CardPosition): boolean {
    const PAGE_WIDTH = 210;  // A4 width in mm
    const PAGE_HEIGHT = 297; // A4 height in mm
    const CARD_WIDTH = 88.9;  // Updated
    const CARD_HEIGHT = 50.8; // Updated

    return (
        position.x >= 0 &&
        position.y >= 0 &&
        position.x + CARD_WIDTH <= PAGE_WIDTH &&
        position.y + CARD_HEIGHT <= PAGE_HEIGHT
    );
}