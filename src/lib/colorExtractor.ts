// ===== NEW FILE: /lib/colorExtractor.ts =====

export interface ColorPalette {
    dominant: string;      // Most prominent color
    secondary: string;     // Second most prominent
    accent: string;        // Accent/highlight color
    neutral: string;       // Neutral/background color
    text: string;          // Recommended text color (high contrast)
    all: string[];         // All extracted colors
}

export interface ColorInfo {
    hex: string;
    rgb: { r: number; g: number; b: number };
    count: number;
    luminance: number;
}

/**
 * Extract color palette from logo image data URI
 */
export async function extractLogoColors(imageDataUri: string): Promise<ColorPalette> {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    // Set canvas size - sample at lower resolution for performance
                    const maxSize = 100;
                    const scale = Math.min(maxSize / img.width, maxSize / img.height);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;

                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const colors = extractColorsFromImageData(imageData);

                    // Build palette
                    const palette = buildColorPalette(colors);
                    resolve(palette);

                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = imageDataUri;

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Extract colors from image data using pixel sampling and clustering
 */
function extractColorsFromImageData(imageData: ImageData): ColorInfo[] {
    const data = imageData.data;
    const colorMap = new Map<string, ColorInfo>();
    const skipPixels = 4; // Sample every 4th pixel for performance

    for (let i = 0; i < data.length; i += 4 * skipPixels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent/semi-transparent pixels
        if (a < 128) continue;

        // Skip near-white pixels (likely background)
        if (r > 240 && g > 240 && b > 240) continue;

        // Quantize colors to reduce noise (round to nearest 16)
        const quantizedR = Math.round(r / 16) * 16;
        const quantizedG = Math.round(g / 16) * 16;
        const quantizedB = Math.round(b / 16) * 16;

        const hex = rgbToHex(quantizedR, quantizedG, quantizedB);
        const luminance = calculateLuminance(quantizedR, quantizedG, quantizedB);

        if (colorMap.has(hex)) {
            colorMap.get(hex)!.count++;
        } else {
            colorMap.set(hex, {
                hex,
                rgb: { r: quantizedR, g: quantizedG, b: quantizedB },
                count: 1,
                luminance
            });
        }
    }

    // Sort by frequency and return top colors
    return Array.from(colorMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 colors
}

/**
 * Build a coherent color palette from extracted colors
 */
function buildColorPalette(colors: ColorInfo[]): ColorPalette {
    if (colors.length === 0) {
        // Fallback palette
        return {
            dominant: '#333333',
            secondary: '#666666',
            accent: '#0066CC',
            neutral: '#F5F5F5',
            text: '#000000',
            all: ['#333333', '#666666', '#0066CC', '#F5F5F5']
        };
    }

    // Sort by different criteria for different roles
    const byFrequency = [...colors].sort((a, b) => b.count - a.count);
    const byLuminance = [...colors].sort((a, b) => a.luminance - b.luminance);
    const byDarkness = colors.filter(c => c.luminance < 0.5);
    const byBrightness = colors.filter(c => c.luminance > 0.3);

    // Assign roles
    const dominant = byFrequency[0]?.hex || '#333333';
    const secondary = findDistinctColor(byFrequency, [dominant])?.hex || '#666666';
    const accent = findMostVibrant(colors)?.hex || '#0066CC';
    const neutral = findNeutral(colors)?.hex || '#F5F5F5';
    const text = findBestTextColor([dominant, secondary, accent, neutral]);

    const all = [dominant, secondary, accent, neutral, ...byFrequency.slice(0, 6).map(c => c.hex)]
        .filter((color, index, arr) => arr.indexOf(color) === index); // Remove duplicates

    return {
        dominant,
        secondary,
        accent,
        neutral,
        text,
        all
    };
}

/**
 * Find a color that's visually distinct from already selected colors
 */
function findDistinctColor(colors: ColorInfo[], exclude: string[]): ColorInfo | null {
    for (const color of colors) {
        if (exclude.includes(color.hex)) continue;

        let isDistinct = true;
        for (const excludeHex of exclude) {
            if (calculateColorDistance(color.hex, excludeHex) < 50) {
                isDistinct = false;
                break;
            }
        }

        if (isDistinct) return color;
    }

    return colors.find(c => !exclude.includes(c.hex)) || null;
}

/**
 * Find the most vibrant/saturated color
 */
function findMostVibrant(colors: ColorInfo[]): ColorInfo | null {
    let mostVibrant = null;
    let maxSaturation = 0;

    for (const color of colors) {
        const saturation = calculateSaturation(color.rgb);
        if (saturation > maxSaturation) {
            maxSaturation = saturation;
            mostVibrant = color;
        }
    }

    return mostVibrant;
}

/**
 * Find a neutral color suitable for backgrounds
 */
function findNeutral(colors: ColorInfo[]): ColorInfo | null {
    // Look for colors with low saturation and medium-high luminance
    return colors.find(color => {
        const saturation = calculateSaturation(color.rgb);
        return saturation < 0.2 && color.luminance > 0.7;
    }) || null;
}

/**
 * Find the best text color for readability against the palette
 */
function findBestTextColor(backgroundColors: string[]): string {
    // Test both black and white against all background colors
    let blackScore = 0;
    let whiteScore = 0;

    for (const bgColor of backgroundColors) {
        blackScore += calculateContrast('#000000', bgColor);
        whiteScore += calculateContrast('#FFFFFF', bgColor);
    }

    return blackScore > whiteScore ? '#000000' : '#FFFFFF';
}

// ===== UTILITY FUNCTIONS =====

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function calculateLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateSaturation(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const diff = max - min;
    return max === 0 ? 0 : diff / max;
}

function calculateColorDistance(hex1: string, hex2: string): number {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);

    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

function calculateContrast(color1: string, color2: string): number {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    const l1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

// ===== USAGE EXAMPLE =====
/*
// In BusinessCardModal or wherever you want to extract colors:
import { extractLogoColors } from '@/lib/colorExtractor';

const handleExtractColors = async () => {
    try {
        const palette = await extractLogoColors(logo.imageDataUri);

        console.log('🎨 Extracted color palette:', {
            dominant: palette.dominant,      // e.g., "#2D5AA0"
            secondary: palette.secondary,    // e.g., "#F4A261"
            accent: palette.accent,          // e.g., "#E76F51"
            neutral: palette.neutral,        // e.g., "#F5F5F5"
            text: palette.text,              // e.g., "#FFFFFF"
            all: palette.all                 // Array of all colors
        });

        // Use the palette to style business cards dynamically
        // Update business card template colors based on logo

    } catch (error) {
        console.error('Failed to extract colors:', error);
    }
};
*/