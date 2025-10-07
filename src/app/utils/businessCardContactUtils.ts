// FILE: src/app/utils/businessCardContactUtils.ts
// PURPOSE: SIMPLE TEXT-ONLY REPLACEMENT - No HTML manipulation whatsoever
// STRATEGY: Extract placeholder text, do simple string.replace(), that's it

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
        console.error('Error formatting phone:', error);
        return phone;
    }
}

/**
 * EXTRACT TEXT BETWEEN TAGS
 * Finds text content between HTML tags without parsing
 */
function extractTextBetweenTags(html: string, className: string): string | null {
    try {
        // Find the opening tag with this class
        const openTagRegex = new RegExp(`<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>`, 'i');
        const openMatch = html.match(openTagRegex);

        if (!openMatch) return null;

        const startIndex = openMatch.index! + openMatch[0].length;

        // Find the next closing tag after the opening tag
        const afterOpen = html.substring(startIndex);
        const closeTagIndex = afterOpen.indexOf('</');

        if (closeTagIndex === -1) return null;

        const textContent = afterOpen.substring(0, closeTagIndex);
        return textContent;
    } catch (error) {
        console.error(`Error extracting text for class ${className}:`, error);
        return null;
    }
}

/**
 * SIMPLE TEXT REPLACEMENT
 * Just finds old text and replaces with new text - nothing fancy
 */
function simpleReplace(html: string, oldText: string, newText: string): string {
    try {
        if (!oldText || !newText) return html;

        console.log(`🔄 [Contact Utils] Simple replace: "${oldText}" → "${newText}"`);

        // Do simple string replacement
        const result = html.replace(oldText, newText);

        if (result !== html) {
            console.log(`✅ [Contact Utils] Replacement successful`);
        } else {
            console.warn(`⚠️ [Contact Utils] Text not found: "${oldText}"`);
        }

        return result;
    } catch (error) {
        console.error('Error in simple replace:', error);
        return html;
    }
}

/**
 * MAIN INJECTION FUNCTION - SIMPLE TEXT SWAPS ONLY
 */
export function injectContactInfo(
    layoutHtml: string,
    formData: BusinessCardData
): string {
    try {
        console.log('🚀 [Contact Utils] Starting SIMPLE text injection');

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

        // 3. INJECT SUBTITLE/CREDENTIALS (with hide if empty)
        const subtitleRegex = /<[^>]*class=["'][^"']*bc-contact-subtitle[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
        const subtitleMatch = subtitleRegex.exec(layoutHtml);

        if (subtitleMatch) {
            const fullElement = subtitleMatch[0]; // Full element including tags
            const placeholderSubtitle = subtitleMatch[1]; // Text inside element

            if (formData.subtitle && formData.subtitle.trim()) {
                // User provided subtitle/credentials - replace text
                console.log('🎓 [Contact Utils] Injecting subtitle/credentials');
                console.log(`🔄 [Contact Utils] Replacing text for selector: ".bc-contact-subtitle"`);
                result = simpleReplace(result, placeholderSubtitle, formData.subtitle);
                console.log(`✅ [Contact Utils] Replaced "${placeholderSubtitle}" → "${formData.subtitle}"`);
            } else {
                // User left empty - HIDE the entire element
                console.log('🙈 [Contact Utils] Subtitle empty, hiding element');
                result = result.replace(fullElement, '');
            }
        } else {
            console.log('ℹ️ [Contact Utils] No subtitle field in this layout');
        }

        // 4. INJECT COMPANY
        if (formData.companyName && formData.companyName.trim()) {
            const placeholderCompany = extractTextBetweenTags(result, 'bc-contact-company');
            if (placeholderCompany) {
                result = simpleReplace(result, placeholderCompany, formData.companyName);
            }
        }

        // 5. INJECT PHONES - Extract placeholder then replace
        if (formData.phones && formData.phones.length > 0) {
            // Find all phone placeholders
            const phoneRegex = /<[^>]*class=["'][^"']*bc-contact-phone[^"']*["'][^>]*>([^<]*)<\/[^>]+>/gi;
            let match;
            let phoneIndex = 0;

            while ((match = phoneRegex.exec(layoutHtml)) !== null && phoneIndex < formData.phones.length) {
                const placeholderPhone = match[1]; // The text between tags
                const actualPhone = formData.phones[phoneIndex];

                if (actualPhone && actualPhone.value) {
                    const formattedPhone = formatPhoneNumber(actualPhone.value);

                    // Check if placeholder has emoji/prefix
                    const emojiMatch = placeholderPhone.match(/^([\u{1F300}-\u{1F9FF}\s☎️📱📞]+)/u);
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

        // 6. INJECT EMAILS - Extract placeholder then replace
        if (formData.emails && formData.emails.length > 0) {
            const emailRegex = /<[^>]*class=["'][^"']*bc-contact-email[^"']*["'][^>]*>([^<]*)<\/[^>]+>/gi;
            let match;
            let emailIndex = 0;

            while ((match = emailRegex.exec(layoutHtml)) !== null && emailIndex < formData.emails.length) {
                const placeholderEmail = match[1];
                const actualEmail = formData.emails[emailIndex];

                if (actualEmail && actualEmail.value) {
                    // Check if placeholder has emoji/prefix
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

        // 7. INJECT WEBSITE - Extract placeholder then replace
        if (formData.websites && formData.websites.length > 0 && formData.websites[0].value) {
            const websiteRegex = /<[^>]*class=["'][^"']*bc-contact-website[^"']*["'][^>]*>([^<]*)<\/[^>]+>/i;
            const match = websiteRegex.exec(layoutHtml);

            if (match) {
                const placeholderWebsite = match[1];
                const actualWebsite = formData.websites[0].value;

                // Clean website URL
                let cleanWebsite = actualWebsite.trim().replace(/^https?:\/\//, '');

                // Check if placeholder has emoji/prefix
                const emojiMatch = placeholderWebsite.match(/^([\u{1F300}-\u{1F9FF}\s🌐🌍]+)/u);

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
                    const fullElement = establishedMatch[0]; // Full div including tags
                    const placeholderText = establishedMatch[1]; // Text inside div

                    if (formData.yearEstablished && formData.yearEstablished.trim()) {
                        // User provided data - replace text
                        console.log('📅 [Contact Utils] Injecting year established');
                        result = simpleReplace(result, placeholderText, formData.yearEstablished);
                    } else {
                        // User left empty - HIDE the entire element
                        console.log('🙈 [Contact Utils] Year established empty, hiding element');
                        result = result.replace(fullElement, '');
                    }
                } else {
                    console.log('ℹ️ [Contact Utils] No established field in this layout');
                }

        console.log('✅ [Contact Utils] Simple text injection complete');
        return result;

    } catch (error) {
        console.error('❌ [Contact Utils] Error during injection:', error);
        return layoutHtml; // Return original on error
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

    // Subtitle is optional - no validation needed
    if (formData.subtitle && formData.subtitle.trim()) {
        console.log('✨ [Contact Utils] Subtitle/credentials provided:', formData.subtitle);
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