// FILE: src/utils/businessCardInjection.ts
// PURPOSE: Wrapper utilities for Step 3 that use existing injection utilities
// USES: Existing businessCardLogoUtils.ts and businessCardContactUtils.ts
// NOTE: This is a thin wrapper to extract logo from formData and call existing utilities

import { BusinessCardData } from '../../types/businessCard';
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
            console.log('⚠️ No logo data in formData');
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

        console.log('✅ Converted formData.logo to StoredLogo format');
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
        console.log('🎨 Generating fully injected HTML for:', layout.catalogId);
        console.log('📋 Using existing injection utilities');

        // Start with layout's base HTML
        let injectedHTML = layout.jsx;

        // Step 1: Inject contact information using EXISTING utility
        console.log('📝 Step 1: Injecting contact info (using existing businessCardContactUtils)');
        injectedHTML = injectContact(injectedHTML, formData);

        // Step 2: Inject logo using EXISTING utility
        const storedLogo = formDataToStoredLogo(formData);

        if (storedLogo && validateLogo(storedLogo)) {
            console.log('🎨 Step 2: Injecting logo (using existing businessCardLogoUtils)');
            injectedHTML = injectLogoIntoBusinessCard(injectedHTML, storedLogo);
        } else {
            console.log('⚠️ Step 2: Skipping logo injection (no valid logo in formData)');
        }

        console.log('✅ Fully injected HTML generated successfully using existing utilities');
        return injectedHTML;

    } catch (error) {
        console.error('❌ Failed to generate injected HTML:', error);
        throw new Error('HTML injection failed');
    }
}