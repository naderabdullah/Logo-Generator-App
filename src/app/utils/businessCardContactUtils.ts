// FILE: src/app/utils/businessCardContactUtils.ts
// PURPOSE: Handle dynamic injection of contact information into business card layouts
// STRATEGY: Text-only replacement (no DOM node swapping) with comprehensive edge case handling

import { BusinessCardData } from '../../../types/businessCard';

/**
 * FORMAT PHONE NUMBER
 * Auto-formats phone numbers to (555) 123-4567 or +1 (555) 123-4567
 */
export function formatPhoneNumber(phone: string): string {
    try {
        console.log(`📞 [Contact Utils] Formatting phone: "${phone}"`);

        if (!phone || !phone.trim()) {
            console.warn('⚠️ [Contact Utils] Empty phone number provided');
            return '';
        }

        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Format based on length
        if (cleaned.length === 10) {
            // US format: (555) 123-4567
            const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            console.log(`✅ [Contact Utils] Formatted 10-digit: ${formatted}`);
            return formatted;
        } else if (cleaned.length === 11 && cleaned[0] === '1') {
            // US with country code: +1 (555) 123-4567
            const formatted = cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
            console.log(`✅ [Contact Utils] Formatted 11-digit: ${formatted}`);
            return formatted;
        } else if (cleaned.length === 7) {
            // Local format: 123-4567
            const formatted = cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
            console.log(`✅ [Contact Utils] Formatted 7-digit: ${formatted}`);
            return formatted;
        } else {
            // Return original if can't format
            console.warn(`⚠️ [Contact Utils] Cannot format ${cleaned.length}-digit phone, returning original`);
            return phone;
        }
    } catch (error) {
        console.error('❌ [Contact Utils] Error formatting phone:', error);
        return phone; // Return original on error
    }
}

/**
 * EXTRACT PREFIX FROM PLACEHOLDER
 * Detects and extracts emoji or label prefix from placeholder text
 * Examples: "📱 (555)..." → "📱 ", "Mobile: (555)..." → "Mobile: ", "Tel: " → "Tel: "
 */
function extractPrefix(placeholderText: string): { prefix: string; hasEmoji: boolean; hasLabel: boolean } {
    try {
        const trimmed = placeholderText.trim();

        // Check for emoji at start (common emojis: 📱📞✉️🌐💼)
        const emojiMatch = trimmed.match(/^([\u{1F300}-\u{1F9FF}])/u);
        if (emojiMatch) {
            const prefix = emojiMatch[1] + ' ';
            console.log(`🎨 [Contact Utils] Detected emoji prefix: "${prefix}"`);
            return { prefix, hasEmoji: true, hasLabel: false };
        }

        // Check for label prefix (e.g., "Mobile:", "Email:", "Tel:")
        const labelMatch = trimmed.match(/^([A-Za-z]+:)\s*/);
        if (labelMatch) {
            const prefix = labelMatch[1] + ' ';
            console.log(`🏷️ [Contact Utils] Detected label prefix: "${prefix}"`);
            return { prefix, hasEmoji: false, hasLabel: true };
        }

        return { prefix: '', hasEmoji: false, hasLabel: false };
    } catch (error) {
        console.error('❌ [Contact Utils] Error extracting prefix:', error);
        return { prefix: '', hasEmoji: false, hasLabel: false };
    }
}

/**
 * REPLACE TEXT CONTENT IN HTML
 * Finds element by CSS selector and replaces text content while preserving prefixes
 */
function replaceTextContent(
    html: string,
    selector: string,
    newValue: string,
    options: { preservePrefix?: boolean; formatPhone?: boolean } = {}
): string {
    try {
        console.log(`🔄 [Contact Utils] Replacing text for selector: "${selector}"`);

        if (!newValue || !newValue.trim()) {
            console.warn(`⚠️ [Contact Utils] Empty value for ${selector}, skipping replacement`);
            return html;
        }

        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Find the element
        const element = doc.querySelector(selector);
        if (!element) {
            console.warn(`⚠️ [Contact Utils] Element not found for selector: ${selector}`);
            return html;
        }

        const originalText = element.textContent || '';
        let finalValue = newValue;

        // Preserve prefix if requested
        if (options.preservePrefix) {
            const { prefix } = extractPrefix(originalText);
            if (prefix) {
                finalValue = prefix + newValue;
                console.log(`✅ [Contact Utils] Preserved prefix: "${prefix}"`);
            }
        }

        // Format phone if requested
        if (options.formatPhone) {
            finalValue = formatPhoneNumber(newValue);
            // Re-add prefix if it exists
            if (options.preservePrefix) {
                const { prefix } = extractPrefix(originalText);
                if (prefix) {
                    finalValue = prefix + finalValue;
                }
            }
        }

        element.textContent = finalValue;
        console.log(`✅ [Contact Utils] Replaced "${originalText}" → "${finalValue}"`);

        return doc.body.innerHTML;
    } catch (error) {
        console.error(`❌ [Contact Utils] Error replacing text for ${selector}:`, error);
        return html; // Return original HTML on error
    }
}

/**
 * HIDE ELEMENT
 * Hides element by adding display: none to inline styles
 */
function hideElement(html: string, selector: string): string {
    try {
        console.log(`🙈 [Contact Utils] Hiding element: "${selector}"`);

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const element = doc.querySelector(selector);
        if (!element) {
            console.warn(`⚠️ [Contact Utils] Element not found for hiding: ${selector}`);
            return html;
        }

        // Add display: none to existing style attribute
        const currentStyle = element.getAttribute('style') || '';
        element.setAttribute('style', currentStyle + ' display: none;');

        console.log(`✅ [Contact Utils] Hidden element: ${selector}`);
        return doc.body.innerHTML;
    } catch (error) {
        console.error(`❌ [Contact Utils] Error hiding element ${selector}:`, error);
        return html;
    }
}

/**
 * INJECT PHONES
 * Handles multiple phone numbers with priority matching and graceful degradation
 */
function injectPhones(html: string, phones: { value: string; label?: string; isPrimary?: boolean }[]): string {
    try {
        console.log(`📱 [Contact Utils] Injecting ${phones.length} phone(s)`);

        if (!phones || phones.length === 0) {
            console.log('📱 [Contact Utils] No phones to inject, hiding all phone elements');
            // Hide all phone elements
            let result = html;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const phoneElements = doc.querySelectorAll('.bc-contact-phone');
            phoneElements.forEach(() => {
                result = hideElement(result, '.bc-contact-phone');
            });
            return result;
        }

        let result = html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(result, 'text/html');
        const phoneElements = doc.querySelectorAll('.bc-contact-phone');

        console.log(`📱 [Contact Utils] Found ${phoneElements.length} phone slot(s) in layout`);

        // Strategy: Match by data-phone-type if available, otherwise sequential
        phoneElements.forEach((element, index) => {
            const phoneType = element.getAttribute('data-phone-type');
            let phoneData = null;

            if (phoneType) {
                // Try to match by type using label
                phoneData = phones.find(p => p.label?.toLowerCase() === phoneType);
                console.log(`📱 [Contact Utils] Looking for phone type: ${phoneType}`);
            }

            if (!phoneData && index < phones.length) {
                // Fallback to sequential matching
                phoneData = phones[index];
                console.log(`📱 [Contact Utils] Using sequential match for slot ${index}`);
            }

            if (phoneData && phoneData.value) {
                // Inject phone with formatting and prefix preservation
                const selector = `.bc-contact-phone${phoneType ? `[data-phone-type="${phoneType}"]` : ''}`;
                result = replaceTextContent(result, selector, phoneData.value, {
                    preservePrefix: true,
                    formatPhone: true
                });
            } else {
                // No data for this slot - hide it
                console.log(`📱 [Contact Utils] No data for phone slot ${index}, hiding`);
                const selector = `.bc-contact-phone${phoneType ? `[data-phone-type="${phoneType}"]` : ''}`;
                result = hideElement(result, selector);
            }
        });

        console.log('✅ [Contact Utils] Phone injection complete');
        return result;
    } catch (error) {
        console.error('❌ [Contact Utils] Error injecting phones:', error);
        return html;
    }
}

/**
 * INJECT EMAILS
 * Handles multiple email addresses with priority matching and graceful degradation
 */
function injectEmails(html: string, emails: { value: string; label?: string; isPrimary?: boolean }[]): string {
    try {
        console.log(`✉️ [Contact Utils] Injecting ${emails.length} email(s)`);

        if (!emails || emails.length === 0) {
            console.log('✉️ [Contact Utils] No emails to inject, hiding all email elements');
            let result = html;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const emailElements = doc.querySelectorAll('.bc-contact-email');
            emailElements.forEach(() => {
                result = hideElement(result, '.bc-contact-email');
            });
            return result;
        }

        let result = html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(result, 'text/html');
        const emailElements = doc.querySelectorAll('.bc-contact-email');

        console.log(`✉️ [Contact Utils] Found ${emailElements.length} email slot(s) in layout`);

        // Strategy: Primary email first, then sequential
        emailElements.forEach((element, index) => {
            const emailType = element.getAttribute('data-email-type');
            let emailData = null;

            if (emailType === 'primary') {
                // Try to find primary email
                emailData = emails.find(e => e.isPrimary) || emails[0];
                console.log('✉️ [Contact Utils] Using primary email');
            } else if (index < emails.length) {
                // Sequential matching
                emailData = emails[index];
                console.log(`✉️ [Contact Utils] Using sequential match for slot ${index}`);
            }

            if (emailData && emailData.value) {
                // Inject email with prefix preservation
                const selector = `.bc-contact-email${emailType ? `[data-email-type="${emailType}"]` : ''}`;
                result = replaceTextContent(result, selector, emailData.value, {
                    preservePrefix: true
                });
            } else {
                // No data for this slot - hide it
                console.log(`✉️ [Contact Utils] No data for email slot ${index}, hiding`);
                const selector = `.bc-contact-email${emailType ? `[data-email-type="${emailType}"]` : ''}`;
                result = hideElement(result, selector);
            }
        });

        console.log('✅ [Contact Utils] Email injection complete');
        return result;
    } catch (error) {
        console.error('❌ [Contact Utils] Error injecting emails:', error);
        return html;
    }
}

/**
 * INJECT WEBSITE
 * Handles website URL with prefix preservation (emoji or "www.")
 */
function injectWebsite(html: string, website: string): string {
    try {
        console.log(`🌐 [Contact Utils] Injecting website: "${website}"`);

        if (!website || !website.trim()) {
            console.log('🌐 [Contact Utils] No website provided, hiding element');
            return hideElement(html, '.bc-contact-website');
        }

        // Clean website URL (remove protocol if present)
        let cleanWebsite = website.trim().replace(/^https?:\/\//, '');

        // Inject with prefix preservation (will preserve emoji or "www." if present)
        const result = replaceTextContent(html, '.bc-contact-website', cleanWebsite, {
            preservePrefix: true
        });

        console.log('✅ [Contact Utils] Website injection complete');
        return result;
    } catch (error) {
        console.error('❌ [Contact Utils] Error injecting website:', error);
        return html;
    }
}

/**
 * MAIN INJECTION FUNCTION
 * Injects all contact information into a business card layout
 */
export function injectContactInfo(
    layoutHtml: string,
    formData: BusinessCardData
): string {
    try {
        console.log('🚀 [Contact Utils] Starting contact info injection');
        console.log('📋 [Contact Utils] Form data:', formData);

        let injectedHtml = layoutHtml;

        // 1. Inject Name
        if (formData.name && formData.name.trim()) {
            console.log('👤 [Contact Utils] Injecting name');
            injectedHtml = replaceTextContent(injectedHtml, '.bc-contact-name', formData.name);
        } else {
            console.log('👤 [Contact Utils] No name provided, hiding element');
            injectedHtml = hideElement(injectedHtml, '.bc-contact-name');
        }

        // 2. Inject Title
        if (formData.title && formData.title.trim()) {
            console.log('💼 [Contact Utils] Injecting title');
            injectedHtml = replaceTextContent(injectedHtml, '.bc-contact-title', formData.title);
        } else {
            console.log('💼 [Contact Utils] No title provided, hiding element');
            injectedHtml = hideElement(injectedHtml, '.bc-contact-title');
        }

        // 3. Inject Company
        if (formData.companyName && formData.companyName.trim()) {
            console.log('🏢 [Contact Utils] Injecting company name');
            injectedHtml = replaceTextContent(injectedHtml, '.bc-contact-company', formData.companyName);
        } else {
            console.log('🏢 [Contact Utils] No company name provided, hiding element');
            injectedHtml = hideElement(injectedHtml, '.bc-contact-company');
        }

        // 4. Inject Phones (handles multiple with smart matching)
        console.log('📱 [Contact Utils] Processing phones');
        injectedHtml = injectPhones(injectedHtml, formData.phones || []);

        // 5. Inject Emails (handles multiple with smart matching)
        console.log('✉️ [Contact Utils] Processing emails');
        injectedHtml = injectEmails(injectedHtml, formData.emails || []);

        // 6. Inject Website
        if (formData.websites && formData.websites.length > 0 && formData.websites[0].value) {
            console.log('🌐 [Contact Utils] Processing website');
            injectedHtml = injectWebsite(injectedHtml, formData.websites[0].value);
        } else {
            console.log('🌐 [Contact Utils] No website provided, hiding element');
            injectedHtml = hideElement(injectedHtml, '.bc-contact-website');
        }

        // 7. Inject Address (if provided - for special cases like BC005 "Est. 1952")
        // Note: Most layouts don't have address, so we don't hide if missing
        if (formData.addresses && formData.addresses.length > 0 && formData.addresses[0].value) {
            console.log('📍 [Contact Utils] Injecting address');
            injectedHtml = replaceTextContent(injectedHtml, '.bc-contact-address', formData.addresses[0].value, {
                preservePrefix: true
            });
        }

        console.log('✅ [Contact Utils] Contact info injection complete');
        return injectedHtml;

    } catch (error) {
        console.error('❌ [Contact Utils] Critical error during contact injection:', error);
        // Return original HTML if anything fails
        return layoutHtml;
    }
}

/**
 * VALIDATION HELPER
 * Validates that contact info is complete enough to generate a card
 */
export function validateContactInfo(formData: BusinessCardData): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    console.log('🔍 [Contact Utils] Validating contact info');

    if (!formData.name || !formData.name.trim()) {
        errors.push('Name is required');
    }

    if (!formData.companyName || !formData.companyName.trim()) {
        errors.push('Company name is required');
    }

    const hasPhone = formData.phones && formData.phones.some(p => p.value && p.value.trim());
    const hasEmail = formData.emails && formData.emails.some(e => e.value && e.value.trim());
    const hasWebsite = formData.websites && formData.websites.some(w => w.value && w.value.trim());

    if (!hasPhone && !hasEmail && !hasWebsite) {
        errors.push('At least one contact method (phone, email, or website) is required');
    }

    const isValid = errors.length === 0;

    if (isValid) {
        console.log('✅ [Contact Utils] Validation passed');
    } else {
        console.warn('⚠️ [Contact Utils] Validation failed:', errors);
    }

    return { isValid, errors };
}