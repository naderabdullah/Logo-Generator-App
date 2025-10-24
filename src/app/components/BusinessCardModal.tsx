// FILE: src/app/components/BusinessCardModal.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { BusinessCardData, ContactField } from '../../../types/businessCard';
import { ContactInfoForm } from './ContactInfoForm';
import { BusinessCardLayoutSelection } from './BusinessCardLayoutSelection';
import { PreviewAndGenerate } from './PreviewAndGenerate';
import { StoredLogo } from '../utils/indexedDBUtils';

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
            ${isCompleted ? 'bg-green-500 text-white' :
            isActive ? 'bg-purple-600 text-white' :
                'bg-gray-200 text-gray-600'}
        `}>
            {isCompleted ? '✓' : step}
        </div>
        <span
            className={`text-sm ${isCompleted ? 'text-green-600 font-medium' : isActive ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
            {label}
        </span>
    </div>
);

export const BusinessCardModal: React.FC<BusinessCardModalProps> = ({logo, isOpen, onClose}) => {

    // Wizard state - PRESERVED ORIGINAL
    const [currentStep, setCurrentStep] = useState<WizardStep>('info');
    const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [themeFilter, setThemeFilter] = useState('all');
    const [pdfGenerated, setPdfGenerated] = useState(false);

    // ✨ MODIFIED: Form data now uses getInitialFormData helper (ONLY CHANGE TO EXISTING CODE)
    const [formData, setFormData] = useState<BusinessCardData>(
        getInitialFormData(logo)
    );

    // Layout step pagination state - PRESERVED ORIGINAL
    const [layoutCurrentPage, setLayoutCurrentPage] = useState(1);

    useEffect(() => {
        // When search term or theme filter changes, reset to page 1
        // This prevents showing empty pages when filtered results have fewer pages
        setLayoutCurrentPage(1);
    }, [searchTerm, themeFilter]);

    // ============================================================================
    // ALL EXISTING useEffects - PRESERVED ORIGINAL
    // ============================================================================

    useEffect(() => {
        if (logo) {

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
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
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
            setPdfGenerated(false);
            setSearchTerm('');
            setThemeFilter('all');
            setLayoutCurrentPage(1);
        }
    }, [isOpen]);

    useEffect(() => {
        // When user leaves the preview step (goes back to layout or info),
        // reset the PDF completion status since they're making changes
        if (currentStep !== 'preview') {
            setPdfGenerated(false);
        }
    }, [currentStep]);


    // ============================================================================
    // ALL EXISTING HANDLERS - PRESERVED ORIGINAL
    // ============================================================================

    const handleAddContactField = (type: 'phone' | 'email' | 'address' | 'website' | 'social') => {
        try {

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

        } catch (error) {
            console.error(`❌ BusinessCardModal - Error adding ${type} field:`, error);
        }
    };

    const handleRemoveContactField = (type: 'phone' | 'email' | 'address' | 'website' | 'social', index: number) => {
        try {

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
        } catch (error) {
            console.error(`❌ BusinessCardModal - Error removing ${type} field:`, error);
        }
    };

    const handleGenerateStart = () => {
        setIsGenerating(true);
        setError(null);
    };

    const handleGenerateSuccess = () => {
        setIsGenerating(false);
        setPdfGenerated(true);
    };

    const handleGenerateError = (errorMessage: string) => {
        setError(errorMessage);
        setIsGenerating(false);
        setPdfGenerated(false);
    };

    const handlePdfComplete = () => {
        setIsGenerating(false);
        setPdfGenerated(true);
    };

    if (!isOpen) return null;

    // ============================================================================
    // JSX RENDER - ALL EXISTING UI PRESERVED
    // ============================================================================

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Create Business Cards</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
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
                            isCompleted={pdfGenerated}
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
                <div className={`flex-1 ${currentStep === 'layout' ? 'overflow-auto' : 'overflow-hidden'}`}>
                    <div className="max-w-full mx-auto">
                        <div className="px-6">
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
                                    selectedLayout={selectedLayout}
                                    formData={formData}
                                    isGenerating={isGenerating}
                                    onBack={() => setCurrentStep('layout')}
                                    onGenerateStart={handleGenerateStart}
                                    onGenerateSuccess={handleGenerateSuccess}
                                    onGenerateError={handleGenerateError}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};