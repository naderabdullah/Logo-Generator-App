// FILE: src/app/utils/businessCardContactUtils.ts
// PURPOSE: Enhanced to handle bc-contact-slogan field from BC017+
// CHANGES: Added slogan injection support
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

        if (!openMatch) return null;

        const startIndex = openMatch.index! + openMatch[0].length;
        const afterOpen = html.substring(startIndex);
        const closeTagIndex = afterOpen.indexOf('</');

        if (closeTagIndex === -1) return null;

        const textContent = afterOpen.substring(0, closeTagIndex);
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
        if (!oldText || !newText) return html;

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
 * MAIN INJECTION FUNCTION - ENHANCED WITH SLOGAN SUPPORT
 */
export function injectContactInfo(
    layoutHtml: string,
    formData: BusinessCardData
): string {
    try {
        console.log('🚀 [Contact Utils] Starting SIMPLE text injection with slogan support');

        let result = layoutHtml;

        // 1. INJECT NAME
        if (formData.name && formData.name.trim()) {
            const placeholderName = extractTextBetweenTags(result, 'bc-contact-name');
            if (placeholderName) {
                result = simpleReplace(result, placeholderName, formData.name);
            }
        }

        // 2. INJECT TITLE
        if (formData.title && formData.title.trim()) {
            const placeholderTitle = extractTextBetweenTags(result, 'bc-contact-title');
            if (placeholderTitle) {
                result = simpleReplace(result, placeholderTitle, formData.title);
            }
        }

        // 3. INJECT SUBTITLE (credentials/degrees)
        if (formData.subtitle && formData.subtitle.trim()) {
            const placeholderSubtitle = extractTextBetweenTags(result, 'bc-contact-subtitle');
            if (placeholderSubtitle) {
                console.log('📜 [Contact Utils] Injecting subtitle/credentials');
                result = simpleReplace(result, placeholderSubtitle, formData.subtitle);
            }
        }

        // 4. INJECT COMPANY
        if (formData.companyName && formData.companyName.trim()) {
            const placeholderCompany = extractTextBetweenTags(result, 'bc-contact-company');
            if (placeholderCompany) {
                result = simpleReplace(result, placeholderCompany, formData.companyName);
            }
        }

        // 4b. INJECT SLOGAN (NEW - for BC017+)
        if (formData.slogan && formData.slogan.trim()) {
            const placeholderSlogan = extractTextBetweenTags(result, 'bc-contact-slogan');
            if (placeholderSlogan) {
                console.log('💬 [Contact Utils] Injecting slogan');
                result = simpleReplace(result, placeholderSlogan, formData.slogan);
            }
        } else {
            // Hide slogan element if no slogan provided
            const sloganRegex = /<[^>]*class=["'][^"']*bc-contact-slogan[^"']*["'][^>]*>([^<]*)<\/div>/i;
            const sloganMatch = sloganRegex.exec(layoutHtml);
            if (sloganMatch) {
                console.log('🙈 [Contact Utils] Slogan empty, hiding element');
                result = result.replace(sloganMatch[0], '');
            }
        }

        // 5. INJECT PHONES
        if (formData.phones && formData.phones.length > 0) {
            const phoneRegex = /<[^>]*class=["'][^"']*bc-contact-phone[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            let match;
            let phoneIndex = 0;

            while ((match = phoneRegex.exec(layoutHtml)) !== null && phoneIndex < formData.phones.length) {
                const placeholderPhone = match[1];
                const actualPhone = formData.phones[phoneIndex];

                if (actualPhone && actualPhone.value) {
                    const formattedPhone = formatPhoneNumber(actualPhone.value);

                    // Preserve emoji/prefix - expanded to cover all phone-related emojis
                    // Covers: 📱 (mobile), ☎️ (phone), 📞 (telephone), 📠 (fax)
                    const emojiMatch = placeholderPhone.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s☎️📱📞📠]+)/u);
                    const labelMatch = placeholderPhone.match(/^([A-Za-z]+:)\s*/);

                    let finalPhone = formattedPhone;
                    if (emojiMatch) {
                        finalPhone = emojiMatch[1] + formattedPhone;
                    } else if (labelMatch) {
                        finalPhone = labelMatch[1] + ' ' + formattedPhone;
                    }

                    result = simpleReplace(result, placeholderPhone, finalPhone);
                }
                phoneIndex++;
            }
        }

        // 6. INJECT EMAILS
        if (formData.emails && formData.emails.length > 0) {
            const emailRegex = /<[^>]*class=["'][^"']*bc-contact-email[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            let match;
            let emailIndex = 0;

            while ((match = emailRegex.exec(layoutHtml)) !== null && emailIndex < formData.emails.length) {
                const placeholderEmail = match[1];
                const actualEmail = formData.emails[emailIndex];

                if (actualEmail && actualEmail.value) {
                    // Preserve emoji/prefix
                    const emojiMatch = placeholderEmail.match(/^([\u{1F300}-\u{1F9FF}\s✉️]+)/u);
                    const labelMatch = placeholderEmail.match(/^([A-Za-z]+:)\s*/);

                    let finalEmail = actualEmail.value;
                    if (emojiMatch) {
                        finalEmail = emojiMatch[1] + actualEmail.value;
                    } else if (labelMatch) {
                        finalEmail = labelMatch[1] + ' ' + actualEmail.value;
                    }

                    result = simpleReplace(result, placeholderEmail, finalEmail);
                }
                emailIndex++;
            }
        }

        // 7. INJECT WEBSITE
        if (formData.websites && formData.websites.length > 0 && formData.websites[0].value) {
            const websiteRegex = /<[^>]*class=["'][^"']*bc-contact-website[^"']*["'][^>]*>([^<]*)<\/div>/i;
            const match = websiteRegex.exec(layoutHtml);

            if (match) {
                const placeholderWebsite = match[1];
                const actualWebsite = formData.websites[0].value;

                // Clean website URL
                let cleanWebsite = actualWebsite.trim().replace(/^https?:\/\//, '');

                // Preserve emoji/prefix - expanded to include more emoji ranges
                // Covers: sparkles ✨, globe 🌐🌍, stars ⭐🌟, and other common website emojis
                const emojiMatch = placeholderWebsite.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s🌐🌍✨⭐🌟]+)/u);

                if (emojiMatch) {
                    cleanWebsite = emojiMatch[1] + cleanWebsite;
                }

                result = simpleReplace(result, placeholderWebsite, cleanWebsite);
            }
        }

        // 8. INJECT YEAR ESTABLISHED (with hide if empty)
        const establishedRegex = /<[^>]*class=["'][^"']*bc-contact-established[^"']*["'][^>]*>([^<]*)<\/div>/i;
        const establishedMatch = establishedRegex.exec(layoutHtml);

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

        console.log('✅ [Contact Utils] Simple text injection complete');
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
    const errors: string[] = [];

    if (!formData.name || !formData.name.trim()) {
        errors.push('Name is required');
    }

    if (!formData.companyName || !formData.companyName.trim()) {
        errors.push('Company name is required');
    }

    if (formData.subtitle && formData.subtitle.trim()) {
        console.log('✨ [Contact Utils] Subtitle/credentials provided:', formData.subtitle);
    }

    if (formData.slogan && formData.slogan.trim()) {
        console.log('💬 [Contact Utils] Slogan provided:', formData.slogan);
    }

    const hasPhone = formData.phones && formData.phones.some(p => p.value && p.value.trim());
    const hasEmail = formData.emails && formData.emails.some(e => e.value && e.value.trim());
    const hasWebsite = formData.websites && formData.websites.some(w => w.value && w.value.trim());

    if (!hasPhone && !hasEmail && !hasWebsite) {
        errors.push('At least one contact method (phone, email, or website) is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}