// FILE: src/app/components/PreviewAndGenerate.tsx
// PURPOSE: Step 3 - Preview and generate PDF from existing preview element
// UPDATED: Now captures the existing preview instead of re-rendering

'use client';

import { useState, useEffect } from 'react';
import { PreviewAndGenerateProps } from '../../../types/businessCard';
import { getBusinessCardLayoutById } from '../../data/businessCardLayouts';
import { generateInjectedHTML } from '../utils/businessCardInjection';
import { generateBusinessCardPDFFromExistingPreview } from '@/lib/htmlBusinessCardToPDF';

export const PreviewAndGenerate = ({
                                       selectedLayout,
                                       formData,
                                       isGenerating,
                                       onBack,
                                       onGenerateStart,
                                       onGenerateSuccess,
                                       onGenerateError
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

                // Generate fully injected HTML
                console.log('📝 Injecting contact info and logo');
                const html = generateInjectedHTML(layout, formData);

                setInjectedHTML(html);

                console.log('✅ Step 3 Preview - Native HTML ready');
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

    // UPDATED: Capture the existing preview element instead of re-rendering
    const handleGeneratePDF = async () => {
        console.log('🎴 ========================================');
        console.log('🎴 User clicked Generate PDF');
        console.log('🎴 ========================================');

        // Start generation - set loading state
        onGenerateStart();

        try {
            console.log('📄 Generating PDF by capturing .business-card-preview element');

            // Capture the existing preview element
            const pdfDataUri = await generateBusinessCardPDFFromExistingPreview(
                10, // cardCount
                '.business-card-preview' // selector for the preview element
            );

            console.log('✅ PDF generation successful');

            // Create download
            console.log('💾 Creating download link');
            const link = document.createElement('a');
            link.href = pdfDataUri;
            link.download = `business-cards-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ PDF download initiated');
            console.log('🎴 ========================================');

            // Success - update state to show completion
            onGenerateSuccess();

        } catch (error) {
            console.error('❌ ========================================');
            console.error('❌ PDF generation failed:', error);
            console.error('❌ ========================================');

            const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.';
            onGenerateError(errorMessage);
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
                <h3 className="text-2xl font-bold text-gray-900 my-2">Review Your Business Card</h3>
                <p className="text-gray-600 hidden">Check the preview and generate your printable PDF</p>
            </div>

            {/* Selected Layout Info */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-gray-900">{layout.name}</h4>
                        <p className="text-base text-gray-600">{layout.catalogId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        layout.theme === 'minimalistic' ? 'bg-lime-100 text-lime-800' :
                            layout.theme === 'minimalist' ? 'bg-lime-100 text-lime-800' :
                                layout.theme === 'modern' ? 'bg-sky-100 text-sky-800' :
                                    layout.theme === 'trendy' ? 'bg-purple-100 text-purple-800' :
                                        layout.theme === 'classic' ? 'bg-amber-100 text-amber-800' :
                                            layout.theme === 'creative' ? 'bg-pink-100 text-pink-800' :
                                                layout.theme === 'professional' ? 'bg-indigo-100 text-indigo-800' :
                                                    layout.theme === 'luxury' ? 'bg-yellow-100 text-yellow-800' :
                                                        layout.theme === 'tech' ? 'bg-green-100 text-green-800' :
                                                            layout.theme === 'vintage' ? 'bg-orange-100 text-orange-800' :
                                                                layout.theme === 'artistic' ? 'bg-red-100 text-red-800' :
                                                                    layout.theme === 'corporate' ? 'bg-cyan-100 text-cyan-800' :
                                                                        'bg-slate-100 text-slate-800'
                    }`}>
            {layout.theme}
        </span>
                </div>
            </div>

            {/* Preview Section */}
            <div className="flex justify-center">
                <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl shadow-lg p-12 min-h-[400px] w-[750px] mx-auto flex items-center justify-center">
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
                            {/* CRITICAL: This div will be captured for PDF generation */}
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
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hidden">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">PDF Specifications</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Format: Avery 8371 (10 cards per sheet)</li>
                                <li>• Paper: US Letter (8.5" × 11")</li>
                                <li>• Card Size: 3.5" × 2" (Standard)</li>
                                <li>• Layout: 2 columns × 5 rows</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Print Instructions */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hidden">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">Printing Tips</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Use Avery 8371 perforated sheets</li>
                                <li>• Print at 100% scale (no shrinking)</li>
                                <li>• Use color printer for best results</li>
                                <li>• Check alignment with test print</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
                <button
                    onClick={onBack}
                    disabled={isGenerating}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    ← Back to Form
                </button>

                <button
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || !injectedHTML}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Generate PDF (10 Cards)</span>
                        </>
                    )}
                </button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
                <p>Your PDF will contain 10 business cards ready to print on Avery 8371 sheets</p>
            </div>
        </div>
    );
};