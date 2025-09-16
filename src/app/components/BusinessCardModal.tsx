'use client';

import { useState, useEffect } from 'react';
import { StoredLogo } from '@/app/utils/indexedDBUtils';
import { BusinessCardData } from '../../../types/businessCard';
import { BUSINESS_CARD_TEMPLATES } from '@/data/businessCardTemplates';
import { ContactInfoForm } from './ContactInfoForm';
import { TemplateSelection } from './TemplateSelection';
import { PreviewAndGenerate } from './PreviewAndGenerate';
import { StepIndicator } from './StepIndicator';

interface BusinessCardModalProps {
    logo: StoredLogo;
    isOpen: boolean;
    onClose: () => void;
}

type ModalStep = 'info' | 'template' | 'preview';

export const BusinessCardModal = ({ logo, isOpen, onClose }: BusinessCardModalProps) => {
    // Form state with defaults from logo
    const [formData, setFormData] = useState<BusinessCardData>({
        companyName: logo.parameters.companyName || '',
        name: '',
        title: '',
        logo: {
            logoId: logo.id,
            logoDataUri: logo.imageDataUri,
            position: 'auto'
        },
        phones: [{ value: '', label: 'Mobile', isPrimary: true }],
        emails: [{ value: '', label: '', isPrimary: true }],
        addresses: [],
        websites: [],
        socialMedia: [],
        customFields: {}
    });

    const [selectedTemplate, setSelectedTemplate] = useState(BUSINESS_CARD_TEMPLATES[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStep, setCurrentStep] = useState<ModalStep>('info');
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        console.log('🔍 BusinessCardModal initialized with logo:', {
            logoId: logo.id,
            logoName: logo.name,
            hasImageDataUri: !!logo.imageDataUri,
            imageDataLength: logo.imageDataUri?.length,
            formDataLogoId: formData.logo.logoId,
            formDataHasDataUri: !!formData.logo.logoDataUri
        });
    }, [logo, formData.logo]);

    // Field management functions
    const handleAddContactField = (fieldType: 'phones' | 'emails' | 'websites') => {
        setFormData(prev => ({
            ...prev,
            [fieldType]: [...prev[fieldType], { value: '', label: '', isPrimary: false }]
        }));
    };

    const handleRemoveContactField = (fieldType: 'phones' | 'emails' | 'websites', index: number) => {
        setFormData(prev => ({
            ...prev,
            [fieldType]: prev[fieldType].filter((_, i) => i !== index)
        }));
    };

    // PDF generation handler
    // Replace the ENTIRE handleGenerate function in BusinessCardModal.tsx with this:

    // Complete FIXED handleGenerate function - replace the entire function in BusinessCardModal.tsx

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        // Enhanced debugging
        console.log('🎨 BusinessCardModal - Form Data Debug:', {
            companyName: formData.companyName,
            name: formData.name,
            title: formData.title,
            logoId: formData.logo.logoId,
            logoDataUri: formData.logo.logoDataUri ? {
                hasDataUri: true,
                length: formData.logo.logoDataUri.length,
                startsWithData: formData.logo.logoDataUri.startsWith('data:'),
                preview: formData.logo.logoDataUri.substring(0, 50) + '...'
            } : null,
            phones: formData.phones,
            emails: formData.emails
        });

        console.log('🖼️ Original Logo Object:', {
            logoId: logo.id,
            hasImageDataUri: !!logo.imageDataUri,
            imageDataLength: logo.imageDataUri?.length,
            imageDataPreview: logo.imageDataUri?.substring(0, 50) + '...'
        });

        try {
            const requestBody = {
                templateId: selectedTemplate,
                cardData: formData,
                cardCount: 10
            };

            console.log('📤 Sending to API:', requestBody);

            const response = await fetch('/api/business-cards/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Generation failed');
            }

            // Create and download the PDF file
            const pdfBlob = await response.blob();

            // Create download link with safer URL handling
            const downloadLink = document.createElement('a');
            const blobUrl = URL.createObjectURL(pdfBlob);

            downloadLink.href = blobUrl;
            downloadLink.download = `business-cards-${formData.companyName.replace(/\s+/g, '-').toLowerCase()}.pdf`;

            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up the blob URL
            URL.revokeObjectURL(blobUrl);

            // Success - close modal
            onClose();

        } catch (error) {
            console.error('❌ Business card generation failed:', error);
            setError(error instanceof Error ? error.message : 'Generation failed. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };
    // Reset form when modal closes
    const handleClose = async () => {
        setIsClosing(true);
        setCurrentStep('info');
        setError(null);
        setIsGenerating(false);

        // Small delay for smooth animation
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gray-50">
                    <div className="flex items-center space-x-4">
                        <img
                            src={logo.imageDataUri}
                            alt="Logo"
                            className="w-12 h-12 rounded object-contain bg-white p-1 border"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Create Business Cards</h2>
                            <p className="text-gray-600 text-sm">Using logo: {logo.name}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        disabled={isGenerating || isClosing}
                        className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:hover:text-red-600 disabled:hover:scale-100"
                        aria-label={isClosing ? "Closing..." : "Close modal"}
                    >
                        {isClosing ? (
                            // Spinning loader during close
                            <svg
                                className="w-5 h-5 animate-spin"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        ) : (
                            // Regular X icon with rotation animation
                            <svg
                                className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        )}

                        {/* Subtle background animation */}
                        <div
                            className="absolute inset-0 rounded-lg bg-red-100 scale-0 group-hover:scale-100 transition-transform duration-200 ease-out opacity-20 -z-10"></div>
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
                            label="Choose Template"
                            isActive={currentStep === 'template'}
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

                {/* Step Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {currentStep === 'info' && (
                            <ContactInfoForm
                                formData={formData}
                                setFormData={setFormData}
                                onNext={() => setCurrentStep('template')}
                                onAddField={handleAddContactField}
                                onRemoveField={handleRemoveContactField}
                            />
                        )}

                        {currentStep === 'template' && (
                            <TemplateSelection
                                selectedTemplate={selectedTemplate}
                                setSelectedTemplate={setSelectedTemplate}
                                formData={formData}
                                onBack={() => setCurrentStep('info')}
                                onNext={() => setCurrentStep('preview')}
                            />
                        )}

                        {currentStep === 'preview' && (
                            <PreviewAndGenerate
                                selectedTemplate={selectedTemplate}
                                formData={formData}
                                isGenerating={isGenerating}
                                onBack={() => setCurrentStep('template')}
                                onGenerate={handleGenerate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};