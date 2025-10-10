// FILE: src/app/components/BusinessCardModal.tsx
// MODIFICATIONS: ONLY test data pre-population feature added
// ALL EXISTING UI AND FUNCTIONALITY PRESERVED
// ACTION: FULL FILE REPLACEMENT (clean swap ready)

'use client';
import React, { useState, useEffect } from 'react';
import { BusinessCardData, ContactField } from '../../../types/businessCard';
import { ContactInfoForm } from './ContactInfoForm';
import { BusinessCardLayoutSelection } from './BusinessCardLayoutSelection';
import { PreviewAndGenerate } from './PreviewAndGenerate';
import { StoredLogo } from '../utils/indexedDBUtils';

// ============================================================================
// 🧪 TEST DATA PRE-POPULATION FEATURE - NEW ADDITION
// ============================================================================

/**
 * TESTING FLAG - Set to true to pre-populate form with test data
 * 🚨 IMPORTANT: Set to false before production deployment!
 */
const ENABLE_TEST_DATA = true; // 🚨 TOGGLE THIS FLAG

/**
 * Comprehensive test data covering all form fields including optional ones
 * Designed to test all BC layouts (BC001-BC015)
 */
const TEST_FORM_DATA = {
    name: 'Dr. Sarah Mitchell',
    title: 'UX Director',
    companyName: 'TechVision Solutions Inc.',
    subtitle: 'MBA',
    slogan: 'Innovation Through Design',
    descriptor: 'Enterprise Software Solutions',
    yearEstablished: 'Est. 1995',
    logo: {
        logoId: '',
        logoDataUri: '',
        position: 'auto' as const
    },
    phones: [
        { value: '5551234567', label: 'Mobile', isPrimary: true },
        { value: '5559876543', label: 'Office', isPrimary: false },
        { value: '5555551234', label: 'Fax', isPrimary: false }
    ],
    emails: [
        { value: 'sarah.mitchell@techvision.com', label: 'Work', isPrimary: true },
        { value: 's.mitchell@example.com', label: 'Personal', isPrimary: false }
    ],
    addresses: [
        { value: '123 Innovation Drive, Suite 400, San Francisco, CA 94105', label: 'Main Office', isPrimary: true },
        { value: '456 Tech Park Blvd, Building B, Austin, TX 78701', label: 'Branch Office', isPrimary: false }
    ],
    websites: [
        { value: 'https://techvision-solutions.com', label: 'Company', isPrimary: true },
        { value: 'https://blog.techvision.com', label: 'Blog', isPrimary: false }
    ],
    socialMedia: [
        { value: '@techvision', label: 'Twitter', isPrimary: true },
        { value: 'linkedin.com/company/techvision', label: 'LinkedIn', isPrimary: false }
    ]
};

/**
 * Helper function to get initial form data based on test mode flag
 */
const getInitialFormData = (logo?: StoredLogo): BusinessCardData => {
    if (ENABLE_TEST_DATA) {
        console.log('🧪 [TEST MODE] Pre-populating form with test data');
        return {
            ...TEST_FORM_DATA,
            logo: {
                logoId: logo?.id || '',
                logoDataUri: logo?.imageDataUri || '',
                position: 'auto' as const
            }
        };
    }

    // Production mode - empty form (EXISTING ORIGINAL CODE)
    console.log('📋 [PRODUCTION MODE] Initializing empty form');
    return {
        companyName: '',
        name: '',
        title: '',
        slogan: '',
        descriptor: '',
        yearEstablished: '',
        subtitle: '',
        logo: {
            logoId: logo?.id || '',
            logoDataUri: logo?.imageDataUri || '',
            position: 'auto' as const
        },
        phones: [
            { value: '', label: '', isPrimary: true },
            { value: '', label: '', isPrimary: false }
        ],
        emails: [
            { value: '', label: '', isPrimary: true },
            { value: '', label: '', isPrimary: false }
        ],
        addresses: [],
        websites: [{ value: '', label: '', isPrimary: false }],
        socialMedia: [
            { value: '', label: '', isPrimary: false },
            { value: '', label: '', isPrimary: false },
            { value: '', label: '', isPrimary: false }
        ]
    };
};

// ============================================================================
// COMPONENT - ALL EXISTING CODE PRESERVED
// ============================================================================

interface BusinessCardModalProps {
    logo?: StoredLogo;
    isOpen: boolean;
    onClose: () => void;
}

type WizardStep = 'info' | 'layout' | 'preview';

interface StepIndicatorProps {
    step: number;
    label: string;
    isActive: boolean;
    isCompleted: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step, label, isActive, isCompleted }) => (
    <div className="flex items-center space-x-2">
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isActive ? 'bg-purple-600 text-white' :
            isCompleted ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-600'}
        `}>
            {isCompleted ? '✓' : step}
        </div>
        <span className={`text-sm ${isActive ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
            {label}
        </span>
    </div>
);

export const BusinessCardModal: React.FC<BusinessCardModalProps> = ({ logo, isOpen, onClose }) => {
    console.log('🎨 BusinessCardModal - Render with isOpen:', isOpen, 'logo:', !!logo);

    if (logo) {
        console.log('🎨 BusinessCardModal - Logo data:', {
            logoId: logo.id,
            name: logo.name,
            hasImageData: !!logo.imageDataUri,
            imageDataLength: logo.imageDataUri?.length
        });
    }

    // Wizard state - PRESERVED ORIGINAL
    const [currentStep, setCurrentStep] = useState<WizardStep>('info');
    const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [themeFilter, setThemeFilter] = useState('all');

    // ✨ MODIFIED: Form data now uses getInitialFormData helper (ONLY CHANGE TO EXISTING CODE)
    const [formData, setFormData] = useState<BusinessCardData>(
        getInitialFormData(logo)
    );

    // Layout step pagination state - PRESERVED ORIGINAL
    const [layoutCurrentPage, setLayoutCurrentPage] = useState(1);

    // ============================================================================
    // 🧪 TEST MODE LOGGING - NEW ADDITION
    // ============================================================================

    useEffect(() => {
        if (ENABLE_TEST_DATA && isOpen) {
            console.log('🧪 ============================================');
            console.log('🧪 TEST MODE ACTIVE - Form Pre-populated');
            console.log('🧪 ============================================');
            console.log('🧪 Test Data Summary:', {
                name: formData.name,
                title: formData.title,
                company: formData.companyName,
                subtitle: formData.subtitle,
                yearEstablished: formData.yearEstablished,
                slogan: formData.slogan,
                descriptor: formData.descriptor,
                phonesCount: formData.phones.length,
                emailsCount: formData.emails.length,
                addressesCount: formData.addresses.length,
                websitesCount: formData.websites.length,
                socialMediaCount: formData.socialMedia.length
            });
            console.log('🧪 ⚠️  REMINDER: Set ENABLE_TEST_DATA = false for production!');
            console.log('🧪 ============================================');
        }
    }, [isOpen]); // Log when modal opens

    // ============================================================================
    // ALL EXISTING useEffects - PRESERVED ORIGINAL
    // ============================================================================

    useEffect(() => {
        if (logo) {
            console.log('🎨 BusinessCardModal - Logo prop updated, setting form data:', {
                logoId: logo.id,
                hasImageData: !!logo.imageDataUri,
                logoName: logo.name
            });

            setFormData(prev => ({
                ...prev, // Preserve all existing data (including test data!)
                logo: {
                    logoId: logo.id || '',
                    logoDataUri: logo.imageDataUri || '',
                    position: 'auto'
                }
            }));
        }
    }, [logo]);

    useEffect(() => {
        console.log('🎨 BusinessCardModal - Form Data State Update:', {
            step: currentStep,
            selectedLayout,
            formData: {
                companyName: formData.companyName,
                name: formData.name,
                title: formData.title,
                slogan: formData.slogan,
                descriptor: formData.descriptor,
                logoId: formData.logo.logoId,
                hasLogoDataUri: !!formData.logo.logoDataUri,
                phonesCount: formData.phones.length,
                emailsCount: formData.emails.length,
                addressesCount: formData.addresses.length,
                websitesCount: formData.websites.length,
                socialMediaCount: formData.socialMedia.length
            }
        });
    }, [currentStep, selectedLayout, formData]);

    useEffect(() => {
        if (isOpen) {
            console.log('🎨 BusinessCardModal - Modal opened, preventing body scroll');
            document.body.style.overflow = 'hidden';
        } else {
            console.log('🎨 BusinessCardModal - Modal closed, restoring body scroll');
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep('info');
            setSelectedLayout(null);
            setError(null);
            setIsGenerating(false);
        }
    }, [isOpen]);

    // Reset isGenerating when PDF generation completes
    useEffect(() => {
        if (isGenerating) {
            // PDF generation happens in PreviewAndGenerate
            // Reset after a delay to allow download to complete
            const timer = setTimeout(() => {
                console.log('✅ Resetting isGenerating state');
                setIsGenerating(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isGenerating]);

    // ============================================================================
    // ALL EXISTING HANDLERS - PRESERVED ORIGINAL
    // ============================================================================

    const handleAddContactField = (type: 'phone' | 'email' | 'address' | 'website' | 'social') => {
        try {
            console.log(`🎨 BusinessCardModal - Adding new ${type} field`);

            const newField: ContactField = {
                value: '',
                label: '',
                isPrimary: false
            };

            setFormData(prev => {
                const updated = { ...prev };
                switch (type) {
                    case 'phone':
                        updated.phones = [...prev.phones, newField];
                        break;
                    case 'email':
                        updated.emails = [...prev.emails, newField];
                        break;
                    case 'address':
                        updated.addresses = [...prev.addresses, newField];
                        break;
                    case 'website':
                        updated.websites = [...prev.websites, newField];
                        break;
                    case 'social':
                        updated.socialMedia = [...prev.socialMedia, newField];
                        break;
                    default:
                        console.warn(`🎨 BusinessCardModal - Unknown field type: ${type}`);
                        return prev;
                }
                return updated;
            });

            console.log(`✅ BusinessCardModal - Successfully added ${type} field`);
        } catch (error) {
            console.error(`❌ BusinessCardModal - Error adding ${type} field:`, error);
        }
    };

    const handleRemoveContactField = (type: 'phone' | 'email' | 'address' | 'website' | 'social', index: number) => {
        try {
            console.log(`🎨 BusinessCardModal - Removing ${type} field at index ${index}`);

            setFormData(prev => {
                const updated = { ...prev };
                switch (type) {
                    case 'phone':
                        updated.phones = prev.phones.filter((_, i) => i !== index);
                        break;
                    case 'email':
                        updated.emails = prev.emails.filter((_, i) => i !== index);
                        break;
                    case 'address':
                        updated.addresses = prev.addresses.filter((_, i) => i !== index);
                        break;
                    case 'website':
                        updated.websites = prev.websites.filter((_, i) => i !== index);
                        break;
                    case 'social':
                        updated.socialMedia = prev.socialMedia.filter((_, i) => i !== index);
                        break;
                    default:
                        console.warn(`🎨 BusinessCardModal - Unknown field type: ${type}`);
                        return prev;
                }
                return updated;
            });

            console.log(`✅ BusinessCardModal - Successfully removed ${type} field at index ${index}`);
        } catch (error) {
            console.error(`❌ BusinessCardModal - Error removing ${type} field:`, error);
        }
    };

    const handleGenerate = async () => {
        if (!selectedLayout) {
            console.error('❌ No layout selected');
            setError('Please select a layout');
            return;
        }

        try {
            console.log('🎴 ========================================');
            console.log('🎴 BusinessCardModal - handleGenerate called');
            console.log('🎴 ========================================');
            console.log('📋 Selected layout:', selectedLayout);
            console.log('📋 Form data present:', !!formData);
            console.log('📋 Logo present:', !!logo);

            setIsGenerating(true);
            setError(null);

            // Note: Actual PDF generation happens in PreviewAndGenerate component
            // This just sets the loading state
            console.log('✅ Generation initiated - PreviewAndGenerate will handle PDF creation');

        } catch (err) {
            console.error('❌ ========================================');
            console.error('❌ PDF generation error');
            console.error('❌ ========================================');
            console.error('❌ Error details:', err);
            setError('Failed to generate PDF. Please try again.');
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    // ============================================================================
    // JSX RENDER - ALL EXISTING UI PRESERVED
    // ============================================================================

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Create Business Cards</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Step Progress Indicator */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-center space-x-8">
                        <StepIndicator
                            step={1}
                            label="Contact Info"
                            isActive={currentStep === 'info'}
                            isCompleted={currentStep === 'layout' || currentStep === 'preview'}
                        />
                        <div className="w-12 h-px bg-gray-300"></div>
                        <StepIndicator
                            step={2}
                            label="Layout"
                            isActive={currentStep === 'layout'}
                            isCompleted={currentStep === 'preview'}
                        />
                        <div className="w-12 h-px bg-gray-300"></div>
                        <StepIndicator
                            step={3}
                            label="Preview"
                            isActive={currentStep === 'preview'}
                            isCompleted={false}
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-full mx-auto">
                        <div className="p-6">
                            {currentStep === 'info' && (
                                <ContactInfoForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    onNext={() => setCurrentStep('layout')}
                                    onAddField={handleAddContactField}
                                    onRemoveField={handleRemoveContactField}
                                    logo={logo}
                                />
                            )}

                            {currentStep === 'layout' && (
                                <div className="flex flex-col h-full">
                                    <BusinessCardLayoutSelection
                                        selectedLayout={selectedLayout}
                                        onLayoutSelect={setSelectedLayout}
                                        formData={formData}
                                        onNext={() => setCurrentStep('preview')}
                                        onBack={() => setCurrentStep('info')}
                                        searchTerm={searchTerm}
                                        themeFilter={themeFilter}
                                        onSearchChange={setSearchTerm}
                                        onThemeFilterChange={setThemeFilter}
                                        externalCurrentPage={layoutCurrentPage}
                                        onPageChange={setLayoutCurrentPage}
                                        logo={logo}
                                    />
                                </div>
                            )}

                            {currentStep === 'preview' && (
                                <PreviewAndGenerate
                                    selectedLayout={selectedLayout}    // Changed from selectedTemplate
                                    formData={formData}                // Contains logo in formData.logo
                                    isGenerating={isGenerating}
                                    onBack={() => setCurrentStep('layout')}
                                    onGenerate={handleGenerate}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};