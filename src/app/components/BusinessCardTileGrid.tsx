// FILE: src/app/components/BusinessCardTileGrid.tsx
// PURPOSE: EXACT REPLICA of wizard Step 2 grid/modal - reusable for admin and wizard
// SOURCE: BusinessCardLayoutSelection.tsx (wizard step 2 - source of truth)
// CHANGES: Fixed logo injection, navigation, preview modes, and ContactInfo display
// CHANGE LOG:
// - Fixed validateLogoForInjection function call (removed second parameter)
// - Fixed default preview mode (now 'injected' for wizard, 'generic' for admin)
// - Fixed logo injection with proper allowEnlargedLogo flag passing
// - Added proper navigation functionality in enlarged modal
// - Added comprehensive logging and error handling

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
 * IMPORTANT: This is a TRUE EXACT REPLICA of the wizard Step 2 grid and modal.
 * All features from the original Step 2 wizard are preserved:
 * - Navigation between cards in modal (admin mode)
 * - Toggle between Generic/Client's Info (wizard mode)
 * - Proper logo injection with allowEnlargedLogo flag
 * - Contact information injection
 * - Two-column layout with design details
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

    // Preview mode state - defaults based on mode
    // Admin view: always 'generic' (no injection available)
    // Wizard view: defaults to 'injected' to show client's info immediately
    const [previewMode, setPreviewMode] = useState<PreviewMode>(() => {
        return mode === 'view' ? 'generic' : 'injected';
    });

    // ============================================================================
    // LOGGING
    // ============================================================================

    const logInfo = useCallback((message: string, data?: any) => {
        console.log(`[BusinessCardTileGrid ${mode}] ${message}`, data || '');
    }, [mode]);

    const logError = useCallback((message: string, error?: any) => {
        console.error(`[BusinessCardTileGrid ${mode}] ERROR: ${message}`, error || '');
    }, [mode]);

    const logDebug = useCallback((message: string, data?: any) => {
        console.log(`[BusinessCardTileGrid ${mode}] DEBUG: ${message}`, data || '');
    }, [mode]);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================

    // Theme options for filter dropdown
    const themeOptions = useMemo(() => {
        try {
            return getAllThemes();
        } catch (error) {
            logError('Error getting theme options', error);
            return [];
        }
    }, [logError]);

    // ============================================================================
    // MODAL MANAGEMENT
    // ============================================================================

    /**
     * Open modal and set initial state
     */
    const openModal = useCallback((layout: BusinessCardLayout) => {
        try {
            logInfo('Opening modal for layout', { catalogId: layout.catalogId });

            // Find the index of this layout in the current list
            const index = layouts.findIndex(l => l.catalogId === layout.catalogId);

            setSelectedCard(layout);
            setCurrentModalIndex(index >= 0 ? index : 0);
            setIsModalOpen(true);

            // Reset preview mode based on component mode
            // Admin always shows generic, wizard defaults to injected
            setPreviewMode(mode === 'view' ? 'generic' : 'injected');

            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';

            logDebug('Modal opened', {
                catalogId: layout.catalogId,
                index: index,
                previewMode: mode === 'view' ? 'generic' : 'injected'
            });
        } catch (error) {
            logError('Error opening modal', error);
        }
    }, [layouts, mode, logInfo, logError, logDebug]);

    /**
     * Close modal and cleanup
     */
    const closeModal = useCallback(() => {
        try {
            logInfo('Closing modal');

            setIsModalOpen(false);
            setSelectedCard(null);
            // Reset preview mode to default for next open
            setPreviewMode(mode === 'view' ? 'generic' : 'injected');
            // Restore body scroll
            document.body.style.overflow = '';

            logDebug('Modal closed');
        } catch (error) {
            logError('Error closing modal', error);
        }
    }, [mode, logInfo, logError, logDebug]);

    // ============================================================================
    // MODAL NAVIGATION (Admin View Only)
    // ============================================================================

    /**
     * Navigate to previous card in modal
     */
    const navigateToPrevious = useCallback(() => {
        try {
            if (currentModalIndex > 0) {
                const newIndex = currentModalIndex - 1;
                const newCard = layouts[newIndex];

                logDebug('Navigating to previous card', {
                    fromIndex: currentModalIndex,
                    toIndex: newIndex,
                    catalogId: newCard?.catalogId
                });

                setCurrentModalIndex(newIndex);
                setSelectedCard(newCard);
            }
        } catch (error) {
            logError('Error navigating to previous card', error);
        }
    }, [currentModalIndex, layouts, logError, logDebug]);

    /**
     * Navigate to next card in modal
     */
    const navigateToNext = useCallback(() => {
        try {
            if (currentModalIndex < layouts.length - 1) {
                const newIndex = currentModalIndex + 1;
                const newCard = layouts[newIndex];

                logDebug('Navigating to next card', {
                    fromIndex: currentModalIndex,
                    toIndex: newIndex,
                    catalogId: newCard?.catalogId
                });

                setCurrentModalIndex(newIndex);
                setSelectedCard(newCard);
            }
        } catch (error) {
            logError('Error navigating to next card', error);
        }
    }, [currentModalIndex, layouts, logError, logDebug]);

    // ============================================================================
    // SELECTION HANDLING (Wizard Mode Only)
    // ============================================================================

    /**
     * Handle layout selection in wizard mode
     */
    const handleLayoutSelect = useCallback((layout: BusinessCardLayout | null) => {
        try {
            if (mode === 'select' && onLayoutSelect && layout) {
                logInfo('Selecting layout', { catalogId: layout.catalogId });
                onLayoutSelect(layout.catalogId);
            }
        } catch (error) {
            logError('Error handling layout selection', error);
        }
    }, [mode, onLayoutSelect, logInfo, logError]);

    /**
     * Handle card click from grid
     */
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
     * This matches the exact logic from BusinessCardLayoutSelection.tsx
     */
    const generateEnlargedModalHTML = useCallback((card: BusinessCardLayout): string => {
        try {
            // Only inject in wizard mode with formData
            if (mode !== 'select' || !formData) {
                logDebug('Skipping injection - not in select mode or no formData');
                return card.jsx;
            }

            let processedHTML = card.jsx;

            // Step 1: Inject contact information
            if (formData) {
                logInfo('Injecting contact info into enlarged preview');
                processedHTML = injectContactInfo(processedHTML, formData);
            }

            // Step 2: Inject logo if available and valid
            if (logo) {
                // Extract allowEnlargedLogo flag from card metadata
                // This flag determines if logo should be scaled up in the preview
                const allowEnlargedLogo = card.metadata?.allowEnlargedLogo === true;

                logDebug('Checking logo for injection', {
                    hasLogo: !!logo,
                    logoId: logo.id,
                    allowEnlargedLogo: allowEnlargedLogo
                });

                // Validate logo before injection (single parameter function)
                if (validateLogoForInjection(logo)) {
                    logInfo('Logo validation passed - injecting into enlarged preview');

                    // Inject logo with proper options including allowEnlargedLogo flag
                    processedHTML = injectLogoIntoBusinessCard(processedHTML, logo, {
                        objectFit: 'contain',
                        preserveAspectRatio: true,
                        allowEnlargedLogo: allowEnlargedLogo  // Pass the flag to enable scaling
                    });

                    logDebug('Logo injected successfully', { allowEnlargedLogo });
                } else {
                    logInfo('Logo validation failed - skipping injection');
                }
            } else {
                logDebug('No logo provided for injection');
            }

            return processedHTML;
        } catch (error) {
            logError('Error generating enlarged modal HTML', error);
            return card.jsx; // Return original on error
        }
    }, [mode, formData, logo, logInfo, logError, logDebug]);

    /**
     * Get HTML based on preview mode
     * - Admin view: always shows generic (card.jsx)
     * - Wizard view: shows generic or injected based on toggle
     */
    const getModalPreviewHTML = useCallback((card: BusinessCardLayout): string => {
        try {
            // Admin view always shows generic (no injection capability)
            if (mode === 'view') {
                logDebug('Admin view - returning generic HTML');
                return card.jsx;
            }

            // Wizard view respects preview mode toggle
            if (previewMode === 'generic') {
                logDebug('Preview mode is generic - returning original HTML');
                return card.jsx;
            } else {
                logDebug('Preview mode is injected - generating injected HTML');
                return generateEnlargedModalHTML(card);
            }
        } catch (error) {
            logError('Error getting modal preview HTML', error);
            return card.jsx;
        }
    }, [mode, previewMode, generateEnlargedModalHTML, logError, logDebug]);

    /**
     * Handle preview mode toggle (wizard only)
     */
    const togglePreviewMode = useCallback(() => {
        try {
            if (mode === 'select') {
                const newMode: PreviewMode = previewMode === 'generic' ? 'injected' : 'generic';
                logInfo('Toggling preview mode', { from: previewMode, to: newMode });
                setPreviewMode(newMode);
            }
        } catch (error) {
            logError('Error toggling preview mode', error);
        }
    }, [mode, previewMode, logInfo, logError]);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Ensure body scroll is restored if component unmounts with modal open
            document.body.style.overflow = '';
        };
    }, []);

    // Log mode and configuration on mount
    useEffect(() => {
        logInfo('BusinessCardTileGrid mounted', {
            mode: mode,
            layoutCount: layouts.length,
            hasFormData: !!formData,
            hasLogo: !!logo,
            itemsPerPage: itemsPerPage,
            currentPage: currentPage
        });
    }, [mode, layouts.length, formData, logo, itemsPerPage, currentPage, logInfo]);

    // ============================================================================
    // BADGE COLOR UTILITIES
    // ============================================================================

    const getThemeBadgeColor = useCallback((theme: string): string => {
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
    }, []);

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <>
            {/* Grid Display - PRESERVE ORIGINAL UI EXACTLY */}
            {/* Note: layouts prop is already paginated by parent component */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
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

                            {/* Feature Tags */}
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
            {/* ========================================================================== */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{selectedCard.name}</h2>
                                <p className="text-base text-gray-700 font-mono font-semibold">
                                    {selectedCard.catalogId}
                                </p>
                            </div>

                            {/* Navigation Controls - available in both modes */}
                            <div className="flex items-center">
                                <button
                                    onClick={navigateToPrevious}
                                    disabled={currentModalIndex === 0}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Previous"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <span className="mx-2 text-sm text-gray-500">
                                    {currentModalIndex + 1} / {layouts.length}
                                </span>

                                <button
                                    onClick={navigateToNext}
                                    disabled={currentModalIndex === layouts.length - 1}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Next"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={closeModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors ml-2"
                                    title="Close"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Preview Mode Indicator */}
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                                    <span className={`font-medium ${previewMode === 'generic' ? 'text-purple-600' : 'text-gray-500'}`}>
                                        Generic
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className={`font-medium ${previewMode === 'injected' ? 'text-purple-600' : 'text-gray-500'}`}>
                                        {mode === 'view' ? 'Client\'s Info (N/A)' : 'Client\'s Info'}
                                    </span>
                                </div>
                            </div>

                            {/* Large Preview */}
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

                            {/* Two-Column Layout: Card Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Layout Details */}
                                <div>
                                    <h4 className="font-medium mb-3 text-gray-900">Layout Details</h4>
                                    <div className="space-y-3">
                                        {/* Theme */}
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-600">Theme:</span>
                                            <span className={`
                                                px-2 py-1 rounded text-xs font-medium
                                                ${selectedCard.theme === 'minimalistic' || selectedCard.theme === 'minimalist' ? 'bg-lime-100 text-lime-800' :
                                                selectedCard.theme === 'modern' ? 'bg-sky-100 text-sky-800' :
                                                    selectedCard.theme === 'trendy' ? 'bg-purple-100 text-purple-800' :
                                                        selectedCard.theme === 'classic' ? 'bg-amber-100 text-amber-800' :
                                                            selectedCard.theme === 'creative' ? 'bg-pink-100 text-pink-800' :
                                                                selectedCard.theme === 'professional' ? 'bg-slate-100 text-slate-800' :
                                                                    'bg-gray-100 text-gray-600'}
                                            `}>
                                                {selectedCard.theme}
                                            </span>
                                        </div>

                                        {/* Style */}
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-600">Style:</span>
                                            <span className={`
                                                px-2 py-1 rounded text-xs font-medium
                                                ${selectedCard.style === 'contact-focused' ? 'bg-green-100 text-green-800' :
                                                selectedCard.style === 'company-focused' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-600'}
                                            `}>
                                                {selectedCard.style === 'contact-focused' ? 'Contact Focused' :
                                                    selectedCard.style === 'company-focused' ? 'Company Focused' :
                                                        selectedCard.style}
                                            </span>
                                        </div>

                                        {/* Dimensions */}
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-600">Dimensions:</span>
                                            <span className="text-sm text-gray-700">3.5" × 2.0"</span>
                                        </div>

                                        {/* Features */}
                                        {selectedCard.metadata?.features && selectedCard.metadata.features.length > 0 && (
                                            <div>
                                                <span className="font-medium text-sm text-gray-600 block mb-2">Features:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedCard.metadata.features.map((feature, idx) => (
                                                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                            {feature}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Design Elements */}
                                <div>
                                    <h4 className="font-medium mb-3 text-gray-900">Design Elements</h4>
                                    <div className="space-y-3">
                                        {/* Colors */}
                                        {selectedCard.metadata?.colors && selectedCard.metadata.colors.length > 0 && (
                                            <div>
                                                <span className="font-medium text-sm text-gray-600 block mb-2">Colors:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedCard.metadata.colors.map((color, idx) => (
                                                        <div key={idx} className="flex items-center gap-1">
                                                            <div
                                                                className="w-4 h-4 rounded border border-gray-300"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="text-xs text-gray-600">{color}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Fonts */}
                                        {selectedCard.metadata?.fonts && selectedCard.metadata.fonts.length > 0 && (
                                            <div>
                                                <span className="font-medium text-sm text-gray-600 block mb-2">Typography:</span>
                                                <div className="space-y-1">
                                                    {selectedCard.metadata.fonts.map((font, idx) => (
                                                        <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded mr-2 inline-block">
                                                            {font}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                            <div className="flex items-center justify-between gap-4">
                                {/* Toggle Switch */}
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
                                            <div className={`
                                                block w-14 h-8 rounded-full transition-colors
                                                ${mode === 'view'
                                                ? 'bg-gray-300' // Disabled appearance in admin view
                                                : previewMode === 'injected'
                                                    ? 'bg-purple-600'
                                                    : 'bg-gray-300'
                                            }
                                            `}></div>
                                            <div className={`
                                                dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform
                                                ${previewMode === 'injected' ? 'translate-x-6' : 'translate-x-0'}
                                            `}></div>
                                        </div>
                                        <div className={`
                                            ml-3 text-sm font-medium
                                            ${mode === 'view' ? 'text-gray-400' : 'text-gray-700'}
                                        `}>
                                            {previewMode === 'injected' ? 'Client\'s Info' : 'Generic'}
                                            {mode === 'view' && (
                                                <span className="text-xs ml-1">(disabled in admin view)</span>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    {/* Select Button - CONDITIONAL (wizard only) */}
                                    {mode === 'select' && onLayoutSelect && (
                                        <button
                                            onClick={() => {
                                                handleLayoutSelect(selectedCard);
                                                closeModal();
                                            }}
                                            className={`
                                                flex-1 py-3 px-6 rounded-lg font-medium transition-colors
                                                ${selectedLayout === selectedCard.catalogId
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                            }
                                            `}
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