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

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Business Card</h3>
                <p className="text-gray-600">Check the preview and generate your printable PDF</p>
            </div>

            {/* Large Preview */}
            <div className="flex justify-center">
                <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-12 rounded-2xl shadow-lg">
                    <div className="bg-white shadow-xl rounded-lg overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-300">
                        <div style={{ width: '350px', height: '200px' }}>
                            <TemplatePreview
                                template={template.template}
                                cardData={formData}
                                scale={1.4}
                            />
                        </div>
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
                        <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>{formData.name}</strong> {formData.title && `- ${formData.title}`}</p>
                            <p>{formData.companyName}</p>
                            {formData.emails.filter(e => e.value).length > 0 && (
                                <p>{formData.emails.find(e => e.isPrimary)?.value || formData.emails[0].value}</p>
                            )}
                            {formData.phones.filter(p => p.value).length > 0 && (
                                <p>{formData.phones.find(p => p.isPrimary)?.value || formData.phones[0].value}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Generation Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    What You'll Get
                </h4>
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
                        <span>High-quality resolution (300 DPI) suitable for professional printing</span>
                    </li>
                    <li className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Compatible with Avery templates available at office supply stores</span>
                    </li>
                </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
                <button
                    onClick={onBack}
                    disabled={isGenerating}
                    className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                    <span>←</span>
                    <span>Back</span>
                </button>

                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 min-w-[200px] justify-center"
                >
                    {isGenerating ? (
                        <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                            </svg>
                            <span>Generate PDF</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};