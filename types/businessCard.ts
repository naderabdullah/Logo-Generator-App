// Import existing types from the logo system
import { StoredLogo } from '@/app/utils/indexedDBUtils';

export interface BusinessCardProfile {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    template: BusinessCardTemplate;
    isDefault: boolean;
}

export interface BusinessCardTemplate {
    cardWidth: 88.9;   // Fixed: 3.5" in mm (was 50.8)
    cardHeight: 50.8;  // Fixed: 2" in mm (was 88.9)
    zones: BusinessCardZone[];
    globalStyles: GlobalStyles;
}

export interface BusinessCardZone {
    id: string;
    type: 'logo' | 'company-name' | 'personal-info' | 'contact-block' | 'custom-text';
    position: { x: number; y: number }; // mm from card top-left (0-50.8, 0-88.9)
    dimensions: { width: number; height: number }; // mm
    alignment: 'left' | 'center' | 'right';
    styles: ZoneStyles;
    logoSettings?: LogoSettings;
    fieldMapping?: FieldMapping;
    contactBlock?: ContactBlockSettings;
}

export interface BusinessCardData {
    companyName: string;
    name: string;
    title: string;
    slogan?: string;        // ADDED: For company tagline
    descriptor?: string;    // ADDED: For misc additional info
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

export interface ContactField {
    value: string;
    label?: string; // 'Mobile', 'Office', 'Fax'
    isPrimary: boolean;
}

export interface SocialMediaField {
    platform: string; // 'LinkedIn', 'Twitter', 'Instagram'
    handle: string;
    url: string;
}

export interface LogoSettings {
    maintainAspectRatio: boolean;
    fitMode: 'contain' | 'cover' | 'fill';
    maxWidth?: number;
    maxHeight?: number;
}

export interface FieldMapping {
    primary?: string;
    secondary?: string[];
    fallbackBehavior: 'hide' | 'collapse' | 'merge';
}

export interface ContactBlockSettings {
    fields: ('phones' | 'emails' | 'websites' | 'social')[];
    separator: string;
    maxLines: number;
    overflow: 'wrap' | 'truncate' | 'scale';
}

export interface GlobalStyles {
    fontFamily: 'helvetica' | 'times' | 'courier';
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding: number;
}

export interface ZoneStyles {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    color?: string;
    lineHeight?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase';
}

export interface CardPosition {
    x: number;
    y: number;
    cardNumber: number;
}

// Component prop types
export interface TemplatePreviewProps {
    template?: BusinessCardTemplate;
    templateId?: string;  // Add this prop
    cardData: BusinessCardData;
    scale?: number;
}

export interface BusinessCardModalProps {
    logo?: StoredLogo;
    isOpen: boolean;
    onClose: () => void;
}

export interface ContactInfoFormProps {
    formData: BusinessCardData;
    setFormData: (data: BusinessCardData) => void;
    onNext: () => void;
    onAddField: (fieldType: 'phones' | 'emails' | 'websites') => void;
    onRemoveField: (fieldType: 'phones' | 'emails' | 'websites', index: number) => void;
    logo?: StoredLogo; // ADDED: Logo prop for preview functionality
}

export interface TemplateSelectionProps {
    selectedTemplate: string;
    setSelectedTemplate: (templateId: string) => void;
    formData: BusinessCardData;
    onBack: () => void;
    onNext: () => void;
}

export interface PreviewAndGenerateProps {
    selectedTemplate: string;
    formData: BusinessCardData;
    isGenerating: boolean;
    onBack: () => void;
    onGenerate: () => void;
}

export interface StepIndicatorProps {
    step: number;
    label: string;
    isActive: boolean;
    isCompleted: boolean;
}