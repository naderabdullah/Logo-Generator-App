// FILE: src/app/utils/businessCardLogoUtils.ts
// PURPOSE: FIXED logo injection to prevent digital signature leakage
// CHANGES: Fixed regex patterns and improved error handling

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
    zIndex: 20,
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
    try {
        // Validate image data URI
        if (!imageDataUri || !imageDataUri.startsWith('data:image/')) {
            console.error('❌ Invalid image data URI provided to createOverlayLogoImageElement');
            return '';
        }

        // DEBUG: Log the data URI format
        console.log('🔍 DEBUG Data URI format:', {
            starts_with_data: imageDataUri.startsWith('data:image/'),
            length: imageDataUri.length,
            first_50_chars: imageDataUri.substring(0, 50),
            has_base64: imageDataUri.includes('base64'),
            has_quotes: imageDataUri.includes('"')
        });

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

        // Escape any quotes in the image data URI to prevent JSX corruption
        const escapedImageDataUri = imageDataUri.replace(/"/g, '&quot;');

        const imgTag = `<img src="${escapedImageDataUri}" style="${styles.join('; ')}" alt="Logo" />`;

        // DEBUG: Log the generated img tag
        console.log('🔍 DEBUG Generated img tag:', {
            imgTag_first_100: imgTag.substring(0, 100),
            imgTag_length: imgTag.length,
            src_attribute: imgTag.match(/src="([^"]*)"/) ? imgTag.match(/src="([^"]*)"/)[1].substring(0, 50) : 'NOT_FOUND'
        });

        return imgTag;
    } catch (error) {
        console.error('❌ Error creating overlay logo image element:', error);
        return '';
    }
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
        let injectionCount = 0;

        // FIXED Pattern 1: Handle class="logo-placeholder" with z-layer overlay
// FIXED Pattern 1: Handle class="logo-placeholder" with z-layer overlay
        modifiedJSX = modifiedJSX.replace(
            /<div([^>]*class="logo-placeholder"[^>]*style="([^"]*)"[^>]*)>(.*?)<\/div>/gi,
            (match, attributes, styleString, content) => {
                try {
                    console.log('🔍 DEBUG Pattern 1 Match:', {
                        full_match: match,
                        attributes: attributes,
                        styleString: styleString,
                        content: content
                    });

                    const dimensions = extractDimensionsFromStyle(styleString);
                    const logoImage = createOverlayLogoImageElement(logo.imageDataUri, dimensions, finalOptions);

                    if (!logoImage) {
                        console.warn('⚠️ Failed to create logo image, keeping original placeholder');
                        return match;
                    }

                    injectionCount++;
                    console.log(`✅ Logo injected into class="logo-placeholder" (injection #${injectionCount})`);

                    const result = `<div${attributes} style="position: relative; ${styleString}">${logoImage}${content}</div>`;
                    console.log('🔍 DEBUG Pattern 1 Result:', result.substring(0, 200));

                    return result;
                } catch (error) {
                    console.error('❌ Error in pattern 1 logo injection:', error);
                    return match; // Return original on error
                }
            }
        );

        // FIXED Pattern 2: Handle className="logo-placeholder" with z-layer overlay
        modifiedJSX = modifiedJSX.replace(
            /<div([^>]*className="logo-placeholder"[^>]*style="([^"]*)"[^>]*)>(.*?)<\/div>/gi,
            (match, attributes, styleString, content) => {
                try {
                    const dimensions = extractDimensionsFromStyle(styleString);
                    const logoImage = createOverlayLogoImageElement(logo.imageDataUri, dimensions, finalOptions);

                    if (!logoImage) {
                        console.warn('⚠️ Failed to create logo image, keeping original placeholder');
                        return match;
                    }

                    injectionCount++;
                    console.log(`✅ Logo injected into className="logo-placeholder" (injection #${injectionCount})`);

                    // Keep original placeholder but add logo overlay
                    return `<div${attributes} style="position: relative; ${styleString}">${logoImage}${content}</div>`;
                } catch (error) {
                    console.error('❌ Error in pattern 2 logo injection:', error);
                    return match; // Return original on error
                }
            }
        );

        // Pattern 3: Handle style-based detection for logo placeholders without explicit class
        modifiedJSX = modifiedJSX.replace(
            /<div([^>]*style="([^"]*)"[^>]*)>(.*?LOGO.*?)<\/div>/gi,
            (match, attributes, styleString, content) => {
                try {
                    // Only process if it looks like a logo placeholder (small dimensions, centered content)
                    if (styleString.includes('width:') && styleString.includes('height:') &&
                        (styleString.includes('flex') || styleString.includes('center'))) {

                        const dimensions = extractDimensionsFromStyle(styleString);
                        const logoImage = createOverlayLogoImageElement(logo.imageDataUri, dimensions, finalOptions);

                        if (!logoImage) {
                            console.warn('⚠️ Failed to create logo image, keeping original placeholder');
                            return match;
                        }

                        injectionCount++;
                        console.log(`✅ Logo injected into LOGO placeholder (injection #${injectionCount})`);

                        // Keep original placeholder but add logo overlay and reduce text opacity
                        const hiddenContent = content.replace(/LOGO/gi, '<span style="opacity: 0;">LOGO</span>');
                        return `<div${attributes} style="position: relative; ${styleString}">${logoImage}${hiddenContent}</div>`;
                    }
                    return match; // Return unchanged if doesn't match criteria
                } catch (error) {
                    console.error('❌ Error in pattern 3 logo injection:', error);
                    return match; // Return original on error
                }
            }
        );

        console.log(`✅ BusinessCardLogoUtils - Logo injection completed successfully. Total injections: ${injectionCount}`);

        if (injectionCount === 0) {
            console.warn('⚠️ No logo placeholders were found or injected');
        }

        return modifiedJSX;

    } catch (error) {
        console.error('❌ BusinessCardLogoUtils - Error during logo injection:', error);
        return jsxString; // Return original on error
    }
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