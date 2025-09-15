import { BusinessCardProfile } from '../../types/businessCard';

export const BUSINESS_CARD_TEMPLATES: BusinessCardProfile[] = [
    {
        id: 'modern-professional',
        name: 'Modern Professional',
        description: 'Clean layout with prominent logo and organized contact info',
        isDefault: true,
        template: {
            cardWidth: 88.9,   // 3.5" horizontal
            cardHeight: 50.8,  // 2" horizontal
            zones: [
                // Logo zone - left side
                {
                    id: 'logo',
                    type: 'logo',
                    position: { x: 2, y: 2 },
                    dimensions: { width: 18, height: 15 },
                    alignment: 'center',
                    styles: {},
                    logoSettings: {
                        maintainAspectRatio: true,
                        fitMode: 'contain',
                        maxWidth: 16,
                        maxHeight: 13
                    }
                },
                // Company name - top center/right
                {
                    id: 'company-name',
                    type: 'company-name',
                    position: { x: 22, y: 2 },
                    dimensions: { width: 64, height: 6 },
                    alignment: 'left',
                    styles: {
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#1F2937'
                    },
                    fieldMapping: {
                        primary: 'companyName',
                        fallbackBehavior: 'hide'
                    }
                },
                // Name - below company name
                {
                    id: 'name',
                    type: 'personal-info',
                    position: { x: 22, y: 10 },
                    dimensions: { width: 64, height: 6 },
                    alignment: 'left',
                    styles: {
                        fontSize: 9,
                        fontWeight: 'bold',
                        color: '#374151'
                    },
                    fieldMapping: {
                        primary: 'name',
                        fallbackBehavior: 'hide'
                    }
                },
                // Title - below name
                {
                    id: 'title',
                    type: 'title-info',
                    position: { x: 22, y: 17 },
                    dimensions: { width: 64, height: 5 },
                    alignment: 'left',
                    styles: {
                        fontSize: 8,
                        fontWeight: 'normal',
                        color: '#6B7280'
                    },
                    fieldMapping: {
                        primary: 'title',
                        fallbackBehavior: 'hide'
                    }
                },
                // Contact info - bottom section
                {
                    id: 'contact-block',
                    type: 'contact-block',
                    position: { x: 22, y: 24 },
                    dimensions: { width: 64, height: 22 },
                    alignment: 'left',
                    styles: {
                        fontSize: 7,
                        fontWeight: 'normal',
                        color: '#6B7280',
                        lineHeight: 1.8
                    },
                    contactBlock: {
                        fields: ['phones', 'emails', 'websites'],
                        separator: '\n',
                        maxLines: 4,
                        overflow: 'truncate'
                    }
                }
            ],
            globalStyles: {
                fontFamily: 'helvetica',
                backgroundColor: '#FFFFFF',
                padding: 1
            }
        }
    },
    {
        id: 'creative-bold',
        name: 'Creative Bold',
        description: 'Eye-catching design with large logo and creative typography',
        isDefault: false,
        template: {
            cardWidth: 50.8,
            cardHeight: 88.9,
            zones: [
                // Large centered logo at top
                {
                    id: 'logo',
                    type: 'logo',
                    position: { x: 12.4, y: 8 }, // Centered: (50.8-26)/2
                    dimensions: { width: 26, height: 20 },
                    alignment: 'center',
                    styles: {},
                    logoSettings: {
                        maintainAspectRatio: true,
                        fitMode: 'contain',
                        maxWidth: 26,
                        maxHeight: 20
                    }
                },
                // Centered company name below logo
                {
                    id: 'company-name',
                    type: 'company-name',
                    position: { x: 4, y: 32 },
                    dimensions: { width: 42.8, height: 8 },
                    alignment: 'center',
                    styles: {
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#7C3AED',
                        textTransform: 'uppercase'
                    },
                    fieldMapping: {
                        primary: 'companyName',
                        fallbackBehavior: 'hide'
                    }
                },
                // Personal info centered
                {
                    id: 'personal-info',
                    type: 'personal-info',
                    position: { x: 4, y: 44 },
                    dimensions: { width: 42.8, height: 10 },
                    alignment: 'center',
                    styles: {
                        fontSize: 9,
                        fontWeight: 'normal',
                        color: '#1F2937',
                        lineHeight: 1.2
                    },
                    fieldMapping: {
                        primary: 'name',
                        secondary: ['title'],
                        fallbackBehavior: 'collapse'
                    }
                },
                // Contact block at bottom
                {
                    id: 'contact-info',
                    type: 'contact-block',
                    position: { x: 4, y: 58 },
                    dimensions: { width: 42.8, height: 26 },
                    alignment: 'center',
                    styles: {
                        fontSize: 7,
                        color: '#4B5563',
                        lineHeight: 1.5
                    },
                    contactBlock: {
                        fields: ['emails', 'phones', 'websites'],
                        separator: '\n',
                        maxLines: 6,
                        overflow: 'wrap'
                    }
                }
            ],
            globalStyles: {
                fontFamily: 'helvetica',
                backgroundColor: '#FEFCE8',
                borderColor: '#7C3AED',
                borderWidth: 1,
                padding: 1
            }
        }
    }
];

// Helper functions
export const getBusinessCardTemplate = (templateId: string): BusinessCardProfile | null => {
    return BUSINESS_CARD_TEMPLATES.find(t => t.id === templateId) || null;
};

export const getDefaultTemplate = (): BusinessCardProfile => {
    return BUSINESS_CARD_TEMPLATES.find(t => t.isDefault) || BUSINESS_CARD_TEMPLATES[0];
};

export const getAllTemplates = (): BusinessCardProfile[] => {
    return BUSINESS_CARD_TEMPLATES;
};