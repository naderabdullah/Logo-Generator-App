// FILE: src/app/components/BusinessCardModal.tsx
// PURPOSE: Original UI structure preserved - Only logo prop added for enhanced functionality
// CHANGES: Added logo prop support while preserving ALL existing functionality and layout

'use client';
import React, { useState, useEffect } from 'react';
import { BusinessCardData, ContactField } from '../../../types/businessCard';
import { ContactInfoForm } from './ContactInfoForm';
import { BusinessCardLayoutSelection } from './BusinessCardLayoutSelection';
import { PreviewAndGenerate } from './PreviewAndGenerate';
import { StoredLogo } from '../utils/indexedDBUtils';

interface BusinessCardModalProps {
    logo?: StoredLogo; // ADDED: Logo prop for enhanced business card generation
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

    // ENHANCED: Log logo data when available
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

    // Form data - ENHANCED: Initialize with logo data if available
    const [formData, setFormData] = useState<BusinessCardData>({
        companyName: '',
        name: '',
        title: '',
        slogan: '',        // ADDED: New field for enhanced business cards
        descriptor: '',    // ADDED: New field for enhanced business cards
        logo: {
            logoId: logo?.id || '',
            logoDataUri: logo?.imageDataUri || '',
            position: 'auto'
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
    });

    // Layout step pagination state - PRESERVED ORIGINAL
    const [layoutCurrentPage, setLayoutCurrentPage] = useState(1);
    const [layoutPaginationData, setLayoutPaginationData] = useState<any>(null);

    // ADDED: Update form data when logo prop changes
    useEffect(() => {
        if (logo) {
            console.log('🎨 BusinessCardModal - Logo prop updated, setting form data:', {
                logoId: logo.id,
                hasImageData: !!logo.imageDataUri,
                logoName: logo.name
            });

            setFormData(prev => ({
                ...prev,
                logo: {
                    logoId: logo.id || '',
                    logoDataUri: logo.imageDataUri || '',
                    position: 'auto'
                }
            }));
        }
    }, [logo]);

    // ENHANCED: Debug current form data state with enhanced logging
    useEffect(() => {
        console.log('🎨 BusinessCardModal - Form Data State Update:', {
            step: currentStep,
            selectedLayout,
            formData: {
                companyName: formData.companyName,
                name: formData.name,
                title: formData.title,
                slogan: formData.slogan,         // ADDED: New field logging
                descriptor: formData.descriptor, // ADDED: New field logging
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

    // Modal effect management - PRESERVED ORIGINAL
    useEffect(() => {
        if (isOpen) {
            console.log('🎨 BusinessCardModal - Modal opened, preventing body scroll');
            document.body.style.overflow = 'hidden';
        } else {
            console.log('🎨 BusinessCardModal - Modal closed, restoring body scroll');
            document.body.style.overflow = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Contact field management - PRESERVED ORIGINAL
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

    // Generation handler - PRESERVED ORIGINAL
    const handleGenerate = async () => {
        try {
            console.log('🎨 BusinessCardModal - Starting generation with data:', formData);
            setIsGenerating(true);
            setError(null);

            // TODO: Implement business card generation logic
            await new Promise(resolve => setTimeout(resolve, 2000)); // Placeholder

            console.log('✅ Business card generation completed');
            setIsGenerating(false);
            onClose();
        } catch (err) {
            console.error('❌ Generation failed:', err);
            setError('Failed to generate business cards. Please try again.');
            setIsGenerating(false);
        }
    };

    // Reset modal state when closed - PRESERVED ORIGINAL
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep('info');
            setSelectedLayout(null);
            setError(null);
            setIsGenerating(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Modal Header - PRESERVED ORIGINAL STRUCTURE */}
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

                {/* Step Progress Indicator - PRESERVED ORIGINAL */}
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

                {/* Error Display - PRESERVED ORIGINAL */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {/* Main Content Area - PRESERVED ORIGINAL */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-full mx-auto">
                        <div className="p-6">
                            {/* Step Content - PRESERVED ORIGINAL LOGIC */}
                            {currentStep === 'info' && (
                                <ContactInfoForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    onNext={() => setCurrentStep('layout')}
                                    onAddField={handleAddContactField}
                                    onRemoveField={handleRemoveContactField}
                                    logo={logo} // ADDED: Pass logo to ContactInfoForm for enhanced preview
                                />
                            )}

                            {currentStep === 'layout' && (
                                <BusinessCardLayoutSelection
                                    selectedLayout={selectedLayout}
                                    onLayoutSelect={setSelectedLayout}
                                    formData={formData}
                                    onNext={() => setCurrentStep('preview')}
                                    onBack={() => setCurrentStep('info')}
                                    logo={logo} // ADDED: Pass logo for injection in enlarged modal
                                />
                            )}

                            {currentStep === 'preview' && (
                                <PreviewAndGenerate
                                    selectedTemplate={selectedLayout}
                                    formData={formData}
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