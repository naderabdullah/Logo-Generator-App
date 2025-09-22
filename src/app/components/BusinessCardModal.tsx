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
                hasLogoDataUri: !!formData.logo.logoDataUri
            }
        });
    }, [currentStep, selectedLayout, formData]);

    // Debug logo state - placeholder for future logo integration
    useEffect(() => {
        console.log('🖼️ BusinessCardModal - Logo integration will be added in future iteration');
    }, [formData.logo]);

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

        console.log('🖼️ Logo integration placeholder - will be added in future iteration');

        try {
            // Prepare the data payload for PDF generation
            const payload = {
                selectedLayout, // Now uses layout instead of template
                formData: {
                    ...formData,
                    logo: {
                        ...formData.logo,
                        // Logo integration will be added in future iteration
                        logoDataUri: formData.logo.logoDataUri || ''
                    }
                }
            };

            console.log('📤 Sending payload to PDF generator:', {
                selectedLayout,
                hasFormDataLogo: !!payload.formData.logo.logoDataUri,
                logoDataUriLength: payload.formData.logo.logoDataUri?.length
            });

            const response = await fetch('/api/business-cards/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            // Handle PDF download
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `business-card-${formData.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('✅ Business card PDF generated and downloaded successfully');

            // Close modal after successful generation
            onClose();

        } catch (err) {
            console.error('❌ Business card generation failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate business card');
        } finally {
            setIsGenerating(false);
        }
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep('info');
            setSelectedLayout(null);
            setIsGenerating(false);
            setError(null);
            setFormData({
                companyName: '',
                name: '',
                title: '',
                logo: {
                    logoId: '',
                    logoDataUri: '',
                    position: 'auto'
                },
                phones: [],
                emails: [],
                addresses: [],
                websites: [],
                socialMedia: []
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-900">Create Business Card</h1>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
                        aria-label="Close modal"
                    >
                        ×
                        <div className="absolute inset-0 rounded-full bg-gray-200 scale-0 hover:scale-110 transition-transform duration-200 ease-out opacity-20 -z-10"></div>
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

                {/* Step Content - Scrollable */}
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

                        {currentStep === 'layout' && (
                            <BusinessCardLayoutSelection
                                selectedLayout={selectedLayout}
                                setSelectedLayout={setSelectedLayout}
                                formData={formData}
                                onBack={() => setCurrentStep('info')}
                                onNext={() => setCurrentStep('preview')}
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
    );
};