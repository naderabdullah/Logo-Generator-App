// FILE: src/app/components/PreviewAndGenerate.tsx
// PURPOSE: Step 3 - Preview and generate PDF from injected business card HTML
// UPDATED: Now uses native HTML preview (same as Step 2) for WYSIWYG consistency

'use client';

import { useState, useEffect } from 'react';
import { PreviewAndGenerateProps } from '../../../types/businessCard';
import { getBusinessCardLayoutById } from '../../data/businessCardLayouts';
import { generateInjectedHTML } from '../utils/businessCardInjection';
import { generateBusinessCardPDFFromHTML } from '@/lib/htmlBusinessCardToPDF';

export const PreviewAndGenerate = ({
                                       selectedLayout,    // catalogId like "BC-001"
                                       formData,
                                       isGenerating,
                                       onBack,
                                       onGenerate
                                   }: PreviewAndGenerateProps) => {

    const [injectedHTML, setInjectedHTML] = useState<string>('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Get the selected layout
    const layout = getBusinessCardLayoutById(selectedLayout);

    useEffect(() => {
        if (!layout) {
            console.error('❌ Step 3 Preview - Layout not found:', selectedLayout);
            setPreviewError('Layout not found');
            return;
        }

        const generatePreview = async () => {
            try {
                setPreviewLoading(true);
                setPreviewError(null);

                console.log('🎴 ========================================');
                console.log('🎴 Step 3: Generating NATIVE HTML preview');
                console.log('🎴 ========================================');
                console.log('📋 Layout:', layout.catalogId, '-', layout.name);

                // Generate fully injected HTML (same utilities as Step 2)
                console.log('📝 Injecting contact info and logo using same utilities as Step 2');
                const html = generateInjectedHTML(layout, formData);

                setInjectedHTML(html);

                console.log('✅ Step 3 Preview - Native HTML ready (matching Step 2 method)');
                console.log('🎴 ========================================');

            } catch (error) {
                console.error('❌ Step 3 Preview - Generation failed:', error);
                setPreviewError('Failed to generate preview');
            } finally {
                setPreviewLoading(false);
            }
        };

        generatePreview();

    }, [layout, formData, selectedLayout]);

    // Handle PDF generation (unchanged - still uses html2canvas)
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

            console.log('📄 Generating PDF with 10 cards using html2canvas');
            const pdfDataUri = await generateBusinessCardPDFFromHTML(injectedHTML, 10);

            // Create download
            console.log('💾 Creating download link');
            const link = document.createElement('a');
            link.href = pdfDataUri;
            link.download = `business-cards-${Date.now()}.pdf`;
            link.click();

            console.log('✅ PDF download initiated successfully');
            console.log('🎴 ========================================');

        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            alert('❌ Failed to generate PDF. Please try again.');
        }
    };

    if (!layout) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-600">Layout not found: {selectedLayout}</p>
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

            {/* Preview Section - NOW USING NATIVE HTML (SAME AS STEP 2) */}
            <div className="flex justify-center">
                <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl shadow-lg p-16 min-h-[400px] flex items-center justify-center">
                    {previewLoading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Generating preview...</p>
                        </div>
                    ) : previewError ? (
                        <div className="text-center py-20 text-red-600">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">{previewError}</p>
                        </div>
                    ) : injectedHTML ? (
                        <div>
                            {/* UNIFIED PREVIEW: Native HTML rendering (EXACT same as Step 2 modal) */}
                            <div
                                className="business-card-preview shadow-lg"
                                style={{
                                    transform: 'scale(1.5)',
                                    transformOrigin: 'center',
                                }}
                                dangerouslySetInnerHTML={{ __html: injectedHTML }}
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
                                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Avery 8371 format</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>10 cards per sheet</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>US Letter size</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Print Quality */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-3">Print Ready</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
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
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            <span>Generate PDF (10 Cards)</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};