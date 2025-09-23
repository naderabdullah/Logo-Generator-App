// FILE: src/app/components/BusinessCardModal.tsx
// PURPOSE: SURGICAL FIX - Only add logo support to step 1, preserve ALL other step structures
// CRITICAL: This preserves the exact original structure for step 2 (layout) to prevent breakage

'use client';
import React, { useState, useEffect } from 'react';
import { BusinessCardData, ContactField } from '../../../types/businessCard';
import { ContactInfoForm } from './ContactInfoForm';
import { BusinessCardLayoutSelection } from './BusinessCardLayoutSelection';
import { PreviewAndGenerate } from './PreviewAndGenerate';
import { StoredLogo } from '../utils/indexedDBUtils';

interface BusinessCardModalProps {
    logo?: StoredLogo; // ONLY CHANGE: Made logo optional
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

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('info');
    const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data - ONLY CHANGE: Initialize with logo data if available
    const [formData, setFormData] = useState<BusinessCardData>({
        companyName: '',
        name: '',
        title: '',
        logo: {
            logoId: logo?.id || '',
            logoDataUri: logo?.imageDataUri || '',
            position: 'auto'
        },
        phones: [{ value: '', label: '', isPrimary: false }],
        emails: [{ value: '', label: '', isPrimary: false }],
        addresses: [],
        websites: [{ value: '', label: '', isPrimary: false }],
        socialMedia: []
    });

    // Layout step pagination state - PRESERVED ORIGINAL
    const [layoutCurrentPage, setLayoutCurrentPage] = useState(1);
    const [layoutPaginationData, setLayoutPaginationData] = useState<any>(null);

    // ONLY CHANGE: Update form data when logo prop changes
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

    // Debug current form data state - ONLY CHANGE: Enhanced logging
    useEffect(() => {
        console.log('🎨 BusinessCardModal - Form Data State Update:', {
            step: currentStep,
            selectedLayout,
            formData: {
                companyName: formData.companyName,
                name: formData.name,
                title: formData.title,
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
                }
                return updated;
            });
        } catch (err) {
            console.error(`❌ Error adding ${type} field:`, err);
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
                }
                return updated;
            });
        } catch (err) {
            console.error(`❌ Error removing ${type} field:`, err);
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
                {/* Modal Header - TITLE LEFT, LOGO CENTER, CLOSE RIGHT */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    {/* Title - Left side */}
                    <h2 className="text-2xl font-bold text-gray-900">Create Business Cards</h2>

                    {/* Logo Preview - Center (only in step 1) */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        {currentStep === 'info' && logo && logo.imageDataUri && (
                            <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                    src={logo.imageDataUri}
                                    alt="Logo preview"
                                    className="max-w-full max-h-full object-contain"
                                    onLoad={() => console.log('✅ Header logo preview loaded successfully')}
                                    onError={(e) => {
                                        console.error('❌ Header logo preview failed to load:', e);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Close button - Right side */}
                    <button
                        onClick={onClose}
                        className="relative w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-0.5 hover:shadow-lg transition-all duration-200 ease-out transform hover:scale-105"
                    >
                        <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-0 hover:opacity-20 transition-opacity transform duration-200 ease-out opacity-20 -z-10"></div>
                    </button>
                </div>

                {/* Step Progress Indicator - PRESERVED ORIGINAL */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-center space-x-8">
                        <StepIndicator
                            step={1}
                            label="Contact Info"
                            isActive={currentStep === 'info'}
                            isCompleted={currentStep !== 'info'}
                        />
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <StepIndicator
                            step={2}
                            label="Choose Layout"
                            isActive={currentStep === 'layout'}
                            isCompleted={currentStep === 'preview'}
                        />
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <StepIndicator
                            step={3}
                            label="Preview & Generate"
                            isActive={currentStep === 'preview'}
                            isCompleted={false}
                        />
                    </div>
                </div>

                {/* Error Display - PRESERVED ORIGINAL */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex">
                            <div className="text-red-600 text-sm">
                                <strong>Error:</strong> {error}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step Content - PRESERVED ORIGINAL STRUCTURE WITH SURGICAL LOGO ADDITION */}
                {currentStep === 'layout' ? (
                    // PRESERVED ORIGINAL: Special structure for step 2 with fixed footer
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6">
                                <BusinessCardLayoutSelection
                                    selectedLayout={selectedLayout}
                                    setSelectedLayout={setSelectedLayout}
                                    formData={formData}
                                    hideFooter={true}
                                    currentPage={layoutCurrentPage}
                                    onPageChange={setLayoutCurrentPage}
                                    onPaginationDataChange={setLayoutPaginationData}
                                />
                            </div>
                        </div>

                        {/* PRESERVED ORIGINAL: Fixed Footer for Step 2 */}
                        <div className="border-t border-gray-200 bg-white px-6 py-4">
                            {/* Single Row Layout: Back Button | Pagination | Next Button */}
                            <div className="flex items-center justify-between">
                                {/* Back Button */}
                                <button
                                    onClick={() => setCurrentStep('info')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    ← Back to Info
                                </button>

                                {/* Pagination Controls (Center) */}
                                {layoutPaginationData && layoutPaginationData.totalPages > 1 && (
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setLayoutCurrentPage(layoutCurrentPage - 1)}
                                            disabled={!layoutPaginationData.hasPreviousPage}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>

                                        {/* Page numbers */}
                                        {Array.from({ length: Math.min(5, layoutPaginationData.totalPages) }, (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setLayoutCurrentPage(page)}
                                                    className={`px-3 py-2 text-sm rounded-lg ${
                                                        layoutCurrentPage === page
                                                            ? 'bg-purple-600 text-white'
                                                            : 'border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setLayoutCurrentPage(layoutCurrentPage + 1)}
                                            disabled={!layoutPaginationData.hasNextPage}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}

                                {/* Next Button */}
                                <button
                                    onClick={() => setCurrentStep('preview')}
                                    disabled={!selectedLayout}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Preview Card →
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // PRESERVED ORIGINAL: Normal scrollable structure for other steps
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {currentStep === 'info' && (
                                <ContactInfoForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    onNext={() => setCurrentStep('layout')}
                                    onAddField={handleAddContactField}
                                    onRemoveField={handleRemoveContactField}
                                    logo={logo} // ONLY CHANGE: Pass logo to ContactInfoForm
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
                )}
            </div>
        </div>
    );
};