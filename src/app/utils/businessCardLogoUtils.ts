// src/app/utils/businessCardLogoUtils.ts - FIXED: PRESERVE DOCUMENT FLOW

import { StoredLogo } from '../../../types/logo';

export interface LogoInjectionOptions {
    objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    preserveAspectRatio: boolean;
}

const DEFAULT_LOGO_OPTIONS: LogoInjectionOptions = {
    objectFit: 'contain',
    preserveAspectRatio: true
};

// STANDARDIZED LOGO SIZE - Upper range for prominent display
const STANDARD_LOGO_SIZE = {
    width: '1.0in',
    height: '1.0in'
};

/**
 * Convert size string to numeric value in inches for analysis
 * @param sizeStr - Size string like "0.5in", "12px", etc.
 * @returns Numeric value in inches
 */
function parseSize(sizeStr: string): number {
    const cleanSize = sizeStr.trim().toLowerCase();

    if (cleanSize.includes('in')) {
        return parseFloat(cleanSize.replace('in', ''));
    } else if (cleanSize.includes('px')) {
        // Approximate conversion: 96px = 1in
        return parseFloat(cleanSize.replace('px', '')) / 96;
    } else if (cleanSize.includes('mm')) {
        // 1 inch = 25.4mm
        return parseFloat(cleanSize.replace('mm', '')) / 25.4;
    }

    // Default fallback - assume inches
    return parseFloat(cleanSize) || 0.5;
}

/**
 * Analyze advanced layout constraints from placeholder and context
 * @param styleString - CSS style string from placeholder
 * @param placeholderHTML - Full HTML of the placeholder for context analysis
 * @returns Enhanced constraint analysis results
 */
function analyzeLayoutConstraints(styleString: string, placeholderHTML: string): {
    layoutType: 'header-banner' | 'row-block' | 'inline-flex' | 'standard';
    hasSmallHeight: boolean;
    hasTightSpacing: boolean;
    isInConstrainedContainer: boolean;
    isOverConstrained: boolean;
    recommendedMaxSize: number;
} {
    console.log('🔍 Enhanced layout constraint analysis');

    // Extract dimensions and positioning
    const widthMatch = styleString.match(/width:\s*([^;]+)/i);
    const heightMatch = styleString.match(/height:\s*([^;]+)/i);
    const marginMatch = styleString.match(/margin-bottom:\s*([^;]+)/i);
    const displayMatch = styleString.match(/display:\s*([^;]+)/i);

    const originalHeight = heightMatch ? parseSize(heightMatch[1].trim()) : 0.5;
    const originalWidth = widthMatch ? parseSize(widthMatch[1].trim()) : 0.5;
    const marginBottom = marginMatch ? parseSize(marginMatch[1].trim()) : 0.1;
    const displayType = displayMatch ? displayMatch[1].trim().toLowerCase() : 'block';

    // PATTERN 1: Header/Banner layouts (very small height, often in header sections)
    const isHeaderBanner = originalHeight <= 0.3 &&
        (placeholderHTML.includes('justify-content: space-between') ||
            placeholderHTML.includes('padding: 0.08in') ||
            placeholderHTML.includes('background: #'));

    // PATTERN 2: Row/Block layouts (taking up full width, causing reflow)
    const isRowBlock = displayType.includes('block') ||
        displayType.includes('flex') && !displayType.includes('inline') ||
        placeholderHTML.includes('display: flex') && !placeholderHTML.includes('inline');

    // PATTERN 3: Inline-flex layouts (standard responsive)
    const isInlineFlex = displayType.includes('inline') ||
        placeholderHTML.includes('inline-flex');

    // Determine layout type
    let layoutType: 'header-banner' | 'row-block' | 'inline-flex' | 'standard' = 'standard';
    if (isHeaderBanner) layoutType = 'header-banner';
    else if (isRowBlock) layoutType = 'row-block';
    else if (isInlineFlex) layoutType = 'inline-flex';

    // Basic constraint detection
    const hasSmallHeight = originalHeight <= 0.6;
    const hasTightSpacing = marginBottom < 0.1;
    const isInConstrainedContainer = originalHeight <= 0.5 && originalWidth <= 0.6;

    // PATTERN 4: Over-constraining prevention (don't shrink already reasonable sizes)
    const isOverConstrained = (originalHeight >= 0.35 && originalWidth >= 0.45) &&
        !isHeaderBanner && !hasSmallHeight;

    // Enhanced size recommendations based on layout patterns
    let recommendedMaxSize = 1.0;

    switch (layoutType) {
        case 'header-banner':
            // Very constrained - prevent clipping in header areas
            recommendedMaxSize = Math.min(0.4, originalHeight * 1.8);
            break;

        case 'row-block':
            // Moderate constraint - prevent content reflow
            recommendedMaxSize = Math.min(0.6, originalHeight * 1.5);
            break;

        case 'inline-flex':
            // Mild constraint - standard inline behavior
            if (hasSmallHeight || hasTightSpacing) {
                recommendedMaxSize = 0.7;
            } else {
                recommendedMaxSize = 0.9;
            }
            break;

        case 'standard':
            // Apply constraints based on specific issues
            if (isOverConstrained) {
                // Don't over-constrain reasonable sizes - allow near full size
                recommendedMaxSize = 0.9;
            } else if (hasSmallHeight && hasTightSpacing) {
                // Stubborn overflow cases - be more aggressive
                recommendedMaxSize = 0.5;
            } else if (hasSmallHeight || hasTightSpacing) {
                recommendedMaxSize = 0.7;
            } else {
                recommendedMaxSize = 1.0;
            }
            break;
    }

    const analysis = {
        layoutType,
        hasSmallHeight,
        hasTightSpacing,
        isInConstrainedContainer,
        isOverConstrained,
        recommendedMaxSize
    };

    console.log('✅ Enhanced constraint analysis:', {
        originalDimensions: { width: originalWidth, height: originalHeight },
        marginBottom,
        displayType,
        analysis
    });

    return analysis;
}

/**
 * Get optimal logo size with smart constraint detection
 * @param containerDimensions - Original placeholder container dimensions
 * @param styleString - CSS style string for constraint analysis
 * @param placeholderHTML - Full placeholder HTML for context
 * @returns Optimal logo dimensions with constraint-based sizing
 */
function getConstraintAwareLogoSize(
    containerDimensions: { width: string; height: string },
    styleString: string,
    placeholderHTML: string
): { width: string; height: string } {
    console.log('🎯 Determining constraint-aware logo size. Container:', containerDimensions);

    // Analyze layout constraints to prevent overflow
    const constraints = analyzeLayoutConstraints(styleString, placeholderHTML);

    // Use constraint-based size or full 1.0in
    const logoSize = {
        width: `${constraints.recommendedMaxSize}in`,
        height: `${constraints.recommendedMaxSize}in`
    };

    console.log('✅ Enhanced constraint-aware logo size determined:', {
        recommended: logoSize,
        layoutType: constraints.layoutType,
        appliedConstraints: constraints.recommendedMaxSize < 1.0,
        constraintReasons: {
            headerBanner: constraints.layoutType === 'header-banner',
            rowBlock: constraints.layoutType === 'row-block',
            overConstrained: constraints.isOverConstrained,
            smallHeight: constraints.hasSmallHeight,
            tightSpacing: constraints.hasTightSpacing
        }
    });

    return logoSize;
}
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
 * Remove visual placeholder styles while preserving layout styles
 * @param styleString - Original style string from placeholder
 * @returns Clean style string with only layout properties
 */
function cleanPlaceholderStyles(styleString: string): string {
    console.log('🧹 Cleaning placeholder styles:', styleString);

    // Properties to REMOVE (visual styling)
    const stylesToRemove = [
        'background-color',
        'background',
        'border',
        'border-color',
        'border-width',
        'border-style',
        'border-radius',
        'color',
        'font-size',
        'font-weight',
        'text-shadow',
        'box-shadow',
        'backdrop-filter'
    ];

    // Properties to PRESERVE (layout/positioning)
    const preservedStyles: string[] = [];
    const styleDeclarations = styleString.split(';');

    for (const declaration of styleDeclarations) {
        const trimmedDeclaration = declaration.trim();
        if (!trimmedDeclaration) continue;

        const [property] = trimmedDeclaration.split(':');
        const cleanProperty = property?.trim().toLowerCase();

        // Check if this property should be preserved
        const shouldRemove = stylesToRemove.some(removeStyle =>
            cleanProperty?.startsWith(removeStyle.toLowerCase())
        );

        if (!shouldRemove && cleanProperty) {
            preservedStyles.push(trimmedDeclaration);
        }
    }

    const cleanedStyle = preservedStyles.join('; ');
    console.log('✅ Cleaned styles (preserved layout):', cleanedStyle);
    return cleanedStyle;
}

/**
 * Create logo img element with constraint-aware sizing
 * @param imageDataUri - Base64 logo image data
 * @param containerDimensions - Original container dimensions
 * @param styleString - CSS style string for constraint analysis
 * @param placeholderHTML - Full placeholder HTML for context
 * @param options - Logo styling options
 * @returns HTML string for logo image
 */
function createLogoImageElement(
    imageDataUri: string,
    containerDimensions: { width: string; height: string },
    styleString: string,
    placeholderHTML: string,
    options: LogoInjectionOptions
): string {
    try {
        // Validate image data URI
        if (!imageDataUri || !imageDataUri.startsWith('data:image/')) {
            console.error('❌ Invalid image data URI provided to createLogoImageElement');
            return '';
        }

        // Get constraint-aware logo size (smart overflow prevention)
        const logoSize = getConstraintAwareLogoSize(containerDimensions, styleString, placeholderHTML);
        console.log('🖼️ Creating logo with enhanced constraint-aware sizing:', logoSize);

        const styles = [
            `width: ${logoSize.width}`,
            `height: ${logoSize.height}`,
            `object-fit: ${options.objectFit}`,
            'display: block' // Ensure image behaves properly in flex container
        ];

        if (options.preserveAspectRatio) {
            styles.push('object-position: center');
        }

        // Escape any quotes in the image data URI to prevent HTML corruption
        const escapedImageDataUri = imageDataUri.replace(/"/g, '&quot;');

        const imgElement = `<img src="${escapedImageDataUri}" style="${styles.join('; ')}" alt="Logo" />`;

        console.log('✅ Created enhanced constraint-aware logo element');
        return imgElement;

    } catch (error) {
        console.error('❌ Error creating logo image element:', error);
        return '';
    }
}

/**
 * FIXED: Inject logo by preserving placeholder container but replacing content
 * @param businessCardHtml - Original business card HTML
 * @param logo - StoredLogo object with image data
 * @param options - Optional styling overrides
 * @returns Modified HTML with logo injected while preserving document flow
 */
export function injectLogoIntoBusinessCard(
    businessCardHtml: string,
    logo: StoredLogo | null | undefined,
    options: Partial<LogoInjectionOptions> = {}
): string {
    try {
        console.log('🎨 Starting ENHANCED constraint-aware injection (layout type detection + overflow prevention):', {
            hasLogo: !!logo,
            logoId: logo?.id,
            htmlLength: businessCardHtml.length,
            targetSize: STANDARD_LOGO_SIZE
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

        // Find all logo placeholder divs with their content
        const logoPlaceholderRegex = /<div([^>]*class="[^"]*logo-placeholder[^"]*"[^>]*)(.*?)>(.*?)<\/div>/gi;
        const matches = Array.from(businessCardHtml.matchAll(logoPlaceholderRegex));

        if (matches.length === 0) {
            console.log('⚠️ No logo placeholders found in business card HTML');
            return businessCardHtml;
        }

        console.log(`🔍 Found ${matches.length} logo placeholder(s)`);

        let modifiedHtml = businessCardHtml;
        let injectionCount = 0;

        // Process each logo placeholder - PRESERVE CONTAINER, REPLACE CONTENT
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const fullPlaceholderDiv = match[0];
            const divAttributes = match[1]; // Everything between <div and >
            const restOfAttributes = match[2]; // Any remaining attributes
            const placeholderContent = match[3]; // Content inside the div

            console.log(`🎯 Processing logo placeholder ${i + 1} - PRESERVING CONTAINER:`, {
                placeholder: fullPlaceholderDiv.substring(0, 100) + '...'
            });

            // Extract and clean the style attribute
            const styleMatch = (divAttributes + restOfAttributes).match(/style="([^"]*)"/i);

            if (!styleMatch) {
                console.warn(`⚠️ No style attribute found in placeholder ${i + 1}, skipping`);
                continue;
            }

            const originalStyle = styleMatch[1];
            const containerDimensions = extractDimensionsFromStyle(originalStyle);
            const cleanedStyle = cleanPlaceholderStyles(originalStyle);

            // Create logo image using constraint-aware sizing (prevents overflow)
            const logoImage = createLogoImageElement(
                logo.imageDataUri,
                containerDimensions,
                originalStyle,
                fullPlaceholderDiv,
                finalOptions
            );

            if (!logoImage) {
                console.warn(`⚠️ Failed to create logo image for placeholder ${i + 1}`);
                continue;
            }

            // CRITICAL FIX: Preserve div container but clean styles and replace content
            const updatedPlaceholderDiv = fullPlaceholderDiv
                // Replace the style attribute with cleaned version
                .replace(/style="[^"]*"/i, `style="${cleanedStyle}"`)
                // Replace the content with our logo image
                .replace(/>.*?<\/div>/i, `>${logoImage}</div>`);

            console.log(`🔄 Preserving container, replacing content and cleaning visual styles`);
            modifiedHtml = modifiedHtml.replace(fullPlaceholderDiv, updatedPlaceholderDiv);
            injectionCount++;

            console.log(`✅ Successfully injected logo into placeholder ${i + 1} while preserving layout`);
        }

        console.log(`🎉 ENHANCED constraint-aware injection completed! ${injectionCount} logos optimized by layout type (header/row/inline patterns detected)`);
        return modifiedHtml;

    } catch (error) {
        console.error('❌ Critical error in document flow preserving logo injection:', error);
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