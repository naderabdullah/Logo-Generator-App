// FILE: src/app/components/BusinessCardTileGrid.tsx
// PURPOSE: EXACT REPLICA of wizard Step 2 grid/modal - reusable for admin and wizard
// SOURCE: BusinessCardLayoutSelection.tsx (wizard step 2 - source of truth)
// CHANGES: Only parameterized mode-based behavior (view vs select), preserved ALL styling/structure

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { BusinessCardLayout } from '@/data/businessCardLayouts';
import { StoredLogo } from '@/app/utils/indexedDBUtils';
import { injectLogoIntoBusinessCard, validateLogoForInjection } from '@/app/utils/businessCardLogoUtils';
import { getAllThemes } from '@/data/businessCardLayouts';
import { injectContactInfo } from '@/app/utils/businessCardContactUtils';

/**
 * Component mode:
 * - 'view': Read-only admin view (no selection, no injection, modal navigation enabled)
 * - 'select': Wizard step 2 (selection enabled, injection enabled, no modal navigation)
 */
export type BusinessCardTileGridMode = 'view' | 'select';

/**
 * Preview mode (wizard only):
 * - 'generic': Show layout with placeholder data
 * - 'injected': Show layout with client's actual data
 */
export type PreviewMode = 'generic' | 'injected';

export interface BusinessCardTileGridProps {
    /** Component operating mode */
    mode: BusinessCardTileGridMode;

    /** All layouts to display (already filtered by parent) */
    layouts: BusinessCardLayout[];

    /** Currently selected layout (wizard mode only) */
    selectedLayout?: string | null;

    /** Selection callback (wizard mode only) */
    onLayoutSelect?: (catalogId: string) => void;

    /** Form data for injection (wizard mode only) */
    formData?: any;

    /** Logo for injection (wizard mode only) */
    logo?: StoredLogo | null;

    /** Items per page */
    itemsPerPage?: number;

    /** Current page (controlled by parent) */
    currentPage?: number;

    /** Page change callback */
    onPageChange?: (page: number) => void;
}

/**
 * BusinessCardTileGrid - Reusable grid component
 *
 * IMPORTANT: This is an EXACT REPLICA of the wizard Step 2 grid and modal.
 * Only behavior (selection/injection) is parameterized via mode prop.
 * All styling, structure, and layout are identical to the source of truth.
 */
export const BusinessCardTileGrid: React.FC<BusinessCardTileGridProps> = ({
                                                                              mode,
                                                                              layouts,
                                                                              selectedLayout,
                                                                              onLayoutSelect,
                                                                              formData,
                                                                              logo,
                                                                              itemsPerPage = 12,
                                                                              currentPage = 1,
                                                                              onPageChange
                                                                          }) => {
    // ============================================================================
    // STATE - EXACT REPLICA
    // ============================================================================

    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [currentModalIndex, setCurrentModalIndex] = useState(0);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('injected');

    // Use external page if provided, otherwise use internal
    const effectiveCurrentPage = currentPage ?? internalCurrentPage;

    // ============================================================================
    // PAGINATION - EXACT REPLICA
    // ============================================================================

    const paginatedData = useMemo(() => {
        const totalItems = layouts.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (effectiveCurrentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedLayouts = layouts.slice(startIndex, endIndex);

        return {
            layouts: paginatedLayouts,
            totalPages,
            currentPage: effectiveCurrentPage,
            hasNextPage: effectiveCurrentPage < totalPages,
            hasPrevPage: effectiveCurrentPage > 1,
            totalItems
        };
    }, [layouts, effectiveCurrentPage, itemsPerPage]);

    // ============================================================================
    // INJECTION LOGIC - EXACT REPLICA (with allowEnlargedLogo flag)
    // ============================================================================

    const generateEnlargedModalHTML = useCallback((card: BusinessCardLayout): string => {
        try {
            // Extract allowEnlargedLogo flag from card metadata (CRITICAL!)
            const allowEnlargedLogo = card.metadata?.allowEnlargedLogo === true;

            let processedHTML = card.jsx;

            // Inject contact information
            processedHTML = injectContactInfo(processedHTML, formData);

            // Inject logo with allowEnlargedLogo flag
            if (validateLogoForInjection(logo)) {
                processedHTML = injectLogoIntoBusinessCard(processedHTML, logo, {
                    objectFit: 'contain',
                    preserveAspectRatio: true,
                    allowEnlargedLogo: allowEnlargedLogo  // ← CRITICAL FLAG
                });
            }

            return processedHTML;
        } catch (error) {
            console.error('Error generating injected HTML:', error);
            return card.jsx;
        }
    }, [formData, logo]);

    const getModalPreviewHTML = useCallback((card: BusinessCardLayout): string => {
        if (mode === 'view' || previewMode === 'generic') {
            return card.jsx;
        } else {
            return generateEnlargedModalHTML(card);
        }
    }, [mode, previewMode, generateEnlargedModalHTML]);

    const getGridCardHTML = useCallback((layout: BusinessCardLayout): string => {
        if (mode === 'view') {
            return layout.jsx;
        } else {
            return generateEnlargedModalHTML(layout);
        }
    }, [mode, generateEnlargedModalHTML]);

    // ============================================================================
    // EVENT HANDLERS - EXACT REPLICA
    // ============================================================================

    const handlePageChange = useCallback((newPage: number) => {
        if (onPageChange) {
            onPageChange(newPage);
        } else {
            setInternalCurrentPage(newPage);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [onPageChange]);

    const handleLayoutSelect = useCallback((layout: BusinessCardLayout) => {
        if (mode === 'select' && onLayoutSelect) {
            onLayoutSelect(layout.catalogId);
        }
    }, [mode, onLayoutSelect]);

    const handleCardClick = useCallback((layout: BusinessCardLayout) => {
        const index = layouts.findIndex(l => l.catalogId === layout.catalogId);
        setSelectedCard(layout);
        setCurrentModalIndex(index);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    }, [layouts]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCard(null);
        setPreviewMode('injected');
        document.body.style.overflow = '';
    }, []);

    const navigateToPrevious = useCallback(() => {
        if (currentModalIndex > 0) {
            const newIndex = currentModalIndex - 1;
            setCurrentModalIndex(newIndex);
            setSelectedCard(layouts[newIndex]);
        }
    }, [currentModalIndex, layouts]);

    const navigateToNext = useCallback(() => {
        if (currentModalIndex < layouts.length - 1) {
            const newIndex = currentModalIndex + 1;
            setCurrentModalIndex(newIndex);
            setSelectedCard(layouts[newIndex]);
        }
    }, [currentModalIndex, layouts]);

    // ============================================================================
    // HELPER FUNCTIONS - EXACT REPLICA
    // ============================================================================

    const getPageNumbers = (): number[] => {
        const totalPages = paginatedData.totalPages;
        const currentPage = paginatedData.currentPage;
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    // ============================================================================
    // RENDER - EXACT REPLICA OF WIZARD STEP 2
    // ============================================================================

    return (
        <>
            {/* Layout Grid - EXACT REPLICA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedData.layouts.map(layout => (
                    <div
                        key={layout.catalogId}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                            mode === 'select' && selectedLayout === layout.catalogId
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => handleCardClick(layout)}
                    >
                        {/* Preview - EXACT REPLICA */}
                        <div className="mb-4 bg-gray-100 rounded-lg p-4 flex items-center justify-center overflow-hidden">
                            <div
                                className="business-card-preview shadow-sm"
                                style={{
                                    transform: 'scale(0.85)',  // EXACT from wizard
                                    transformOrigin: 'center',
                                }}
                                dangerouslySetInnerHTML={{ __html: getGridCardHTML(layout) }}
                            />
                        </div>

                        {/* Layout Info - EXACT REPLICA */}
                        <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                        {layout.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-mono">{layout.catalogId}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded shrink-0 ${
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
                                                                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {layout.theme}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{layout.description}</p>

                            {/* Feature Tags - EXACT REPLICA */}
                            {layout.metadata?.features && layout.metadata.features.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {layout.metadata.features.slice(0, 3).map((feature, idx) => (
                                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                            {feature.replace('-', ' ')}
                                        </span>
                                    ))}
                                    {layout.metadata.features.length > 3 && (
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                            +{layout.metadata.features.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                {/* Select Button - wizard only */}
                                {mode === 'select' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLayoutSelect(layout);
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                            selectedLayout === layout.catalogId
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        }`}
                                    >
                                        {selectedLayout === layout.catalogId ? 'Selected ✓' : 'Select'}
                                    </button>
                                )}

                                {/* Preview Button - both modes */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCardClick(layout);
                                    }}
                                    className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
                                        mode === 'view' ? 'flex-1' : ''
                                    }`}
                                >
                                    <svg className="w-5 h-5 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enlarged Modal - EXACT REPLICA */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header - EXACT REPLICA (navigation in HEADER, not footer) */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{selectedCard.name}</h2>
                                <p className="text-base text-gray-700 font-mono font-semibold">
                                    {selectedCard.catalogId}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Navigation arrows - CONDITIONAL (admin only) */}
                                {mode === 'view' && (
                                    <>
                                        <button
                                            onClick={navigateToPrevious}
                                            disabled={currentModalIndex === 0}
                                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Previous"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                                            </svg>
                                        </button>

                                        <button
                                            onClick={navigateToNext}
                                            disabled={currentModalIndex === layouts.length - 1}
                                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Next"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                            </svg>
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={closeModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors ml-2"
                                    title="Close"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - EXACT REPLICA */}
                        <div className="p-6 space-y-6">
                            {/* Preview Mode Indicator - CONDITIONAL (wizard only) */}
                            {mode === 'select' && (
                                <div className="flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                                        <span className={`font-medium ${previewMode === 'generic' ? 'text-purple-600' : 'text-gray-500'}`}>
                                            Generic
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className={`font-medium ${previewMode === 'injected' ? 'text-purple-600' : 'text-gray-500'}`}>
                                            Client's Info
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Business Card Preview - EXACT REPLICA */}
                            <div className="flex justify-center items-center bg-gray-50 rounded-xl p-8 min-h-[300px]">
                                <div
                                    className="business-card-preview shadow-xl"
                                    style={{
                                        transform: 'scale(1.5)',  // EXACT from wizard
                                        transformOrigin: 'center',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: getModalPreviewHTML(selectedCard) }}
                                />
                            </div>

                            {/* Metadata - EXACT REPLICA */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Theme</h4>
                                    <p className="text-base font-medium text-gray-900">{selectedCard.theme}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Style</h4>
                                    <p className="text-base font-medium text-gray-900">{selectedCard.style.replace('-', ' ')}</p>
                                </div>
                            </div>

                            {selectedCard.description && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                                    <p className="text-base text-gray-700">{selectedCard.description}</p>
                                </div>
                            )}

                            {selectedCard.metadata?.features && selectedCard.metadata.features.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Features</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCard.metadata.features.map((feature, idx) => (
                                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Footer - EXACT REPLICA */}
                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                {/* Preview Toggle - CONDITIONAL (wizard only) */}
                                {mode === 'select' && (
                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={previewMode === 'injected'}
                                                    onChange={() => setPreviewMode(prev => prev === 'injected' ? 'generic' : 'injected')}
                                                />
                                                <div className={`block w-14 h-8 rounded-full transition-colors ${
                                                    previewMode === 'injected' ? 'bg-purple-600' : 'bg-gray-300'
                                                }`}></div>
                                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                                                    previewMode === 'injected' ? 'translate-x-6' : 'translate-x-0'
                                                }`}></div>
                                            </div>
                                            <div className="ml-3 text-sm font-medium text-gray-700">
                                                {previewMode === 'injected' ? `Client's Info` : 'Generic'}
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Select Button - CONDITIONAL (wizard only) */}
                                {mode === 'select' && onLayoutSelect && (
                                    <button
                                        onClick={() => {
                                            handleLayoutSelect(selectedCard);
                                            closeModal();
                                        }}
                                        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                                            selectedLayout === selectedCard.catalogId
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                    >
                                        {selectedLayout === selectedCard.catalogId ? 'Selected ✓' : 'Select This Layout'}
                                    </button>
                                )}

                                <button
                                    onClick={closeModal}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BusinessCardTileGrid;