'use client';

import { TemplateSelectionProps } from '../../../types/businessCard';
import { BUSINESS_CARD_TEMPLATES } from '@/data/businessCardTemplates';
import { TemplatePreview } from './TemplatePreview';

export const TemplateSelection = ({
                                      selectedTemplate,
                                      setSelectedTemplate,
                                      formData,
                                      onBack,
                                      onNext
                                  }: TemplateSelectionProps) => {

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Design</h3>
                <p className="text-gray-600">Select a business card template that matches your style</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {BUSINESS_CARD_TEMPLATES.map(template => (
                    <div
                        key={template.id}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                            selectedTemplate === template.id
                                ? 'border-purple-600 bg-purple-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                    >
                        {/* Template Preview */}
                        <div className="aspect-[3.5/2] bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden shadow-sm">
                            <div className="p-2">
                                <TemplatePreview
                                    template={template.template}
                                    cardData={formData}
                                    scale={0.4} // Small preview for selection
                                />
                            </div>
                        </div>

                        {/* Template Info */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                                {selectedTemplate === template.id && (
                                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            {template.isDefault && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  Most Popular
                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
                <button
                    onClick={onBack}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                    <span>←</span>
                    <span>Back</span>
                </button>
                <button
                    onClick={onNext}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                    <span>Preview & Generate</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );
};