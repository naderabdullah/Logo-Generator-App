// FILE: src/app/components/PreviewAndGenerate.tsx
// PURPOSE: Step 3 - Preview and generate PDF from injected business card HTML
// UPDATED: Now uses HTML-to-PDF conversion instead of template system

'use client';

import { useState, useEffect } from 'react';
import { PreviewAndGenerateProps } from '../../../types/businessCard';
import { getBusinessCardLayoutById } from '../../data/businessCardLayouts';
import { generateInjectedHTML } from '../utils/businessCardInjection';
import { generateBusinessCardPDFFromHTML, generateCardPreview } from '@/lib/htmlBusinessCardToPDF';

export const PreviewAndGenerate = ({
                                       selectedLayout,    // catalogId like "BC-001"
                                       formData,
                                       isGenerating,
                                       onBack,
                                       onGenerate
                                   }: PreviewAndGenerateProps) => {

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [injectedHTML, setInjectedHTML] = useState<string>('');

    // Get the selected layout
    const layout = getBusinessCardLayoutById(selectedLayout);

    useEffect(() => {
        if (!layout) {
            console.error('❌ Layout not found:', selectedLayout);
            return;
        }

        const generatePreview = async () => {
            try {
                setPreviewLoading(true);
                setPreviewError(null);

                console.log('🎴 Step 3: Generating preview for layout:', layout.catalogId);

                // Generate fully injected HTML (logo comes from formData.logo)
                console.log('📝 Generating injected HTML with logo and contact info from formData');
                const html = generateInjectedHTML(layout, formData);
                setInjectedHTML(html);

                // Generate preview image
                console.log('🖼️ Generating preview image');
                const preview = await generateCardPreview(html);
                setPreviewImage(preview);

                console.log('✅ Preview generated successfully');

            } catch (error) {
                console.error('❌ Preview generation failed:', error);
                setPreviewError('Failed to generate preview');
            } finally {
                setPreviewLoading(false);
            }
        };

        generatePreview();

    }, [layout, formData, selectedLayout]);

    // Handle PDF generation
    const handleGeneratePDF = async () => {
        try {
            console.log('🎴 ========================================');
            console.log('🎴 User clicked Generate PDF');
            console.log('🎴 ========================================');

            if (!injectedHTML) {
                throw new Error('No card content available');
            }

            // Call parent's onGenerate to set isGenerating state
            onGenerate();

            console.log('📄 Generating PDF with 10 cards');
            const pdfDataUri = await generateBusinessCardPDFFromHTML(injectedHTML, 10);

            // Create download
            console.log('💾 Creating download link');
            const link = document.createElement('a');
            link.href = pdfDataUri;
            link.download = `business-cards-${Date.now()}.pdf`;
            link.click();

            console.log('✅ PDF download initiated successfully');

            // Show success message
            // alert('✅ Business cards PDF generated successfully! Check your downloads folder.');

        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            // alert('❌ Failed to generate PDF. Please try again.');
        }
    };

    // Error state: Layout not found
    if (!layout) {
        return (
            <div className="text-center py-8">
                <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-red-600 font-medium">Layout not found</p>
                <p className="text-gray-600 text-sm mt-2">Please go back and select a layout.</p>
                <button
                    onClick={onBack}
                    className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    ← Back to Layouts
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Business Card</h3>
                <p className="text-gray-600">Check the preview and generate your printable PDF</p>
            </div>

            {/* Selected Layout Info */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-gray-900">{layout.name}</h4>
                        <p className="text-sm text-gray-600">{layout.catalogId} • {layout.theme}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        layout.theme === 'modern' ? 'bg-blue-100 text-blue-800' :
                            layout.theme === 'minimalist' ? 'bg-gray-100 text-gray-800' :
                                layout.theme === 'bold' ? 'bg-orange-100 text-orange-800' :
                                    'bg-purple-100 text-purple-800'
                    }`}>
                        {layout.theme}
                    </span>
                </div>
            </div>

            {/* Preview Section */}
            <div className="flex justify-center">
                <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-12 rounded-2xl shadow-lg max-w-2xl">
                    {previewLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                            <p className="text-gray-600">Generating preview...</p>
                        </div>
                    ) : previewError ? (
                        <div className="text-center py-20">
                            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-600">Preview generation failed</p>
                            <p className="text-sm text-gray-600 mt-2">{previewError}</p>
                        </div>
                    ) : previewImage ? (
                        <div className="bg-white shadow-xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                            <img
                                src={previewImage}
                                alt="Business Card Preview"
                                className="w-full h-auto"
                            />
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            No preview available
                        </div>
                    )}
                </div>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDF Specifications */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-3">PDF Format</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                                    Avery 8371 compatible
                                </li>
                                <li className="flex items-center">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                                    US Letter (8.5" × 11")
                                </li>
                                <li className="flex items-center">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                                    10 cards per sheet
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* What You'll Get */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">What you'll get:</h4>
                    <ul className="text-blue-800 space-y-2 text-sm">
                        <li className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>PDF with 10 business cards per sheet</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Ready to print on card stock</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>High-quality resolution (300 DPI)</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>What you see is what you print</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    disabled={isGenerating}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    ← Back to Layouts
                </button>

                <button
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || previewLoading || !!previewError}
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