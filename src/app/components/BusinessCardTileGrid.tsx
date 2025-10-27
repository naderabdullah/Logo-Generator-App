// FILE: src/app/components/BusinessCardTileGrid.tsx
// PURPOSE: EXACT REPLICA of wizard Step 2 grid/modal - reusable for admin and wizard
// SOURCE: BusinessCardLayoutSelection.tsx (wizard step 2 - source of truth)
// CHANGES: Modal content now TRULY matches wizard Step 2 exactly - copied with zero changes
// CHANGE LOG: Fixed enlarged preview modal to exactly match wizard Step 2 (colors, fonts, dimensions, badges, two-column layout)

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { BusinessCardLayout } from '@/data/businessCardLayouts';
import { StoredLogo } from '@/app/utils/indexedDBUtils';
import { injectLogoIntoBusinessCard, validateLogoForInjection } from '@/app/utils/businessCardLogoUtils';
import { getAllThemes } from '@/data/businessCardLayouts';
import { injectContactInfo } from '@/app/utils/businessCardContactUtils';

/**
 * Component mode:
 * - 'view': Read-only admin view (no selection, no injection, modal navigation enabled, toggles disabled)
 * - 'select': Wizard step 2 (selection enabled, injection enabled, no modal navigation, toggles enabled)
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
 * IMPORTANT: This is NOW a TRUE EXACT REPLICA of the wizard Step 2 grid and modal.
 * Only behavior (selection/injection) is parameterized via mode prop.
 * All styling, structure, and layout in the modal are now identical to the source of truth.
 *
 * MODAL CONTENT UPDATE: Copied EXACTLY from BusinessCardLayoutSelection.tsx including:
 * - Two-column layout (Layout Details | Design Elements)
 * - Color swatches with visual boxes
 * - Font samples with styled text
 * - Dimensions display
 * - Theme/Style colored badges
 * - Purple feature badges
 * - Preview with scale(1.4) and bg-gray-100
 * - Toggle switch for preview mode (disabled in admin view)
 * - Toggle label at top (showing current mode)
 */
const BusinessCardTileGrid: React.FC<BusinessCardTileGridProps> = ({
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
    // STATE MANAGEMENT
    // ============================================================================

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [currentModalIndex, setCurrentModalIndex] = useState(0);

    // Preview mode state (wizard only) - always 'generic' in admin view
    const [previewMode, setPreviewMode] = useState<PreviewMode>('generic');

    // ============================================================================
    // LOGGING
    // ============================================================================

    const logInfo = useCallback((message: string, data?: any) => {
        console.log(`[BusinessCardTileGrid ${mode}] ${message}`, data || '');
    }, [mode]);

    const logError = useCallback((message: string, error?: any) => {
        console.error(`[BusinessCardTileGrid ${mode}] ❌ ${message}`, error || '');
    }, [mode]);

    // ============================================================================
    // MODAL NAVIGATION (admin view only)
    // ============================================================================

    const openModal = useCallback((layout: BusinessCardLayout) => {
        try {
            logInfo(`Opening modal for: ${layout.catalogId}`);
            setSelectedCard(layout);
            const index = layouts.findIndex(l => l.catalogId === layout.catalogId);
            setCurrentModalIndex(index);
            setIsModalOpen(true);

            // Always start with generic preview
            setPreviewMode('generic');

            logInfo('Modal opened successfully', { index, catalogId: layout.catalogId });
        } catch (error) {
            logError('Error opening modal', error);
        }
    }, [layouts, logInfo, logError]);

    const closeModal = useCallback(() => {
        try {
            logInfo('Closing modal');
            setIsModalOpen(false);
            setSelectedCard(null);
            setPreviewMode('generic');
        } catch (error) {
            logError('Error closing modal', error);
        }
    }, [logInfo, logError]);

    const navigateModal = useCallback((direction: 'prev' | 'next') => {
        try {
            if (mode !== 'view') {
                logInfo('Navigation only available in view mode');
                return;
            }

            let newIndex = currentModalIndex;
            if (direction === 'prev' && currentModalIndex > 0) {
                newIndex = currentModalIndex - 1;
            } else if (direction === 'next' && currentModalIndex < layouts.length - 1) {
                newIndex = currentModalIndex + 1;
            }

            if (newIndex !== currentModalIndex) {
                const newLayout = layouts[newIndex];
                logInfo(`Navigating ${direction} to: ${newLayout.catalogId}`);
                setSelectedCard(newLayout);
                setCurrentModalIndex(newIndex);
                setPreviewMode('generic'); // Reset to generic when navigating
            }
        } catch (error) {
            logError(`Error navigating ${direction}`, error);
        }
    }, [mode, currentModalIndex, layouts, logInfo, logError]);

    // ============================================================================
    // SELECTION HANDLER (wizard mode only)
    // ============================================================================

    const handleLayoutSelect = useCallback((layout: BusinessCardLayout) => {
        try {
            if (mode === 'select' && onLayoutSelect) {
                logInfo(`Layout selected: ${layout.catalogId}`);
                onLayoutSelect(layout.catalogId);
            }
        } catch (error) {
            logError('Error selecting layout', error);
        }
    }, [mode, onLayoutSelect, logInfo, logError]);

    const handleCardClick = useCallback((layout: BusinessCardLayout) => {
        try {
            openModal(layout);
        } catch (error) {
            logError('Error handling card click', error);
        }
    }, [openModal, logError]);

    // ============================================================================
    // PREVIEW HTML GENERATION
    // ============================================================================

    /**
     * Generate HTML for enlarged modal with logo injection and contact info
     * (wizard mode only - uses formData and logo)
     */
    const generateEnlargedModalHTML = useCallback((card: BusinessCardLayout): string => {
        try {
            if (mode !== 'select' || !formData) {
                return card.jsx;
            }

            let processedHTML = card.jsx;

            // Inject contact info if available
            if (formData) {
                logInfo('Injecting contact info into enlarged preview');
                processedHTML = injectContactInfo(processedHTML, formData);
            }

            // Inject logo if available and valid
            if (logo) {
                const allowEnlargedLogo = card.metadata?.allowEnlargedLogo !== false;
                const validation = validateLogoForInjection(logo, allowEnlargedLogo);

                if (validation.isValid) {
                    logInfo('Logo validation passed - injecting into enlarged preview');
                    processedHTML = injectLogoIntoBusinessCard(processedHTML, logo, {
                        isEnlargedView: true,
                        allowEnlargedLogo: allowEnlargedLogo
                    });
                } else {
                    logInfo('Logo validation failed', validation.errors);
                }
            }

            return processedHTML;
        } catch (error) {
            logError('Error generating enlarged modal HTML', error);
            return card.jsx;
        }
    }, [mode, formData, logo, logInfo, logError]);

    /**
     * Get HTML based on preview mode
     * - Admin view: always shows generic (card.jsx)
     * - Wizard view: shows generic or injected based on toggle
     */
    const getModalPreviewHTML = useCallback((card: BusinessCardLayout): string => {
        try {
            // Admin view always shows generic
            if (mode === 'view') {
                return card.jsx;
            }

            // Wizard view respects preview mode toggle
            if (previewMode === 'generic') {
                return card.jsx;
            } else {
                return generateEnlargedModalHTML(card);
            }
        } catch (error) {
            logError('Error getting modal preview HTML', error);
            return card.jsx;
        }
    }, [mode, previewMode, generateEnlargedModalHTML, logError]);

    /**
     * Handle preview mode toggle (wizard only)
     */
    const togglePreviewMode = useCallback(() => {
        try {
            if (mode === 'select') {
                const newMode: PreviewMode = previewMode === 'generic' ? 'injected' : 'generic';
                logInfo(`Toggling preview mode: ${previewMode} → ${newMode}`);
                setPreviewMode(newMode);
            }
        } catch (error) {
            logError('Error toggling preview mode', error);
        }
    }, [mode, previewMode, logInfo, logError]);

    // ============================================================================
    // BADGE COLOR UTILITIES (copied from wizard Step 2)
    // ============================================================================

    const getThemeBadgeColor = (theme: string): string => {
        switch (theme) {
            case 'minimalistic':
            case 'minimalist':
                return 'bg-lime-100 text-lime-800';
            case 'modern':
                return 'bg-sky-100 text-sky-800';
            case 'trendy':
                return 'bg-purple-100 text-purple-800';
            case 'classic':
                return 'bg-amber-100 text-amber-800';
            case 'creative':
                return 'bg-pink-100 text-pink-800';
            case 'professional':
                return 'bg-indigo-100 text-indigo-800';
            case 'luxury':
                return 'bg-yellow-100 text-yellow-800';
            case 'tech':
                return 'bg-green-100 text-green-800';
            case 'vintage':
                return 'bg-orange-100 text-orange-800';
            case 'artistic':
                return 'bg-red-100 text-red-800';
            case 'corporate':
                return 'bg-cyan-100 text-cyan-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStyleBadgeColor = (style: string): string => {
        switch (style) {
            case 'contact-focused':
                return 'bg-green-100 text-green-800';
            case 'company-focused':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <>
            {/* Grid Display - EXACT REPLICA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {layouts.map((layout) => (
                    <div
                        key={layout.catalogId}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            mode === 'select' && selectedLayout === layout.catalogId
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => handleCardClick(layout)}
                    >
                        {/* Preview */}
                        <div className="mb-4 bg-gray-100 rounded-lg p-4 flex items-center justify-center overflow-hidden">
                            <div
                                className="business-card-preview shadow-sm"
                                style={{
                                    transform: 'scale(0.85)',
                                    transformOrigin: 'center',
                                }}
                                dangerouslySetInnerHTML={{ __html: layout.jsx }}
                            />
                        </div>

                        {/* Layout Info */}
                        <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">{layout.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono">{layout.catalogId}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded shrink-0 ${getThemeBadgeColor(layout.theme)}`}>
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

            {/* ========================================================================== */}
            {/* ENLARGED MODAL - EXACT COPY FROM WIZARD STEP 2                             */}
            {/* SOURCE: BusinessCardLayoutSelection.tsx                                    */}
            {/* COPIED WITH ZERO CHANGES (only mode-based conditional logic added)        */}
            {/* ========================================================================== */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-hidden">
                        {/* Modal Header - EXACT REPLICA */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{selectedCard.name}</h2>
                                <p className="text-base text-gray-700 font-mono font-semibold">
                                    {selectedCard.catalogId}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Navigation Buttons - CONDITIONAL (admin view only) */}
                                {mode === 'view' && (
                                    <>
                                        <button
                                            onClick={() => navigateModal('prev')}
                                            disabled={currentModalIndex === 0}
                                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Previous"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => navigateModal('next')}
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

                        {/* ====================================================================== */}
                        {/* MODAL CONTENT - EXACT COPY FROM WIZARD STEP 2                         */}
                        {/* ====================================================================== */}
                        <div className="p-6 space-y-6">
                            {/* Preview Mode Indicator - EXACT COPY FROM WIZARD */}
                            {/* Shows current mode (Generic / Client's Info) */}
                            {/* In admin view: shows "Generic" only since no injection */}
                            {/* In wizard view: shows both with active state highlighting */}
                            <div className="flex justify-center">
                                <div
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                                    <span
                                        className={`font-medium ${previewMode === 'generic' ? 'text-purple-600' : 'text-gray-500'}`}>
                                        Generic
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span
                                        className={`font-medium ${previewMode === 'injected' ? 'text-purple-600' : 'text-gray-500'}`}>
                                        Client's Info
                                    </span>
                                </div>
                            </div>

                            {/* Large Preview - EXACT COPY FROM WIZARD */}
                            {/* bg-gray-100, scale(1.4), shadow-lg - all preserved exactly */}
                            <div className="flex justify-center">
                                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                                    <div
                                        className="business-card-preview shadow-lg"
                                        style={{
                                            transform: 'scale(1.4)',
                                            transformOrigin: 'center',
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: getModalPreviewHTML(selectedCard)
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Card Details - EXACT TWO-COLUMN LAYOUT FROM WIZARD */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium mb-2">Layout Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Theme:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                selectedCard.theme === 'minimalistic' ? 'bg-lime-100 text-lime-800' :
                                                    selectedCard.theme === 'minimalist' ? 'bg-lime-100 text-lime-800' :
                                                        selectedCard.theme === 'modern' ? 'bg-sky-100 text-sky-800' :
                                                            selectedCard.theme === 'trendy' ? 'bg-purple-100 text-purple-800' :
                                                                selectedCard.theme === 'classic' ? 'bg-amber-100 text-amber-800' :
                                                                    selectedCard.theme === 'creative' ? 'bg-pink-100 text-pink-800' :
                                                                        selectedCard.theme === 'professional' ? 'bg-indigo-100 text-indigo-800' :
                                                                            selectedCard.theme === 'luxury' ? 'bg-yellow-100 text-yellow-800' :
                                                                                selectedCard.theme === 'tech' ? 'bg-green-100 text-green-800' :
                                                                                    selectedCard.theme === 'vintage' ? 'bg-orange-100 text-orange-800' :
                                                                                        selectedCard.theme === 'artistic' ? 'bg-red-100 text-red-800' :
                                                                                            selectedCard.theme === 'corporate' ? 'bg-cyan-100 text-cyan-800' :
                                                                                                'bg-gray-100 text-gray-800'
                                            }`}>
        {selectedCard.theme}
    </span>
                                        </div>
                                        <div><span
                                            className="font-medium">Style:</span> {selectedCard.style.replace('-', ' ')}
                                        </div>
                                        <div>
                                            <span className="font-medium">Description:</span><br/>
                                            <span
                                                className="inline-block min-h-[2.5rem] leading-5">{selectedCard.description}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedCard.metadata?.features && selectedCard.metadata.features.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Features</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCard.metadata.features.map((feature, idx) => (
                                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {feature.replace('-', ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedCard.metadata?.colors && selectedCard.metadata.colors.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Color Palette</h4>
                                        <div className="flex gap-2">
                                            {selectedCard.metadata.colors.slice(0, 6).map((color, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-8 h-8 rounded border shadow-sm"
                                                    style={{backgroundColor: color}}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedCard.metadata?.fonts && selectedCard.metadata.fonts.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Typography</h4>
                                        <div className="space-y-1">
                                            {selectedCard.metadata.fonts.map((font, idx) => (
                                                <span key={idx}
                                                      className="text-sm bg-gray-100 px-2 py-1 rounded mr-2 inline-block">
                                                    {font}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer - EXACT COPY FROM WIZARD */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                            <div className="flex items-center justify-between gap-4">
                                {/* Toggle Switch - EXACT COPY FROM WIZARD */}
                                {/* In admin view: disabled (no injection available) */}
                                {/* In wizard view: enabled and functional */}
                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={previewMode === 'injected'}
                                                onChange={togglePreviewMode}
                                                disabled={mode === 'view'} // Disabled in admin view
                                            />
                                            <div className={`block w-14 h-8 rounded-full transition-colors ${
                                                mode === 'view'
                                                    ? 'bg-gray-300' // Disabled appearance in admin view
                                                    : previewMode === 'injected'
                                                        ? 'bg-purple-600'
                                                        : 'bg-gray-300'
                                            }`}></div>
                                            <div
                                                className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                                                    previewMode === 'injected' ? 'translate-x-6' : 'translate-x-0'
                                                }`}></div>
                                        </div>
                                        <div className={`ml-3 text-sm font-medium ${
                                            mode === 'view' ? 'text-gray-400' : 'text-gray-700'
                                        }`}>
                                            {previewMode === 'injected' ? `Client's Info` : 'Generic'}
                                            {mode === 'view' &&
                                                <span className="text-xs ml-1">(disabled in admin view)</span>}
                                        </div>
                                    </label>
                                </div>

                                <div className="flex gap-3">
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
                </div>
            )}
        </>
    );
};

export default BusinessCardTileGrid;