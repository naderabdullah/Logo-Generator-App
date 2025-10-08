// FILE: src/app/utils/businessCardContactUtils.ts
// PURPOSE: Enhanced with social media injection for BC019+ layouts
// CHANGES:
//   - Added social media injection (bc-contact-social class)
//   - Matches platform via data-social-platform attribute
//   - Pulls from formData.socialMedia array by label
//   - Preserves emojis and formatting
//   - Comprehensive logging for BC018-BC020 debugging
// ACTION: FULL FILE REPLACEMENT - READY FOR CLEAN SWAP

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
 * MAIN INJECTION FUNCTION - ENHANCED WITH SOCIAL MEDIA SUPPORT
 * Now properly maps website + social media from correct form fields
 */
export function injectContactInfo(
    layoutHtml: string,
    formData: BusinessCardData
): string {
    try {
        console.log('🚀 [Contact Utils] Starting injection with social media support (BC019+)');
        console.log('📋 [Contact Utils] Form data summary:', {
            name: formData.name,
            title: formData.title,
            company: formData.companyName,
            subtitle: formData.subtitle,
            slogan: formData.slogan,
            phones: formData.phones.length,
            emails: formData.emails.length,
            websites: formData.websites.length,
            socialMedia: formData.socialMedia.length
        });

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

        // 3. INJECT SUBTITLE (credentials/degrees) - Used in BC012, BC020
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

        // 4b. INJECT SLOGAN (for BC017+ layouts)
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

        // 5. INJECT PHONES - Enhanced with better logging
        if (formData.phones && formData.phones.length > 0) {
            console.log(`📱 [Contact Utils] Processing ${formData.phones.length} phone numbers`);
            const phoneRegex = /<[^>]*class=["'][^"']*bc-contact-phone[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            let match;
            let phoneIndex = 0;

            while ((match = phoneRegex.exec(layoutHtml)) !== null && phoneIndex < formData.phones.length) {
                const placeholderPhone = match[1];
                const actualPhone = formData.phones[phoneIndex];

                if (actualPhone && actualPhone.value) {
                    const formattedPhone = formatPhoneNumber(actualPhone.value);
                    console.log(`  Phone ${phoneIndex + 1}: ${actualPhone.value} → ${formattedPhone}`);

                    // Preserve emoji/prefix - expanded to cover all phone-related emojis
                    // Covers: 📱 (mobile), ☎️ (phone), 📞 (telephone), 📠 (fax)
                    const emojiMatch = placeholderPhone.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s☎️📱📞📠]+)/u);
                    const labelMatch = placeholderPhone.match(/^([A-Za-z]+:)\s*/);

                    let finalPhone = formattedPhone;
                    if (emojiMatch) {
                        finalPhone = emojiMatch[1] + formattedPhone;
                        console.log(`  ✨ Preserved emoji: "${emojiMatch[1]}"`);
                    } else if (labelMatch) {
                        finalPhone = labelMatch[1] + ' ' + formattedPhone;
                        console.log(`  ✨ Preserved label: "${labelMatch[1]}"`);
                    }

                    result = simpleReplace(result, placeholderPhone, finalPhone);
                }
                phoneIndex++;
            }
        }

        // 6. INJECT EMAILS - Enhanced with better logging
        if (formData.emails && formData.emails.length > 0) {
            console.log(`✉️ [Contact Utils] Processing ${formData.emails.length} email addresses`);
            const emailRegex = /<[^>]*class=["'][^"']*bc-contact-email[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            let match;
            let emailIndex = 0;

            while ((match = emailRegex.exec(layoutHtml)) !== null && emailIndex < formData.emails.length) {
                const placeholderEmail = match[1];
                const actualEmail = formData.emails[emailIndex];

                if (actualEmail && actualEmail.value) {
                    console.log(`  Email ${emailIndex + 1}: ${actualEmail.value}`);

                    // Preserve emoji/prefix
                    const emojiMatch = placeholderEmail.match(/^([\u{1F300}-\u{1F9FF}\s✉️]+)/u);
                    const labelMatch = placeholderEmail.match(/^([A-Za-z]+:)\s*/);

                    let finalEmail = actualEmail.value;
                    if (emojiMatch) {
                        finalEmail = emojiMatch[1] + actualEmail.value;
                        console.log(`  ✨ Preserved emoji: "${emojiMatch[1]}"`);
                    } else if (labelMatch) {
                        finalEmail = labelMatch[1] + ' ' + actualEmail.value;
                        console.log(`  ✨ Preserved label: "${labelMatch[1]}"`);
                    }

                    result = simpleReplace(result, placeholderEmail, finalEmail);
                }
                emailIndex++;
            }
        }

        // 7. INJECT WEBSITES - Standard website fields only
        if (formData.websites && formData.websites.length > 0) {
            console.log(`🌐 [Contact Utils] Processing ${formData.websites.length} website URLs`);
            const websiteRegex = /<[^>]*class=["'][^"']*bc-contact-website[^"']*["'][^>]*>([^<]*)<\/div>/gi;
            let match;
            let websiteIndex = 0;

            while ((match = websiteRegex.exec(layoutHtml)) !== null && websiteIndex < formData.websites.length) {
                const placeholderWebsite = match[1];
                const actualWebsite = formData.websites[websiteIndex];

                if (actualWebsite && actualWebsite.value) {
                    console.log(`  Website ${websiteIndex + 1}: ${actualWebsite.value}`);

                    // Clean website URL - remove protocol
                    let cleanWebsite = actualWebsite.value.trim().replace(/^https?:\/\//, '');

                    // Preserve emoji/prefix - expanded to include more emoji ranges
                    // Covers: sparkles ✨, globe 🌐🌍, stars ⭐🌟, and other common website emojis
                    const emojiMatch = placeholderWebsite.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s🌐🌍✨⭐🌟]+)/u);

                    if (emojiMatch) {
                        cleanWebsite = emojiMatch[1] + cleanWebsite;
                        console.log(`  ✨ Preserved emoji: "${emojiMatch[1]}"`);
                    }

                    result = simpleReplace(result, placeholderWebsite, cleanWebsite);
                }
                websiteIndex++;
            }

            if (websiteIndex > 0) {
                console.log(`✅ [Contact Utils] Injected ${websiteIndex} website fields`);
            }
        }

        // 8. INJECT SOCIAL MEDIA - NEW FOR BC019+
        // Matches platform via data-social-platform attribute
        if (formData.socialMedia && formData.socialMedia.length > 0) {
            console.log(`💼 [Contact Utils] Processing social media fields (BC019+ feature)`);

            // Find all bc-contact-social divs with their data-social-platform attributes
            const socialRegex = /<div[^>]*class=["'][^"']*bc-contact-social[^"']*["'][^>]*data-social-platform=["']([^"']+)["'][^>]*>([^<]*)<\/div>/gi;
            let match;
            let socialInjectionCount = 0;

            while ((match = socialRegex.exec(layoutHtml)) !== null) {
                const platform = match[1]; // e.g., "linkedin", "twitter"
                const placeholderText = match[2]; // The text to replace

                console.log(`  🔍 Looking for social platform: ${platform}`);

                // Find matching platform in formData.socialMedia (case-insensitive)
                const socialEntry = formData.socialMedia.find(
                    s => s.label && s.label.toLowerCase() === platform.toLowerCase()
                );

                if (socialEntry && socialEntry.value) {
                    console.log(`  ✅ Found ${platform}: ${socialEntry.value}`);

                    // Clean social media URL - remove protocol
                    let cleanSocial = socialEntry.value.trim().replace(/^https?:\/\//, '');

                    // Preserve emoji/prefix - covers briefcase 💼, link 🔗, and other social emojis
                    const emojiMatch = placeholderText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s💼🔗🌐]+)/u);

                    if (emojiMatch) {
                        cleanSocial = emojiMatch[1] + cleanSocial;
                        console.log(`  ✨ Preserved emoji: "${emojiMatch[1]}"`);
                    }

                    result = simpleReplace(result, placeholderText, cleanSocial);
                    socialInjectionCount++;
                } else {
                    console.warn(`  ⚠️ No ${platform} entry found in form data`);
                }
            }

            if (socialInjectionCount > 0) {
                console.log(`✅ [Contact Utils] Injected ${socialInjectionCount} social media fields`);
            }
        }

        // 9. INJECT YEAR ESTABLISHED (with hide if empty)
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

        console.log('✅ [Contact Utils] Injection complete with social media support');
        return result;

    } catch (error) {
        console.error('❌ [Contact Utils] Error during injection:', error);
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

    console.log(`${errors.length === 0 ? '✅' : '❌'} [Contact Utils] Validation complete: ${errors.length} errors`);

    return {
        isValid: errors.length === 0,
        errors
    };
}