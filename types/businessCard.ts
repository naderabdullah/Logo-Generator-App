// FILE: types/businessCard.ts
// PURPOSE: Business card type definitions - CSS/HTML implementation only
// CHANGES: Removed all zone-based types (BusinessCardZone, BusinessCardTemplate, etc.)
//          Kept only types needed for CSS/HTML implementation

import { StoredLogo } from '@/app/utils/indexedDBUtils';

// ============================================================================
// CORE DATA TYPES - Used by CSS/HTML Implementation
// ============================================================================

/**
 * Business card contact and company information
 * Used to populate the CSS/HTML layouts
 */
export interface BusinessCardData {
    companyName: string;
    name: string;
    title: string;
    subtitle?: string;
    slogan?: string;
    descriptor?: string;
    yearEstablished?: string;
    logo: {
        logoId: string;
        logoDataUri: string;
        position: 'auto' | 'custom';
    };
    phones: ContactField[];
    emails: ContactField[];
    addresses: ContactField[];
    websites: ContactField[];
    socialMedia: ContactField[];
}

/**
 * Individual contact field with label and priority
 */
export interface ContactField {
    value: string;
    label?: string; // 'Mobile', 'Office', 'Fax', 'Work', etc.
    isPrimary: boolean;
}

/**
 * Social media field with platform information
 */
export interface SocialMediaField {
    platform: string; // 'LinkedIn', 'Twitter', 'Instagram', 'Facebook'
    handle: string;
    url: string;
}

/**
 * Card position on Avery 8371 sheet
 * Used for PDF layout calculations
 */
export interface CardPosition {
    x: number;      // X position in mm
    y: number;      // Y position in mm
    cardNumber: number;  // Card number (1-10)
}

// ============================================================================
// COMPONENT PROP TYPES - For Business Card Wizard
// ============================================================================

/**
 * Main business card modal props
 */
export interface BusinessCardModalProps {
    logo?: StoredLogo;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Step 1: Contact Information Form
 */
export interface ContactInfoFormProps {
    formData: BusinessCardData;
    setFormData: (data: BusinessCardData) => void;
    onNext: () => void;
    onAddField: (fieldType: 'phones' | 'emails' | 'websites') => void;
    onRemoveField: (fieldType: 'phones' | 'emails' | 'websites', index: number) => void;
    logo?: StoredLogo;
}

/**
 * Step 2: Layout Selection (100 CSS/HTML layouts)
 */
export interface BusinessCardLayoutSelectionProps {
    selectedLayout: string | null;  // catalogId (e.g., "BC001")
    onLayoutSelect: (catalogId: string) => void;
    formData: BusinessCardData;
    onNext: () => void;
    onBack: () => void;
    searchTerm?: string;
    themeFilter?: string;
    onSearchChange?: (term: string) => void;
    onThemeFilterChange?: (theme: string) => void;
    externalCurrentPage?: number;
    onPageChange?: (page: number) => void;
    hideFooter?: boolean;
    logo?: StoredLogo | null;
}

/**
 * Step 3: Preview and Generate PDF
 */
export interface PreviewAndGenerateProps {
    selectedLayout: string;  // catalogId from businessCardLayouts.ts
    formData: BusinessCardData;
    isGenerating: boolean;
    onBack: () => void;
    onGenerateStart: () => void;
    onGenerateSuccess: () => void;
    onGenerateError: (error: string) => void;
}

/**
 * Step indicator component props
 */
export interface StepIndicatorProps {
    step: number;
    label: string;
    isActive: boolean;
    isCompleted: boolean;
}