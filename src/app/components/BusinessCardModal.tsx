// src/app/components/BusinessCardModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { BusinessCardData, ContactField } from '../../../types/businessCard';
import { ContactInfoForm } from './ContactInfoForm';
import { BusinessCardLayoutSelection } from './BusinessCardLayoutSelection';
import { PreviewAndGenerate } from './PreviewAndGenerate';
// Logo hook functionality to be added in future iteration

interface BusinessCardModalProps {
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

export const BusinessCardModal: React.FC<BusinessCardModalProps> = ({ isOpen, onClose }) => {
    console.log('🎨 BusinessCardModal - Render with isOpen:', isOpen);

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('info');
    const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState<BusinessCardData>({
        companyName: '',
        name: '',
        title: '',
        logo: {
            logoId: '',
            logoDataUri: '',
            position: 'auto'
        },
        phones: [{ value: '', label: '', isPrimary: false }],
        emails: [{ value: '', label: '', isPrimary: false }],
        addresses: [],
        websites: [{ value: '', label: '', isPrimary: false }],
        socialMedia: []
    });

    // Layout step pagination state
    const [layoutCurrentPage, setLayoutCurrentPage] = useState(1);
    const [layoutPaginationData, setLayoutPaginationData] = useState<any>(null);

    // Logo hook placeholder - to be implemented in future iteration
    const logo = null;
    const logoLoading = false;
    const logoError = null;

    // Debug current form data state
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

    // Modal effect management
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

    // Contact field management
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
                    case 'website':
                        updated.websites = [...prev.websites, newField];
                        break;
                    case 'social':
                        updated.socialMedia = [...prev.socialMedia, newField];
                        break;
                    case 'address':
                        updated.addresses = [...prev.addresses, {
                            street: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            country: '',
                            label: '',
                            isPrimary: false
                        }];
                        break;
                }
                return updated;
            });

            console.log(`✅ Added new ${type} field successfully`);
        } catch (err) {
            console.error(`❌ Error adding ${type} field:`, err);
            setError(`Failed to add ${type} field`);
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
                    case 'website':
                        updated.websites = prev.websites.filter((_, i) => i !== index);
                        break;
                    case 'social':
                        updated.socialMedia = prev.socialMedia.filter((_, i) => i !== index);
                        break;
                    case 'address':
                        updated.addresses = prev.addresses.filter((_, i) => i !== index);
                        break;
                }
                return updated;
            });

            console.log(`✅ Removed ${type} field at index ${index} successfully`);
        } catch (err) {
            console.error(`❌ Error removing ${type} field:`, err);
            setError(`Failed to remove ${type} field`);
        }
    };

    // Generation handler
    const handleGenerate = async () => {
        try {
            console.log('🎨 BusinessCardModal - Starting business card generation with:', {
                selectedLayout,
                formData: formData.name,
                company: formData.companyName
            });

            setIsGenerating(true);
            setError(null);

            // TODO: Implement actual generation logic
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('✅ Business card generation completed successfully');

            onClose();
        } catch (err) {
            console.error('❌ Error during business card generation:', err);
            setError('Failed to generate business card. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Create Business Card</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors relative"
                        disabled={isGenerating}
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-0 hover:opacity-20 transition-opacity transform duration-200 ease-out opacity-20 -z-10"></div>
                    </button>
                </div>

                {/* Step Progress Indicator */}
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

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex">
                            <div className="text-red-600 text-sm">
                                <strong>Error:</strong> {error}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                {currentStep === 'layout' ? (
                    // Special structure for step 2 with fixed footer
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

                        {/* Fixed Footer for Step 2 */}
                        <div className="border-t border-gray-200 bg-white px-6 py-4">
                            {/* Pagination */}
                            {layoutPaginationData && layoutPaginationData.totalPages > 1 && (
                                <div className="flex justify-center items-center space-x-2 mb-4">
                                    <button
                                        onClick={() => setLayoutCurrentPage(layoutCurrentPage - 1)}
                                        disabled={!layoutPaginationData.hasPreviousPage}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex space-x-1">
                                        {Array.from({ length: Math.min(5, layoutPaginationData.totalPages) }, (_, i) => {
                                            const page = i + 1;
                                            const isCurrentPage = page === layoutCurrentPage;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setLayoutCurrentPage(page)}
                                                    className={`px-3 py-2 text-sm rounded-lg ${
                                                        isCurrentPage
                                                            ? 'bg-purple-600 text-white'
                                                            : 'border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setLayoutCurrentPage(layoutCurrentPage + 1)}
                                        disabled={!layoutPaginationData.hasNextPage}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between">
                                <button
                                    onClick={() => setCurrentStep('info')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    ← Back to Info
                                </button>

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
                    // Normal scrollable structure for other steps
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {currentStep === 'info' && (
                                <ContactInfoForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    onNext={() => setCurrentStep('layout')}
                                    onAddField={handleAddContactField}
                                    onRemoveField={handleRemoveContactField}
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