// FILE: src/app/utils/businessCardContactUtils.ts
// PURPOSE: FIXED bracket label support - checks brackets FIRST
// CHANGES: Reordered pattern matching to prioritize bracket labels
// ACTION: FULL FILE REPLACEMENT

import { BusinessCardData } from '../../../types/businessCard';

/**
 * FORMAT PHONE NUMBER
 */
export function formatPhoneNumber(phone: string): string {
    try {
        if (!phone || !phone.trim()) return '';

        console.log(`📞 [Contact Utils] Formatting phone: "${phone}"`);
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 11 && cleaned[0] === '1') {
            return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
        } else if (cleaned.length === 7) {
            return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
        }

        console.log(`⚠️ [Contact Utils] Non-standard phone format, returning as-is`);
        return phone;
    } catch (error) {
        console.error('❌ [Contact Utils] Error formatting phone:', error);
        return phone;
    }
}

/**
 * EXTRACT TEXT BETWEEN TAGS
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

        if (closeTagIndex === -1) {
            console.warn(`⚠️ [Contact Utils] No closing tag found for ${className}`);
            return null;
        }

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

        console.log(`🔄 [Contact Utils] Replace: "${oldText}" → "${newText}"`);

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
 * APPLY PREFIX/LABEL TO VALUE
 * Checks patterns in priority order: brackets → emojis → text labels
 * FIXED: Bracket labels now checked FIRST
 */
function applyPrefix(placeholderText: string, newValue: string): string {
    try {
        // PRIORITY 1: Bracket-style label [LABEL]
        const bracketMatch = placeholderText.match(/^(\[[A-Z]+\])\s*/);
        if (bracketMatch) {
            const result = `${bracketMatch[1]} ${newValue}`;
            console.log(`  🔧 Applied bracket label: "${result}"`);
            return result;
        }

        // PRIORITY 2: Emoji prefix
        const emojiMatch = placeholderText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s☎️📱📞📠✉️📧💌🌐🌍🌎📍🏢🏠🏛️💼🔗✨]+)/u);
        if (emojiMatch) {
            const result = emojiMatch[1] + newValue;
            console.log(`  🔧 Applied emoji prefix: "${result}"`);
            return result;
        }

        // PRIORITY 3: Text label (e.g., "Mobile:")
        const labelMatch = placeholderText.match(/^([A-Za-z]+:)\s*/);
        if (labelMatch) {
            const result = `${labelMatch[1]} ${newValue}`;
            console.log(`  🔧 Applied text label: "${result}"`);
            return result;
        }

        // No prefix found, return value as-is
        console.log(`  ℹ️ No prefix found, using value as-is`);
        return newValue;

    } catch (error) {
        console.error('❌ [Contact Utils] Error applying prefix:', error);
        return newValue;
    }
}

/**
 * MAIN INJECTION FUNCTION - FIXED BRACKET LABEL SUPPORT
 */
export function injectContactInfo(
    layoutHtml: string,
    formData: BusinessCardData
): string {
    try {
        console.log('🚀 [Contact Utils] Starting injection with FIXED bracket support');
        console.log('📋 [Contact Utils] Form data:', {
            name: formData.name,
            title: formData.title,
            company: formData.companyName,
            phones: formData.phones?.length || 0,
            emails: formData.emails?.length || 0,
            websites: formData.websites?.length || 0
        });

        let result = layoutHtml;

        // ============================================================================
        // REQUIRED FIELDS
        // ============================================================================

        // 1. NAME
        if (formData.name && formData.name.trim()) {
            const placeholderName = extractTextBetweenTags(result, 'bc-contact-name');
            if (placeholderName) {
                console.log('👤 [Contact Utils] Injecting name');
                result = simpleReplace(result, placeholderName, formData.name);
            }
        }

        // 2. COMPANY
        if (formData.companyName && formData.companyName.trim()) {
            const placeholderCompany = extractTextBetweenTags(result, 'bc-contact-company');
            if (placeholderCompany) {
                console.log('🏢 [Contact Utils] Injecting company');
                result = simpleReplace(result, placeholderCompany, formData.companyName);
            }
        }

        // ============================================================================
        // OPTIONAL FIELDS - Hide if empty
        // ============================================================================

        // 3. TITLE
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

        // 4. SUBTITLE
        const subtitleRegex = /<[^>]*class=["'][^"']*bc-contact-subtitle[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
        const subtitleMatch = subtitleRegex.exec(result);

        if (subtitleMatch) {
            const fullElement = subtitleMatch[0];
            const placeholderText = subtitleMatch[1];

            if (formData.subtitle && formData.subtitle.trim()) {
                console.log('📜 [Contact Utils] Injecting subtitle');
                result = simpleReplace(result, placeholderText, formData.subtitle);
            } else {
                console.log('🙈 [Contact Utils] Subtitle empty, hiding element');
                result = result.replace(fullElement, '');
            }
        }

        // 5. SLOGAN
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

        // 6. DESCRIPTOR
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

        // 7. YEAR ESTABLISHED
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
        // CONTACT METHODS - FIXED with bracket support
        // ============================================================================

        // 8. PHONES
        if (formData.phones && formData.phones.length > 0) {
            console.log(`📱 [Contact Utils] Processing ${formData.phones.length} phone(s)`);
            const phoneRegex = /<div[^>]*class=["'][^"']*bc-contact-phone[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const phoneMatches = [];
            let match;

            while ((match = phoneRegex.exec(result)) !== null) {
                phoneMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            const populatedPhones = formData.phones.filter(p => p.value && p.value.trim());
            console.log(`  📝 ${populatedPhones.length} populated phone(s)`);

            phoneMatches.forEach((phoneMatch, slotIndex) => {
                const { fullElement, placeholderText } = phoneMatch;

                if (slotIndex < populatedPhones.length) {
                    const phone = populatedPhones[slotIndex];
                    const formattedPhone = formatPhoneNumber(phone.value);
                    console.log(`  ✅ Phone ${slotIndex + 1}: ${phone.value} → ${formattedPhone}`);

                    // Apply prefix (brackets checked FIRST now)
                    const finalPhone = applyPrefix(placeholderText, formattedPhone);
                    result = simpleReplace(result, placeholderText, finalPhone);
                } else {
                    console.log(`  🙈 Phone slot ${slotIndex + 1} empty, hiding`);
                    result = result.replace(fullElement, '');
                }
            });
        }

        // 9. EMAILS
        if (formData.emails && formData.emails.length > 0) {
            console.log(`✉️ [Contact Utils] Processing ${formData.emails.length} email(s)`);
            const emailRegex = /<div[^>]*class=["'][^"']*bc-contact-email[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const emailMatches = [];
            let match;

            while ((match = emailRegex.exec(result)) !== null) {
                emailMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            const populatedEmails = formData.emails.filter(e => e.value && e.value.trim());
            console.log(`  📝 ${populatedEmails.length} populated email(s)`);

            emailMatches.forEach((emailMatch, slotIndex) => {
                const { fullElement, placeholderText } = emailMatch;

                if (slotIndex < populatedEmails.length) {
                    const email = populatedEmails[slotIndex];
                    console.log(`  ✅ Email ${slotIndex + 1}: ${email.value}`);

                    // Apply prefix (brackets checked FIRST now)
                    const finalEmail = applyPrefix(placeholderText, email.value);
                    result = simpleReplace(result, placeholderText, finalEmail);
                } else {
                    console.log(`  🙈 Email slot ${slotIndex + 1} empty, hiding`);
                    result = result.replace(fullElement, '');
                }
            });
        }

        // 10. ADDRESSES
        if (formData.addresses && formData.addresses.length > 0) {
            console.log(`📍 [Contact Utils] Processing ${formData.addresses.length} address(es)`);
            const addressRegex = /<div[^>]*class=["'][^"']*bc-contact-address[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const addressMatches = [];
            let match;

            while ((match = addressRegex.exec(result)) !== null) {
                addressMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            const populatedAddresses = formData.addresses.filter(a => a.value && a.value.trim());
            console.log(`  📝 ${populatedAddresses.length} populated address(es)`);

            addressMatches.forEach((addressMatch, slotIndex) => {
                const { fullElement, placeholderText } = addressMatch;

                if (slotIndex < populatedAddresses.length) {
                    const address = populatedAddresses[slotIndex];
                    console.log(`  ✅ Address ${slotIndex + 1}: ${address.value}`);

                    // Apply prefix (emoji for addresses)
                    const finalAddress = applyPrefix(placeholderText, address.value);
                    result = simpleReplace(result, placeholderText, finalAddress);
                } else {
                    console.log(`  🙈 Address slot ${slotIndex + 1} empty, hiding`);
                    result = result.replace(fullElement, '');
                }
            });
        } else {
            console.log('🙈 [Contact Utils] No addresses, hiding all address elements');
            const addressRegex = /<div[^>]*class=["'][^"']*bc-contact-address[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            result = result.replace(addressRegex, '');
        }

        // 11. WEBSITES
        if (formData.websites && formData.websites.length > 0) {
            console.log(`🌐 [Contact Utils] Processing ${formData.websites.length} website(s)`);
            const websiteRegex = /<div[^>]*class=["'][^"']*bc-contact-website[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const websiteMatches = [];
            let match;

            while ((match = websiteRegex.exec(result)) !== null) {
                websiteMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            const populatedWebsites = formData.websites.filter(w => w.value && w.value.trim());
            console.log(`  📝 ${populatedWebsites.length} populated website(s)`);

            websiteMatches.forEach((websiteMatch, slotIndex) => {
                const { fullElement, placeholderText } = websiteMatch;

                if (slotIndex < populatedWebsites.length) {
                    const website = populatedWebsites[slotIndex];
                    const cleanWebsite = website.value.replace(/^https?:\/\//, '');
                    console.log(`  ✅ Website ${slotIndex + 1}: ${cleanWebsite}`);

                    // Apply prefix (brackets checked FIRST now)
                    const finalWebsite = applyPrefix(placeholderText, cleanWebsite);
                    result = simpleReplace(result, placeholderText, finalWebsite);
                } else {
                    console.log(`  🙈 Website slot ${slotIndex + 1} empty, hiding`);
                    result = result.replace(fullElement, '');
                }
            });
        } else {
            console.log('  ℹ️ No websites provided');
        }

        // 12. SOCIAL MEDIA
        if (formData.socialMedia && formData.socialMedia.length > 0) {
            console.log(`💼 [Contact Utils] Processing ${formData.socialMedia.length} social handle(s)`);
            const socialRegex = /<div[^>]*class=["'][^"']*bc-contact-social[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            const socialMatches = [];
            let match;

            while ((match = socialRegex.exec(result)) !== null) {
                socialMatches.push({
                    fullElement: match[0],
                    placeholderText: match[1]
                });
            }

            const populatedSocial = formData.socialMedia.filter(s => s.value && s.value.trim());
            console.log(`  📝 ${populatedSocial.length} populated social handle(s)`);

            socialMatches.forEach((socialMatch, slotIndex) => {
                const { fullElement, placeholderText } = socialMatch;

                if (slotIndex < populatedSocial.length) {
                    const social = populatedSocial[slotIndex];
                    const cleanSocial = social.value.replace(/^https?:\/\//, '');
                    console.log(`  ✅ Social ${slotIndex + 1}: ${cleanSocial}`);

                    // Apply prefix (emoji for social)
                    const finalSocial = applyPrefix(placeholderText, cleanSocial);
                    result = simpleReplace(result, placeholderText, finalSocial);
                } else {
                    console.log(`  🙈 Social slot ${slotIndex + 1} empty, hiding`);
                    result = result.replace(fullElement, '');
                }
            });
        } else {
            console.log('  ℹ️ No social media provided');
        }

        console.log('✅ [Contact Utils] Injection complete (bracket labels FIXED)');
        return result;

    } catch (error) {
        console.error('❌ [Contact Utils] Error during injection:', error);
        return layoutHtml;
    }
}

/**
 * VALIDATION HELPER
 */
export function validateContactInfo(formData: BusinessCardData): {
    isValid: boolean;
    errors: string[];
} {
    console.log('🔍 [Contact Utils] Validating contact info');
    const errors: string[] = [];

    if (!formData.name || !formData.name.trim()) {
        errors.push('Full Name is required');
    }

    if (!formData.companyName || !formData.companyName.trim()) {
        errors.push('Company Name is required');
    }

    const hasPhone = formData.phones && formData.phones.some(p => p.value && p.value.trim());
    const hasEmail = formData.emails && formData.emails.some(e => e.value && e.value.trim());

    if (!hasPhone && !hasEmail) {
        errors.push('At least one phone number OR email address is required');
    }

    console.log(`${errors.length === 0 ? '✅' : '❌'} Validation: ${errors.length} error(s)`);

    return {
        isValid: errors.length === 0,
        errors
    };
}