'use client';

import { PreviewAndGenerateProps } from '../../../types/businessCard';
import { BUSINESS_CARD_TEMPLATES } from '@/data/businessCardTemplates';
import { TemplatePreview } from './TemplatePreview';

export const PreviewAndGenerate = ({
                                       selectedTemplate,
                                       formData,
                                       isGenerating,
                                       onBack,
                                       onGenerate
                                   }: PreviewAndGenerateProps) => {

    const template = BUSINESS_CARD_TEMPLATES.find(t => t.id === selectedTemplate);

    if (!template) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">Template not found. Please go back and select a template.</p>
            </div>
        );
    }

    // Calculate preview scale to fit the available container width
    // The container has padding of 12 (p-12 = 48px total), so available width is container width - 96px
    // Target the container to be around 500-600px wide for a good preview size
    const containerWidth = 600; // Target container width
    const availableWidth = containerWidth - 96; // Subtract padding (p-12 = 48px on each side)

    // Convert mm to pixels and calculate scale
    const MM_TO_PX = 3.7795;
    const templateWidthPx = template.template.cardWidth * MM_TO_PX;
    const previewScale = availableWidth / templateWidthPx;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Business Card</h3>
                <p className="text-gray-600">Check the preview and generate your printable PDF</p>
            </div>

            {/* Large Preview - Now responsive and properly sized */}
            <div className="flex justify-center">
                <div
                    className="bg-gradient-to-b from-gray-50 to-gray-100 p-12 rounded-2xl shadow-lg"
                    style={{ maxWidth: `${containerWidth}px` }}
                >
                    <div className="bg-white shadow-xl rounded-lg overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-300">
                        {/* Remove fixed dimensions to allow full container usage */}
                        <TemplatePreview
                            template={template.template}
                            templateId={selectedTemplate}
                            cardData={formData}
                            scale={previewScale}
                        />
                    </div>
                </div>
            </div>

            {/* Template Info */}
            <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Selected Template</h4>
                        <p className="text-gray-700">{template.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Card Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Size:</strong> 3.5" × 2" (Standard)</p>
                            <p><strong>Format:</strong> Horizontal business card</p>
                            <p><strong>Company:</strong> {formData.companyName}</p>
                            <p><strong>Name:</strong> {formData.name}</p>
                            {formData.title && <p><strong>Title:</strong> {formData.title}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Generation Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">What you'll get:</h4>
                <ul className="text-blue-800 space-y-2 text-sm">
                    <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>PDF with 10 business cards per sheet (Avery 8371 compatible)</span>
                    </li>
                    <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Ready to print on standard 8.5" × 11" paper or card stock</span>
                    </li>
                    <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>High-quality resolution (300 DPI) for professional printing</span>
                    </li>
                    <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Accurate preview - what you see is what you print</span>
                    </li>
                </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    disabled={isGenerating}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    ← Back to Templates
                </button>

                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Generate PDF</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};