// FILE: src/lib/businessCardLogoUtils.ts
// PURPOSE: Utility functions for injecting user logos into business card layout JSX strings
// FEATURE: Replace logo placeholders with actual user logos while preserving layout structure

import { StoredLogo } from '@/app/utils/indexedDBUtils';

/**
 * Interface for logo injection options
 */
interface LogoInjectionOptions {
    maxWidth?: string;
    maxHeight?: string;
    objectFit?: 'contain' | 'cover' | 'fill';
    zIndex?: number;
    preserveAspectRatio?: boolean;
}

/**
 * Default logo injection settings to prevent layout breakage
 */
const DEFAULT_LOGO_OPTIONS: LogoInjectionOptions = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    zIndex: 20, // Higher z-index for proper overlay
    preserveAspectRatio: true
};

/**
 * Extract dimensions from a style string (e.g., "width: 0.8in; height: 0.45in;")
 */
function extractDimensionsFromStyle(styleString: string): { width: string; height: string } {
    const widthMatch = styleString.match(/width:\s*([^;]+)/i);
    const heightMatch = styleString.match(/height:\s*([^;]+)/i);

    return {
        width: widthMatch ? widthMatch[1].trim() : '1in',
        height: heightMatch ? heightMatch[1].trim() : '1in'
    };
}

/**
 * Inject user logo into business card layout JSX string using z-layer overlay approach
 * @param jsxString - Original business card JSX layout string
 * @param logo - User's stored logo data
 * @param options - Optional styling overrides
 * @returns Modified JSX string with logo injected
 */
export function injectLogoIntoBusinessCardJSX(
    jsxString: string,
    logo: StoredLogo,
    options: LogoInjectionOptions = {}
): string {
    try {
        console.log('🎨 BusinessCardLogoUtils - Starting logo injection for logo:', {
            logoId: logo.id,
            logoName: logo.name,
            hasImageData: !!logo.imageDataUri,
            imageDataLength: logo.imageDataUri?.length
        });

        // Merge options with defaults
        const finalOptions = { ...DEFAULT_LOGO_OPTIONS, ...options };

        // Validate logo data
        if (!logo.imageDataUri) {
            console.warn('⚠️ BusinessCardLogoUtils - No image data URI found in logo, returning original JSX');
            return jsxString;
        }

        if (!logo.imageDataUri.startsWith('data:image/')) {
            console.warn('⚠️ BusinessCardLogoUtils - Invalid image data URI format, returning original JSX');
            return jsxString;
        }

        let modifiedJSX = jsxString;

        // Pattern 1: Handle class="logo-placeholder" with z-layer overlay
        modifiedJSX = modifiedJSX.replace(
            /<div([^>]*class="logo-placeholder"[^>]*style="([^"]*)"[^>]*)>(.*?)<\/div>/gi,
            (match, attributes, styleString, content) => {
                const dimensions = extractDimensionsFromStyle(styleString);
                const logoImage = createOverlayLogoImageElement(logo.imageDataUri, dimensions, finalOptions);

                // Keep original placeholder but add logo overlay
                return `<div${attributes} style="position: relative; ${styleString}">${logoImage}${content}</div>`;
            }
        );

        // Pattern 2: Handle className="logo-placeholder" with z-layer overlay
        modifiedJSX = modifiedJSX.replace(
            /<div([^>]*className="logo-placeholder"[^>]*style="([^"]*)"[^>]*)>(.*?)<\/div>/gi,
            (match, attributes, styleString, content) => {
                const dimensions = extractDimensionsFromStyle(styleString);
                const logoImage = createOverlayLogoImageElement(logo.imageDataUri, dimensions, finalOptions);

                // Keep original placeholder but add logo overlay
                return `<div${attributes} style="position: relative; ${styleString}">${logoImage}${content}</div>`;
            }
        );

        // Pattern 3: Handle style-based detection for logo placeholders without explicit class
        modifiedJSX = modifiedJSX.replace(
            /<div([^>]*style="([^"]*)"[^>]*)>(.*?LOGO.*?)<\/div>/gi,
            (match, attributes, styleString, content) => {
                // Only process if it looks like a logo placeholder (small dimensions, centered content)
                if (styleString.includes('width:') && styleString.includes('height:') &&
                    (styleString.includes('flex') || styleString.includes('center'))) {

                    const dimensions = extractDimensionsFromStyle(styleString);
                    const logoImage = createOverlayLogoImageElement(logo.imageDataUri, dimensions, finalOptions);

                    // Keep original placeholder but add logo overlay and reduce text opacity
                    const hiddenContent = content.replace(/LOGO/gi, '<span style="opacity: 0;">LOGO</span>');
                    return `<div${attributes} style="position: relative; ${styleString}">${logoImage}${hiddenContent}</div>`;
                }
                return match; // Return unchanged if doesn't match criteria
            }
        );

        console.log('✅ BusinessCardLogoUtils - Logo injection completed successfully');
        return modifiedJSX;

    } catch (error) {
        console.error('❌ BusinessCardLogoUtils - Error during logo injection:', error);
        return jsxString; // Return original on error
    }
}

/**
 * Create a styled logo image element
 * @param imageDataUri - Base64 logo image data
 * @param options - Styling options
 * @returns HTML string for logo image
 */
function createLogoImageElement(imageDataUri: string, options: LogoInjectionOptions): string {
    const styles = [
        `max-width: ${options.maxWidth}`,
        `max-height: ${options.maxHeight}`,
        `object-fit: ${options.objectFit}`,
        `z-index: ${options.zIndex}`,
        'position: relative',
        'display: block',
        'margin: auto'
    ];

    if (options.preserveAspectRatio) {
        styles.push('aspect-ratio: auto');
    }

    return `<img src="${imageDataUri}" style="${styles.join('; ')}" alt="Logo" />`;
}

/**
 * Create an absolutely positioned logo overlay that respects placeholder dimensions
 * @param imageDataUri - Base64 logo image data
 * @param dimensions - Extracted placeholder dimensions
 * @param options - Styling options
 * @returns HTML string for overlay logo image
 */
function createOverlayLogoImageElement(
    imageDataUri: string,
    dimensions: { width: string; height: string },
    options: LogoInjectionOptions
): string {
    const styles = [
        'position: absolute',
        'top: 0',
        'left: 0',
        'right: 0',
        'bottom: 0',
        `width: ${dimensions.width}`,
        `height: ${dimensions.height}`,
        `object-fit: ${options.objectFit}`,
        `z-index: ${options.zIndex}`,
        'margin: auto'
    ];

    if (options.preserveAspectRatio) {
        styles.push('aspect-ratio: auto');
    }

    console.log('🎨 Creating overlay logo with dimensions:', {
        width: dimensions.width,
        height: dimensions.height,
        objectFit: options.objectFit,
        zIndex: options.zIndex
    });

    return `<img src="${imageDataUri}" style="${styles.join('; ')}" alt="Logo" />`;
}

/**
 * Check if a business card layout contains logo placeholders
 * @param jsxString - Business card JSX layout string
 * @returns Boolean indicating if logo placeholders are present
 */
export function hasLogoPlaceholder(jsxString: string): boolean {
    try {
        const logoPatterns = [
            /class="logo-placeholder"/i,
            /className="logo-placeholder"/i,
            /<div[^>]*style="[^"]*width:[^"]*height:[^"]*"[^>]*>[^<]*LOGO[^<]*<\/div>/i // Style-based detection
        ];

        const hasPlaceholder = logoPatterns.some(pattern => pattern.test(jsxString));

        if (hasPlaceholder) {
            console.log('✅ Logo placeholder detected in layout');
        } else {
            console.log('ℹ️ No logo placeholder found in layout');
        }

        return hasPlaceholder;
    } catch (error) {
        console.error('❌ BusinessCardLogoUtils - Error checking for logo placeholder:', error);
        return false;
    }
}

/**
 * Get optimized logo injection options based on business card layout style
 * @param layoutTheme - Business card theme (e.g., 'corporate', 'creative', 'tech')
 * @param layoutStyle - Business card style (e.g., 'company-focused', 'contact-focused')
 * @returns Optimized logo injection options
 */
export function getLogoOptionsForLayout(
    layoutTheme?: string,
    layoutStyle?: string
): LogoInjectionOptions {
    try {
        // Base options
        const baseOptions: LogoInjectionOptions = { ...DEFAULT_LOGO_OPTIONS };

        // Theme-specific adjustments
        switch (layoutTheme?.toLowerCase()) {
            case 'tech':
            case 'cyberpunk':
                return {
                    ...baseOptions,
                    objectFit: 'contain',
                    zIndex: 25, // Higher z-index for tech themes with overlays
                };

            case 'luxury':
            case 'elegant':
            case 'classic':
                return {
                    ...baseOptions,
                    objectFit: 'contain',
                    zIndex: 22,
                };

            case 'creative':
            case 'artistic':
                return {
                    ...baseOptions,
                    objectFit: 'contain',
                    zIndex: 23,
                };

            case 'minimalistic':
            case 'minimalist':
                return {
                    ...baseOptions,
                    objectFit: 'contain',
                    zIndex: 21, // Slightly higher for clean overlay
                };

            default:
                return baseOptions;
        }
    } catch (error) {
        console.error('❌ BusinessCardLogoUtils - Error getting layout options:', error);
        return DEFAULT_LOGO_OPTIONS;
    }
}

/**
 * Batch process multiple business card layouts with logo injection
 * @param layouts - Array of business card layout objects
 * @param logo - User's stored logo data
 * @param limit - Maximum number of layouts to process (default: 5)
 * @returns Array of layouts with logos injected
 */
export function batchInjectLogos<T extends { jsx: string; theme?: string; style?: string }>(
    layouts: T[],
    logo: StoredLogo,
    limit: number = 5
): T[] {
    try {
        console.log(`🎨 BusinessCardLogoUtils - Starting batch logo injection for ${Math.min(layouts.length, limit)} layouts`);

        return layouts.map((layout, index) => {
            if (index >= limit) {
                // Return original layout for items beyond the limit
                return layout;
            }

            if (!hasLogoPlaceholder(layout.jsx)) {
                console.log(`⚠️ BusinessCardLogoUtils - Layout ${index + 1} has no logo placeholder, skipping`);
                return layout;
            }

            const options = getLogoOptionsForLayout(layout.theme, layout.style);
            const modifiedJSX = injectLogoIntoBusinessCardJSX(layout.jsx, logo, options);

            console.log(`✅ BusinessCardLogoUtils - Logo injected for layout ${index + 1}: ${layout.theme || 'unknown theme'}`);

            return {
                ...layout,
                jsx: modifiedJSX
            };
        });

    } catch (error) {
        console.error('❌ BusinessCardLogoUtils - Error in batch logo injection:', error);
        return layouts; // Return original layouts on error
    }
}