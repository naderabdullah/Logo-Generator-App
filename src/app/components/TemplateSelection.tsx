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
                                    templateId={template.id}
                                    cardData={formData}
                                    scale={0.4} // Small preview for selection
                                />
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
                ))}
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