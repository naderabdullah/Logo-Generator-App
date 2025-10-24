// FILE: src/utils/businessCardInjection.ts

import { BusinessCardData } from '../../../types/businessCard';
import { BusinessCardLayout } from '@/data/businessCardLayouts';
import {
    injectLogoIntoBusinessCard,
    validateLogoForInjection as validateLogo
} from '@/app/utils/businessCardLogoUtils';
import { injectContactInfo as injectContact } from '@/app/utils/businessCardContactUtils';
import { StoredLogo } from '@/app/utils/indexedDBUtils';

/**
 * Convert formData.logo to StoredLogo format for existing utilities
 * @param formData - Business card data containing logo info
 * @returns StoredLogo object or null
 */
function formDataToStoredLogo(formData: BusinessCardData): StoredLogo | null {
    try {
        if (!formData?.logo?.logoDataUri) {
            return null;
        }

        // Convert formData.logo structure to StoredLogo format
        const storedLogo: StoredLogo = {
            id: formData.logo.logoId || '',
            name: 'Business Card Logo',
            imageDataUri: formData.logo.logoDataUri,
            timestamp: Date.now(),
            userId: ''
        };

        return storedLogo;

    } catch (error) {
        console.error('❌ Error converting formData.logo:', error);
        return null;
    }
}

/**
 * Generate fully injected HTML for a business card layout
 * This is a wrapper that uses existing tested utilities
 * @param layout - Business card layout
 * @param formData - Contact information (includes logo data in formData.logo)
 * @returns Complete HTML with all data injected
 */
export function generateInjectedHTML(
    layout: BusinessCardLayout,
    formData: BusinessCardData
): string {
    try {

        // Extract allowEnlargedLogo flag from layout metadata
        const allowEnlargedLogo = layout.metadata?.allowEnlargedLogo === true;

        // Start with layout's base HTML
        let injectedHTML = layout.jsx;

        // Step 1: Inject contact information using EXISTING utility
        injectedHTML = injectContact(injectedHTML, formData);

        // Step 2: Inject logo using EXISTING utility
        const storedLogo = formDataToStoredLogo(formData);

        if (storedLogo && validateLogo(storedLogo)) {

            injectedHTML = injectLogoIntoBusinessCard(injectedHTML, storedLogo, {
                objectFit: 'contain',
                preserveAspectRatio: true,
                allowEnlargedLogo: allowEnlargedLogo
            });

        } else {
            console.log('⚠️ Step 2: Skipping logo injection (no valid logo in formData)');
        }

        return injectedHTML;

    } catch (error) {
        console.error('❌ Failed to generate injected HTML:', error);
        throw new Error('HTML injection failed');
    }
}