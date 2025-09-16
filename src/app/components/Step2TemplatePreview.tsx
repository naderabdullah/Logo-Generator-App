'use client';

import { TemplateSelectionProps } from '../../../types/businessCard';
import { BUSINESS_CARD_TEMPLATES } from '@/data/businessCardTemplates';
import { TemplatePreview } from './TemplatePreview';
import { useState, useEffect } from 'react';
import { generateBusinessCardPreview } from '../../lib/businessCardGenerator';

// Isolated preview component for step 2 only
const Step2TemplatePreview = ({ template, templateId, cardData, scale }: any) => {
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!template || !templateId) return;

        let isMounted = true;
        let currentBlobUrl: string | null = null;

        const generatePreview = async () => {
            if (!isMounted) return;

            setIsLoading(true);
            setError(null);

            try {
                const pdfDataUri = await generateBusinessCardPreview(templateId, cardData, scale);

                if (!isMounted) return;

                if (pdfDataUri) {
                    const base64Data = pdfDataUri.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    currentBlobUrl = URL.createObjectURL(blob);

                    if (isMounted) {
                        setPdfBlobUrl(currentBlobUrl);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Step 2 PDF preview generation failed:', err);
                    setError('Preview generation failed');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        generatePreview();

        return () => {
            isMounted = false;
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
        };
    }, [template, templateId, cardData, scale]);

    if (!template) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                No template selected
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-500 text-xs mt-1">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !pdfBlobUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                {error || 'Preview unavailable'}
            </div>
        );
    }

    const aspectRatio = template.cardWidth / template.cardHeight;
    const MM_TO_PX = 3.7795;
    const actualWidth = template.cardWidth * MM_TO_PX * scale;
    const actualHeight = template.cardHeight * MM_TO_PX * scale;

    return (
        <div className="w-full h-full flex items-center justify-center">
            <iframe
                src={pdfBlobUrl}
                style={{
                    width: `${actualWidth}px`,
                    height: `${actualHeight}px`,
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                }}
                title="Step 2 Business Card Preview"
            />
        </div>
    );
};

export const TemplateSelection = ({
                                      selectedTemplate,
                                      setSelectedTemplate,
                                      formData,
                                      onBack,
                                      onNext
                                  }: TemplateSelectionProps) => {

    // Simple scale that triggers PDF preview - increased to make preview larger
    const getPreviewScale = () => {
        return 1.4; // Increased from 1.0 to enlarge preview
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Design</h3>
                <p className="text-gray-600">Select a business card template that matches your style</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {BUSINESS_CARD_TEMPLATES.map(template => {
                    const previewScale = getPreviewScale(); // Fixed scale for all templates

                    return (
                        <div
                            key={template.id}
                            className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                                selectedTemplate === template.id
                                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedTemplate(template.id)}
                        >
                            {/* Template Preview - Larger constraint to enlarge preview only */}
                            <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden shadow-sm" style={{ minHeight: '160px' }}>
                                <div className="p-2 h-full flex items-center justify-center">
                                    <div style={{ maxWidth: '300px', maxHeight: '170px', overflow: 'hidden' }}>
                                        <Step2TemplatePreview
                                            template={template.template}
                                            templateId={template.id}
                                            cardData={formData}
                                            scale={previewScale}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Template Info */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                                    {template.isDefault && (
                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                            Popular
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">{template.description}</p>
                                <div className="flex items-center justify-center">
                                    <button className={`w-full py-2 px-4 rounded-lg transition-colors ${
                                        selectedTemplate === template.id
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}>
                                        {selectedTemplate === template.id ? 'Selected' : 'Select Template'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
                <button
                    onClick={onBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ← Back to Info
                </button>

                <button
                    onClick={onNext}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Preview Card →
                </button>
            </div>
        </div>
    );
};