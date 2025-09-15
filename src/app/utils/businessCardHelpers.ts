import { BusinessCardData } from '../../../types/businessCard';

/**
 * Validate business card data completeness
 */
export const validateContactInfo = (data: BusinessCardData): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    if (!data.name?.trim()) {
        errors.push('Name is required');
    }

    if (!data.companyName?.trim()) {
        errors.push('Company name is required');
    }

    const hasPhone = data.phones.some(p => p.value?.trim());
    const hasEmail = data.emails.some(e => e.value?.trim());
    const hasWebsite = data.websites.some(w => w.value?.trim());

    if (!hasPhone && !hasEmail && !hasWebsite) {
        errors.push('At least one contact method (phone, email, or website) is required');
    }

    // Validate email formats
    data.emails.forEach((email, index) => {
        if (email.value && !isValidEmail(email.value)) {
            errors.push(`Email ${index + 1} is not in a valid format`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Format phone number consistently
 */
export const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
        return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    } else if (cleaned.length === 7) {
        return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
    }

    return phone; // Return original if can't format
};

/**
 * Format website URL consistently
 */
export const formatWebsite = (url: string): string => {
    let formatted = url.trim();

    // Remove protocol
    formatted = formatted.replace(/^https?:\/\//, '');

    // Remove trailing slash
    formatted = formatted.replace(/\/$/, '');

    // Add www. if no subdomain present
    if (!formatted.includes('.') || (!formatted.startsWith('www.') && !formatted.includes('.'))) {
        formatted = `www.${formatted}`;
    }

    return formatted;
};

/**
 * Validate email address format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Generate filename for PDF download
 */
export const generateBusinessCardFilename = (companyName: string): string => {
    const sanitized = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const timestamp = new Date().toISOString().slice(0, 10);
    return `business-cards-${sanitized}-${timestamp}.pdf`;
};

/**
 * Truncate text to fit within specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
};