// FILE: src/app/utils/businessCardContactUtils.ts
// PURPOSE: Contact info injection with comprehensive hide-if-empty logic
// CHANGES:
//   - Added hide-if-empty logic for ALL optional fields
//   - Title, Subtitle, Descriptor, Addresses now hide when empty
//   - Prevents hardcoded placeholder values from appearing on business cards
//   - Comprehensive logging for debugging
// ACTION: FULL FILE REPLACEMENT

import { BusinessCardData } from '../../../types/businessCard';

/**
 * FORMAT PHONE NUMBER
 */
export function formatPhoneNumber(phone: string): string {
    try {
        if (!phone || !phone.trim()) return '';

        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 11 && cleaned[0] === '1') {
            return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
        } else if (cleaned.length === 7) {
            return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
        }

        console.log(`⚠️ [Contact Utils] Non-standard phone format: ${phone}`);
        return phone;
    } catch (error) {
        console.error('❌ [Contact Utils] Error formatting phone:', error);
        return phone;
    }
}

/**
 * EXTRACT TEXT BETWEEN TAGS
 * Finds text content between HTML tags without parsing
 */
function extractTextBetweenTags(html: string, className: string): string | null {
    try {
        const openTagRegex = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>`, 'i');
        const openMatch = html.match(openTagRegex);

        if (!openMatch) {
            console.log(`🔍 [Contact Utils] No ${className} found in layout`);
            return null;
        }

        const startIndex = openMatch.index! + openMatch[0].length;
        const afterOpen = html.substring(startIndex);
        const closeTagIndex = afterOpen.indexOf('</');

        if (closeTagIndex === -1) return null;

        const textContent = afterOpen.substring(0, closeTagIndex);
        console.log(`✅ [Contact Utils] Extracted ${className}: "${textContent}"`);
        return textContent;
    } catch (error) {
        console.error(`❌ [Contact Utils] Error extracting text for class ${className}:`, error);
        return null;
    }
}

/**
 * SIMPLE TEXT REPLACEMENT
 */
function simpleReplace(html: string, oldText: string, newText: string): string {
    try {
        if (!oldText || !newText) {
            console.warn('⚠️ [Contact Utils] Empty text in replacement');
            return html;
        }

        console.log(`🔄 [Contact Utils] Simple replace: "${oldText}" → "${newText}"`);

        const result = html.replace(oldText, newText);

        if (result !== html) {
            console.log(`✅ [Contact Utils] Replacement successful`);
        } else {
            console.warn(`⚠️ [Contact Utils] Text not found: "${oldText}"`);
        }

        return result;
    } catch (error) {
        console.error('❌ [Contact Utils] Error in simple replace:', error);
        return html;
    }
}

/**
 * MAIN INJECTION FUNCTION - WITH COMPREHENSIVE HIDE-IF-EMPTY LOGIC
 * Injects form data into BC layout HTML and hides empty optional fields
 */
export function injectContactInfo(
    layoutHtml: string,
    formData: BusinessCardData
): string {
    try {
        console.log('🚀 [Contact Utils] Starting injection with hide-if-empty logic');
        console.log('📋 [Contact Utils] Form data summary:', {
            name: formData.name,
            title: formData.title,
            company: formData.companyName,
            subtitle: formData.subtitle,
            slogan: formData.slogan,
            descriptor: formData.descriptor,
            yearEstablished: formData.yearEstablished,
            phones: formData.phones?.length || 0,
            emails: formData.emails?.length || 0,
            addresses: formData.addresses?.length || 0,
            websites: formData.websites?.length || 0,
            socialMedia: formData.socialMedia?.length || 0
        });

        let result = layoutHtml;

        // ============================================================================
        // REQUIRED FIELDS - Always inject (form validation ensures they exist)
        // ============================================================================

        // 1. NAME (Required)
        if (formData.name && formData.name.trim()) {
            const placeholderName = extractTextBetweenTags(result, 'bc-contact-name');
            if (placeholderName) {
                console.log('👤 [Contact Utils] Injecting name (required)');
                result = simpleReplace(result, placeholderName, formData.name);
            }
        }

        // 2. COMPANY (Required)
        if (formData.companyName && formData.companyName.trim()) {
            const placeholderCompany = extractTextBetweenTags(result, 'bc-contact-company');
            if (placeholderCompany) {
                console.log('🏢 [Contact Utils] Injecting company (required)');
                result = simpleReplace(result, placeholderCompany, formData.companyName);
            }
        }

        // ============================================================================
        // OPTIONAL FIELDS - Inject if populated, HIDE if empty
        // ============================================================================

        // 3. TITLE (Optional - hide if empty)
        const titleRegex = /<[^>]*class=["'][^"']*bc-contact-title[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
        const titleMatch = titleRegex.exec(result);

        if (titleMatch) {
            const fullElement = titleMatch[0];
            const placeholderText = titleMatch[1];

            if (formData.title && formData.title.trim()) {
                console.log('💼 [Contact Utils] Injecting title');
                result = simpleReplace(result, placeholderText, formData.title);
            } else {
                console.log('🙈 [Contact Utils] Title empty, hiding element');
                result = result.replace(fullElement, '');
            }
        }

        // 4. SUBTITLE/CREDENTIALS (Optional - hide if empty)
        const subtitleRegex = /<[^>]*class=["'][^"']*bc-contact-subtitle[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
        const subtitleMatch = subtitleRegex.exec(result);

        if (subtitleMatch) {
            const fullElement = subtitleMatch[0];
            const placeholderText = subtitleMatch[1];

            if (formData.subtitle && formData.subtitle.trim()) {
                console.log('📜 [Contact Utils] Injecting subtitle/credentials');
                result = simpleReplace(result, placeholderText, formData.subtitle);
            } else {
                console.log('🙈 [Contact Utils] Subtitle empty, hiding element');
                result = result.replace(fullElement, '');
            }
        }

        // 5. SLOGAN (Optional - hide if empty)
        const sloganRegex = /<[^>]*class=["'][^"']*bc-contact-slogan[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
        const sloganMatch = sloganRegex.exec(result);

        if (sloganMatch) {
            const fullElement = sloganMatch[0];
            const placeholderText = sloganMatch[1];

            if (formData.slogan && formData.slogan.trim()) {
                console.log('💬 [Contact Utils] Injecting slogan');
                result = simpleReplace(result, placeholderText, formData.slogan);
            } else {
                console.log('🙈 [Contact Utils] Slogan empty, hiding element');
                result = result.replace(fullElement, '');
            }
        }

        // 6. DESCRIPTOR (Optional - hide if empty)
        const descriptorRegex = /<[^>]*class=["'][^"']*bc-contact-descriptor[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
        const descriptorMatch = descriptorRegex.exec(result);

        if (descriptorMatch) {
            const fullElement = descriptorMatch[0];
            const placeholderText = descriptorMatch[1];

            if (formData.descriptor && formData.descriptor.trim()) {
                console.log('📝 [Contact Utils] Injecting descriptor');
                result = simpleReplace(result, placeholderText, formData.descriptor);
            } else {
                console.log('🙈 [Contact Utils] Descriptor empty, hiding element');
                result = result.replace(fullElement, '');
            }
        }

        // 7. YEAR ESTABLISHED (Optional - hide if empty)
        const establishedRegex = /<[^>]*class=["'][^"']*bc-contact-established[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
        const establishedMatch = establishedRegex.exec(result);

        if (establishedMatch) {
            const fullElement = establishedMatch[0];
            const placeholderText = establishedMatch[1];

            if (formData.yearEstablished && formData.yearEstablished.trim()) {
                console.log('📅 [Contact Utils] Injecting year established');
                result = simpleReplace(result, placeholderText, formData.yearEstablished);
            } else {
                console.log('🙈 [Contact Utils] Year established empty, hiding element');
                result = result.replace(fullElement, '');
            }
        }

        // ============================================================================
        // CONTACT METHODS - At least one phone OR email required
        // ============================================================================

        // 8. PHONES (At least one required by validation)
        if (formData.phones && formData.phones.length > 0) {
            console.log(`📱 [Contact Utils] Processing ${formData.phones.length} phone numbers`);
            const phoneRegex = /<div[^>]*class=["'][^"']*bc-contact-phone[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const phoneMatches = [];
            let match;

            // Collect all phone elements
            while ((match = phoneRegex.exec(result)) !== null) {
                phoneMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            // Get populated phones
            const populatedPhones = formData.phones.filter(p => p.value && p.value.trim());
            console.log(`  📝 Found ${populatedPhones.length} populated phone(s)`);

            // Process each phone slot
            phoneMatches.forEach((phoneMatch, slotIndex) => {
                const { fullElement, placeholderText } = phoneMatch;

                if (slotIndex < populatedPhones.length) {
                    // Inject populated phone
                    const phone = populatedPhones[slotIndex];
                    const formattedPhone = formatPhoneNumber(phone.value);
                    console.log(`  ✅ Phone ${slotIndex + 1}: ${phone.value} → ${formattedPhone}`);

                    // Preserve emoji/prefix
                    const emojiMatch = placeholderText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s☎️📱📞📠]+)/u);
                    const labelMatch = placeholderText.match(/^([A-Za-z]+:)\s*/);

                    let finalPhone = formattedPhone;
                    if (emojiMatch) {
                        finalPhone = emojiMatch[1] + formattedPhone;
                    } else if (labelMatch) {
                        finalPhone = labelMatch[1] + ' ' + formattedPhone;
                    }

                    result = simpleReplace(result, placeholderText, finalPhone);
                } else {
                    // Hide empty phone slot
                    console.log(`  🙈 No data for phone slot ${slotIndex + 1}, hiding element`);
                    result = result.replace(fullElement, '');
                }
            });
        }

        // 9. EMAILS (At least one required by validation)
        if (formData.emails && formData.emails.length > 0) {
            console.log(`✉️ [Contact Utils] Processing ${formData.emails.length} email addresses`);
            const emailRegex = /<div[^>]*class=["'][^"']*bc-contact-email[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const emailMatches = [];
            let match;

            // Collect all email elements
            while ((match = emailRegex.exec(result)) !== null) {
                emailMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            // Get populated emails
            const populatedEmails = formData.emails.filter(e => e.value && e.value.trim());
            console.log(`  📝 Found ${populatedEmails.length} populated email(s)`);

            // Process each email slot
            emailMatches.forEach((emailMatch, slotIndex) => {
                const { fullElement, placeholderText } = emailMatch;

                if (slotIndex < populatedEmails.length) {
                    // Inject populated email
                    const email = populatedEmails[slotIndex];
                    console.log(`  ✅ Email ${slotIndex + 1}: ${email.value}`);

                    // Preserve emoji/prefix
                    const emojiMatch = placeholderText.match(/^([\u{1F300}-\u{1F9FF}\s✉️]+)/u);
                    const labelMatch = placeholderText.match(/^([A-Za-z]+:)\s*/);

                    let finalEmail = email.value;
                    if (emojiMatch) {
                        finalEmail = emojiMatch[1] + email.value;
                    } else if (labelMatch) {
                        finalEmail = labelMatch[1] + ' ' + email.value;
                    }

                    result = simpleReplace(result, placeholderText, finalEmail);
                } else {
                    // Hide empty email slot
                    console.log(`  🙈 No data for email slot ${slotIndex + 1}, hiding element`);
                    result = result.replace(fullElement, '');
                }
            });
        }

        // ============================================================================
        // COMPLETELY OPTIONAL CONTACT METHODS - Hide all if empty
        // ============================================================================

        // 10. WEBSITES (Optional - hide if empty)
        if (formData.websites && formData.websites.length > 0) {
            console.log(`🌐 [Contact Utils] Processing ${formData.websites.length} websites`);
            const websiteRegex = /<div[^>]*class=["'][^"']*bc-contact-website[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const websiteMatches = [];
            let match;

            // Collect all website elements
            while ((match = websiteRegex.exec(result)) !== null) {
                websiteMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            // Get populated websites
            const populatedWebsites = formData.websites.filter(w => w.value && w.value.trim());
            console.log(`  📝 Found ${populatedWebsites.length} populated website(s)`);

            // Process each website slot
            websiteMatches.forEach((websiteMatch, slotIndex) => {
                const { fullElement, placeholderText } = websiteMatch;

                if (slotIndex < populatedWebsites.length) {
                    // Inject populated website
                    const website = populatedWebsites[slotIndex];
                    let cleanWebsite = website.value.trim().replace(/^https?:\/\//, '');
                    console.log(`  ✅ Website ${slotIndex + 1}: ${website.value}`);

                    // Preserve emoji/prefix
                    const emojiMatch = placeholderText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s🌐🌟]+)/u);

                    if (emojiMatch) {
                        cleanWebsite = emojiMatch[1] + cleanWebsite;
                    }

                    result = simpleReplace(result, placeholderText, cleanWebsite);
                } else {
                    // Hide empty website slot
                    console.log(`  🙈 No data for website slot ${slotIndex + 1}, hiding element`);
                    result = result.replace(fullElement, '');
                }
            });
        } else {
            // Hide all website elements if no websites provided
            console.log('🙈 [Contact Utils] No websites provided, hiding all website elements');
            const websiteRegex = /<div[^>]*class=["'][^"']*bc-contact-website[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            result = result.replace(websiteRegex, '');
        }

        // 11. ADDRESSES (Optional - hide if empty)
        if (formData.addresses && formData.addresses.length > 0) {
            console.log(`📍 [Contact Utils] Processing ${formData.addresses.length} addresses`);
            const addressRegex = /<div[^>]*class=["'][^"']*bc-contact-address[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const addressMatches = [];
            let match;

            // Collect all address elements
            while ((match = addressRegex.exec(result)) !== null) {
                addressMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            // Get populated addresses
            const populatedAddresses = formData.addresses.filter(a => a.value && a.value.trim());
            console.log(`  📝 Found ${populatedAddresses.length} populated address(es)`);

            // Process each address slot
            addressMatches.forEach((addressMatch, slotIndex) => {
                const { fullElement, placeholderText } = addressMatch;

                if (slotIndex < populatedAddresses.length) {
                    // Inject populated address
                    const address = populatedAddresses[slotIndex];
                    console.log(`  ✅ Address ${slotIndex + 1}: ${address.value}`);

                    // Preserve emoji/prefix
                    const emojiMatch = placeholderText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s📍🏢]+)/u);

                    let finalAddress = address.value;
                    if (emojiMatch) {
                        finalAddress = emojiMatch[1] + address.value;
                    }

                    result = simpleReplace(result, placeholderText, finalAddress);
                } else {
                    // Hide empty address slot
                    console.log(`  🙈 No data for address slot ${slotIndex + 1}, hiding element`);
                    result = result.replace(fullElement, '');
                }
            });
        } else {
            // Hide all address elements if no addresses provided
            console.log('🙈 [Contact Utils] No addresses provided, hiding all address elements');
            const addressRegex = /<div[^>]*class=["'][^"']*bc-contact-address[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            result = result.replace(addressRegex, '');
        }

        // 12. SOCIAL MEDIA (Optional - hide if empty)
        console.log('💼 [Contact Utils] Processing social media fields...');
        const socialRegex = /<div[^>]*class=["'][^"']*bc-contact-social[^"']*["'][^>]*>([^<]*)<\/div>/gi;
        const socialMatches = [];
        let match;

        // Collect all social media elements
        while ((match = socialRegex.exec(result)) !== null) {
            socialMatches.push({
                fullElement: match[0],
                placeholderText: match[1]
            });
        }

        if (socialMatches.length > 0) {
            console.log(`  📍 Found ${socialMatches.length} social media slot(s) in layout`);

            // Get populated social media entries
            const populatedSocial = formData.socialMedia?.filter(
                s => s.label && s.label.trim() && s.value && s.value.trim()
            ) || [];

            console.log(`  📝 Found ${populatedSocial.length} populated social media field(s)`);

            // Process each social media slot
            socialMatches.forEach((socialMatch, slotIndex) => {
                const { fullElement, placeholderText } = socialMatch;

                if (slotIndex < populatedSocial.length) {
                    // Inject populated social media
                    const social = populatedSocial[slotIndex];
                    let cleanSocial = social.value.trim().replace(/^https?:\/\//, '');
                    console.log(`  ✅ Social ${slotIndex + 1}: ${social.label} - ${social.value}`);

                    // Preserve emoji/prefix
                    const emojiMatch = placeholderText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s💼🔗🌐✨📱🐦💻📘]+)/u);

                    if (emojiMatch) {
                        cleanSocial = emojiMatch[1] + cleanSocial;
                    }

                    result = simpleReplace(result, placeholderText, cleanSocial);
                } else {
                    // Hide empty social media slot
                    console.log(`  🙈 No data for social slot ${slotIndex + 1}, hiding element`);
                    result = result.replace(fullElement, '');
                }
            });
        } else {
            console.log('  ℹ️ No social media slots found in layout');
        }

        console.log('✅ [Contact Utils] Injection complete with comprehensive hide-if-empty logic');
        return result;

    } catch (error) {
        console.error('❌ [Contact Utils] Error during injection:', error);
        console.error('Stack trace:', error);
        return layoutHtml;
    }
}

/**
 * VALIDATION HELPER - Enhanced with better logging
 */
export function validateContactInfo(formData: BusinessCardData): {
    isValid: boolean;
    errors: string[];
} {
    console.log('🔍 [Contact Utils] Validating contact information...');
    const errors: string[] = [];

    // Required: Full Name
    if (!formData.name || !formData.name.trim()) {
        errors.push('Full Name is required');
    }

    // Required: Company Name
    if (!formData.companyName || !formData.companyName.trim()) {
        errors.push('Company Name is required');
    }

    // Required: At least one phone OR email
    const hasPhone = formData.phones && formData.phones.some(p => p.value && p.value.trim());
    const hasEmail = formData.emails && formData.emails.some(e => e.value && e.value.trim());

    if (!hasPhone && !hasEmail) {
        errors.push('At least one phone number OR email address is required');
    }

    // Optional fields logging
    if (formData.title && formData.title.trim()) {
        console.log('  ✨ Title provided:', formData.title);
    }
    if (formData.subtitle && formData.subtitle.trim()) {
        console.log('  ✨ Subtitle/credentials provided:', formData.subtitle);
    }
    if (formData.slogan && formData.slogan.trim()) {
        console.log('  ✨ Slogan provided:', formData.slogan);
    }
    if (formData.descriptor && formData.descriptor.trim()) {
        console.log('  ✨ Descriptor provided:', formData.descriptor);
    }

    console.log(`${errors.length === 0 ? '✅' : '❌'} [Contact Utils] Validation complete: ${errors.length} error(s)`);

    if (errors.length > 0) {
        console.log('  ❌ Errors:', errors);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}