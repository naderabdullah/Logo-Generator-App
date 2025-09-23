// FILE: src/app/utils/businessCardLogoUtils.ts
// PURPOSE: Enhanced logo injection utilities for business card previews
// UPDATES: Added comprehensive logo injection functions with proper error handling and logging

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
    console.log('🔍 Extracting dimensions from style:', styleString);

    const widthMatch = styleString.match(/width:\s*([^;]+)/i);
    const heightMatch = styleString.match(/height:\s*([^;]+)/i);

    const dimensions = {
        width: widthMatch ? widthMatch[1].trim() : '1in',
        height: heightMatch ? heightMatch[1].trim() : '1in'
    };

    console.log('✅ Extracted dimensions:', dimensions);
    return dimensions;
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

        console.log('🔍 Creating logo overlay with dimensions:', dimensions);

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

        console.log('✅ Generated logo overlay element');
        return imgTag;

    } catch (error) {
        console.error('❌ Error creating overlay logo image element:', error);
        return '';
    }
}

/**
 * Main function to inject logo into business card HTML
 * @param businessCardHtml - Original business card HTML
 * @param logo - StoredLogo object with image data
 * @param options - Optional styling overrides
 * @returns Modified HTML with logo injected
 */
export function injectLogoIntoBusinessCard(
    businessCardHtml: string,
    logo: StoredLogo | null | undefined,
    options: Partial<LogoInjectionOptions> = {}
): string {
    try {
        console.log('🎨 Starting logo injection process:', {
            hasLogo: !!logo,
            logoId: logo?.id,
            htmlLength: businessCardHtml.length
        });

        // Early return if no logo provided
        if (!logo || !logo.imageDataUri) {
            console.log('⚠️ No logo provided or logo missing imageDataUri, returning original HTML');
            return businessCardHtml;
        }

        // Validate logo data
        if (!logo.imageDataUri.startsWith('data:image/')) {
            console.error('❌ Invalid logo data format, expected data:image/ URI');
            return businessCardHtml;
        }

        // Merge options with defaults
        const finalOptions = { ...DEFAULT_LOGO_OPTIONS, ...options };

        console.log('🔧 Using logo injection options:', finalOptions);

        // Find all logo placeholder divs
        const logoPlaceholderRegex = /<div[^>]*class="[^"]*logo-placeholder[^"]*"[^>]*>(.*?)<\/div>/gi;
        const matches = Array.from(businessCardHtml.matchAll(logoPlaceholderRegex));

        if (matches.length === 0) {
            console.log('⚠️ No logo placeholders found in business card HTML');
            return businessCardHtml;
        }

        console.log(`🔍 Found ${matches.length} logo placeholder(s)`);

        let modifiedHtml = businessCardHtml;
        let injectionCount = 0;

        // Process each logo placeholder
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const fullPlaceholderDiv = match[0];

            console.log(`🎯 Processing logo placeholder ${i + 1}:`, {
                placeholder: fullPlaceholderDiv.substring(0, 100) + '...'
            });

            // Extract style attribute
            const styleMatch = fullPlaceholderDiv.match(/style="([^"]*)"/i);

            if (!styleMatch) {
                console.warn(`⚠️ No style attribute found in placeholder ${i + 1}, skipping`);
                continue;
            }

            const styleString = styleMatch[1];
            const dimensions = extractDimensionsFromStyle(styleString);

            // Create logo overlay element
            const logoOverlay = createOverlayLogoImageElement(logo.imageDataUri, dimensions, finalOptions);

            if (!logoOverlay) {
                console.warn(`⚠️ Failed to create logo overlay for placeholder ${i + 1}`);
                continue;
            }

            // Inject logo by making the placeholder relative and adding the logo as a child
            const enhancedPlaceholder = fullPlaceholderDiv.replace(
                /style="([^"]*)"/i,
                (match, existingStyle) => {
                    // Add position relative if not already present
                    const hasPosition = existingStyle.includes('position:');
                    const newStyle = hasPosition ? existingStyle : existingStyle + '; position: relative';
                    return `style="${newStyle}"`;
                }
            ).replace(
                />(.*?)<\/div>/i,
                `>${logoOverlay}</div>`
            );

            // Replace in the HTML
            modifiedHtml = modifiedHtml.replace(fullPlaceholderDiv, enhancedPlaceholder);
            injectionCount++;

            console.log(`✅ Successfully injected logo into placeholder ${i + 1}`);
        }

        console.log(`🎉 Logo injection completed! Injected into ${injectionCount} placeholder(s)`);
        return modifiedHtml;

    } catch (error) {
        console.error('❌ Critical error in logo injection:', error);
        // Return original HTML to prevent breaking the UI
        return businessCardHtml;
    }
}

/**
 * Helper function to validate logo data before injection
 * @param logo - StoredLogo object to validate
 * @returns boolean indicating if logo is valid for injection
 */
export function validateLogoForInjection(logo: StoredLogo | null | undefined): boolean {
    if (!logo) {
        console.log('🔍 Logo validation: No logo provided');
        return false;
    }

    if (!logo.imageDataUri) {
        console.warn('⚠️ Logo validation: Logo missing imageDataUri');
        return false;
    }

    if (!logo.imageDataUri.startsWith('data:image/')) {
        console.warn('⚠️ Logo validation: Invalid data URI format');
        return false;
    }

    const minDataUriLength = 100; // Minimum realistic data URI length
    if (logo.imageDataUri.length < minDataUriLength) {
        console.warn('⚠️ Logo validation: Data URI too short, possibly corrupted');
        return false;
    }

    console.log('✅ Logo validation: Logo is valid for injection');
    return true;
}

/**
 * Helper to get logo dimensions from a business card layout
 * @param businessCardHtml - The business card HTML
 * @returns Array of dimension objects found in logo placeholders
 */
export function getLogoPlaceholderDimensions(businessCardHtml: string): Array<{ width: string; height: string }> {
    try {
        const logoPlaceholderRegex = /<div[^>]*class="[^"]*logo-placeholder[^"]*"[^>]*>/gi;
        const matches = Array.from(businessCardHtml.matchAll(logoPlaceholderRegex));

        return matches.map(match => {
            const styleMatch = match[0].match(/style="([^"]*)"/i);
            if (styleMatch) {
                return extractDimensionsFromStyle(styleMatch[1]);
            }
            return { width: '1in', height: '1in' };
        });
    } catch (error) {
        console.error('❌ Error extracting logo placeholder dimensions:', error);
        return [];
    }
}