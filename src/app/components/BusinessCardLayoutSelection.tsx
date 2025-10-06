// FILE: src/app/components/BusinessCardLayoutSelection.tsx
// PURPOSE: Original UI structure preserved - Only logo injection added to enlarged modal
// CHANGES: Added logo prop and injection functionality while preserving ALL existing layout and features

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BusinessCardLayout, BUSINESS_CARD_LAYOUTS } from '@/data/businessCardLayouts';
import { StoredLogo } from '@/app/utils/indexedDBUtils';
import { injectLogoIntoBusinessCard, validateLogoForInjection } from '@/app/utils/businessCardLogoUtils';
import { getAllThemes } from '@/data/businessCardLayouts';
import { injectContactInfo } from '@/app/utils/businessCardContactUtils';

interface BusinessCardLayoutSelectionProps {
    selectedLayout: string | null;
    onLayoutSelect: (catalogId: string) => void;
    formData: any;
    onNext: () => void;
    onBack: () => void;
    searchTerm?: string;
    themeFilter?: string;
    onSearchChange?: (term: string) => void;
    onThemeFilterChange?: (theme: string) => void;
    externalCurrentPage?: number;
    onPageChange?: (page: number) => void;
    hideFooter?: boolean;
    logo?: StoredLogo | null; // ADDED: Logo prop for injection in enlarged modal
}

export const BusinessCardLayoutSelection: React.FC<BusinessCardLayoutSelectionProps> = ({
                                                                                            selectedLayout,
                                                                                            onLayoutSelect,
                                                                                            formData,
                                                                                            onNext,
                                                                                            onBack,
                                                                                            searchTerm = '',
                                                                                            themeFilter = 'all',
                                                                                            onSearchChange,
                                                                                            onThemeFilterChange,
                                                                                            externalCurrentPage,
                                                                                            onPageChange,
                                                                                            hideFooter = false,
                                                                                            logo
                                                                                        }) => {

    // ADDED: Log logo data for debugging
    useEffect(() => {
        if (logo) {
            console.log('🎨 BusinessCardLayoutSelection - Logo data received:', {
                logoId: logo.id,
                name: logo.name,
                hasImageData: !!logo.imageDataUri,
                imageDataLength: logo.imageDataUri?.length
            });
        }
    }, [logo]);

    const allLayouts = BUSINESS_CARD_LAYOUTS;

    // Modal state for enlarged preview - PRESERVED ORIGINAL
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [currentModalIndex, setCurrentModalIndex] = useState(0);

    // Internal pagination state - PRESERVED ORIGINAL
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);

    // Use external page state if provided, otherwise use internal - PRESERVED ORIGINAL
    const currentPage = externalCurrentPage || internalCurrentPage;

    // Pagination settings - PRESERVED ORIGINAL
    const itemsPerPage = 12;

    // Filter and search layouts - PRESERVED ORIGINAL
    const filteredLayouts = useMemo(() => {
        let filtered = allLayouts;

        // Apply theme filter
        if (themeFilter !== 'all') {
            filtered = filtered.filter(layout => layout.theme === themeFilter);
        }

        // Apply search filter - ENHANCED
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(layout =>
                layout.catalogId.toLowerCase().includes(term) ||
                layout.name.toLowerCase().includes(term) ||
                layout.description?.toLowerCase().includes(term) ||
                layout.theme.toLowerCase().includes(term) ||
                layout.style.toLowerCase().includes(term) ||
                layout.metadata?.features?.some(feature => feature.toLowerCase().includes(term))
            );
        }

        return filtered;
    }, [searchTerm, themeFilter, allLayouts]);

    // Paginate filtered layouts - PRESERVED ORIGINAL
    const paginatedData = useMemo(() => {
        const totalItems = filteredLayouts.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const layouts = filteredLayouts.slice(startIndex, endIndex);

        return {
            layouts,

            totalPages,
            currentPage,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
            totalItems
        };
    }, [filteredLayouts, currentPage, itemsPerPage]);







    // Handle layout selection - PRESERVED ORIGINAL
    const handleLayoutSelect = (layout: BusinessCardLayout) => {

        onLayoutSelect(layout.catalogId);
    };

    // Handle card click (opens enlarged modal) - PRESERVED ORIGINAL
    const handleCardClick = (layout: BusinessCardLayout) => {
        setSelectedCard(layout);
        setCurrentModalIndex(filteredLayouts.findIndex(l => l.catalogId === layout.catalogId));
        setIsModalOpen(true);
    };

    // Handle page change - PRESERVED ORIGINAL
    const handlePageChange = (newPage: number) => {
        if (onPageChange) {
            onPageChange(newPage);
        } else {
            setInternalCurrentPage(newPage);
        }
    };

    // Generate page numbers for pagination - PRESERVED ORIGINAL
    const getPageNumbers = () => {
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

    // Modal navigation functions - PRESERVED ORIGINAL
    const navigateToPrevious = useCallback(() => {
        if (currentModalIndex > 0) {
            const newIndex = currentModalIndex - 1;
            setCurrentModalIndex(newIndex);
            setSelectedCard(filteredLayouts[newIndex]);
        }
    }, [currentModalIndex, filteredLayouts]);

    const navigateToNext = useCallback(() => {
        if (currentModalIndex < filteredLayouts.length - 1) {
            const newIndex = currentModalIndex + 1;
            setCurrentModalIndex(newIndex);
            setSelectedCard(filteredLayouts[newIndex]);
        }
    }, [currentModalIndex, filteredLayouts]);

    // Close modal - PRESERVED ORIGINAL
    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCard(null);
        document.body.style.overflow = '';
    }, []);

    // Handle search change - PRESERVED ORIGINAL
    const handleSearchChange = useCallback((value: string) => {

        if (onSearchChange) {
            onSearchChange(value);
        }
    }, [onSearchChange]);

    // Handle theme filter change - PRESERVED ORIGINAL
    const handleThemeFilterChange = useCallback((theme: string) => {

        if (onThemeFilterChange) {
            onThemeFilterChange(theme);
        }
    }, [onThemeFilterChange]);

    // ADDED: Generate processed HTML for enlarged modal with logo injection
    const generateEnlargedModalHTML = (card: BusinessCardLayout): string => {
        try {
            console.log('🎨 BusinessCardLayoutSelection - Generating enlarged modal HTML for card:', card.catalogId);

            let processedHTML = card.jsx;

            // STEP 1: Inject Contact Info (NEW)
            console.log('📝 BusinessCardLayoutSelection - Step 1: Injecting contact info');
            processedHTML = injectContactInfo(processedHTML, formData);

            // STEP 2: Inject Logo (EXISTING - PRESERVED)
            if (validateLogoForInjection(logo)) {
                console.log('✅ BusinessCardLayoutSelection - Step 2: Injecting logo');
                processedHTML = injectLogoIntoBusinessCard(processedHTML, logo);
            } else {
                console.log('ℹ️ BusinessCardLayoutSelection - No valid logo data, showing basic preview');
            }

            return processedHTML;

        } catch (error) {
            console.error('❌ BusinessCardLayoutSelection - Error generating enlarged modal HTML:', error);
            return card.jsx;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Scrollable Content Area - ENHANCED: Added bottom padding for fixed footer */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-20">
                {/* Filters - PRESERVED ORIGINAL */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search - Alternative Version */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search layouts..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            {searchTerm.length > 0 && (
                                <button
                                    onClick={() => handleSearchChange('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full text-sm"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Theme Filter */}
                    <div>
                        <select
                            value={themeFilter}
                            onChange={(e) => handleThemeFilterChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Themes</option>
                            {(() => {
                                try {
                                    return getAllThemes().map(theme => (
                                        <option key={theme} value={theme}>
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </option>
                                    ));
                                } catch (error) {
                                    // Fallback themes if getAllThemes fails
                                    return ['minimalistic', 'modern', 'tech', 'luxury', 'artistic', 'vintage', 'creative', 'professional'].map(theme => (
                                        <option key={theme} value={theme}>
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </option>
                                    ));
                                }
                            })()}
                        </select>
                    </div>
                </div>

                {/* Results Summary - PRESERVED ORIGINAL */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {paginatedData.layouts.length} of {paginatedData.totalItems} layouts
                        {paginatedData.totalPages > 1 && ` • Page ${currentPage} of ${paginatedData.totalPages}`}
                    </p>
                </div>

                {/* Layout Grid - PRESERVED ORIGINAL */}
                {paginatedData.layouts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedData.layouts.map((layout) => (
                            <div
                                key={layout.catalogId}
                                className={`border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-lg ${
                                    selectedLayout === layout.catalogId
                                        ? 'border-purple-500 bg-purple-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {/* Layout Preview - NO LOGO INJECTION in grid view */}
                                <div className="bg-gray-100 rounded-lg mb-4 flex items-center justify-center"
                                     style={{height: '180px'}}>
                                    <div
                                        className="business-card-preview transform scale-75"
                                        style={{
                                            transformOrigin: 'center',
                                            width: '3.5in',
                                            height: '2in',
                                            fontSize: '12px'
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: layout.jsx.replace(
                                                /John Doe|Jane Smith|Alex Stone|Maya Singh|Sarah Johnson|Michael Chen|Rachel Green|Sofia Martinez|Lucy Chen|Zara Nexus/g,
                                                formData.name || 'Your Name'
                                            ).replace(
                                                /Acme Corp|Creative Studio|Stone Design Co|Neon Dreams Studio|Marketing Pro|Tech Solutions|Green Marketing|Digital Innovations|Creative Arts|Cyber Nexus/g,
                                                formData.companyName || 'Your Company'
                                            )
                                        }}
                                    />
                                </div>

                                {/* Layout Info - PRESERVED ORIGINAL */}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{layout.name}</h3>
                                            <p className="text-xs text-gray-500 font-mono">{layout.catalogId}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            layout.theme === 'professional' ? 'bg-blue-100 text-blue-800' :
                                                layout.theme === 'modern' ? 'bg-green-100 text-green-800' :
                                                    layout.theme === 'creative' ? 'bg-purple-100 text-purple-800' :
                                                        layout.theme === 'minimalist' ? 'bg-gray-100 text-gray-800' :
                                                            layout.theme === 'corporate' ? 'bg-indigo-100 text-indigo-800' :
                                                                layout.theme === 'tech' ? 'bg-cyan-100 text-cyan-800' :
                                                                    layout.theme === 'trendy' ? 'bg-pink-100 text-pink-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {layout.theme}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{layout.description}</p>

                                    {/* Feature Tags - PRESERVED ORIGINAL */}
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

                                    {/* Action Buttons - PRESERVED ORIGINAL */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => handleLayoutSelect(layout)}
                                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                                selectedLayout === layout.catalogId
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {selectedLayout === layout.catalogId ? 'Selected' : 'Select Layout'}
                                        </button>

                                        <button
                                            onClick={() => handleCardClick(layout)}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            title="View Details"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                                      d="M15 12a3 3 0 11-6 0 3 3 0 0 1 6 0z"/>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">

                        <p className="text-gray-500 mb-4">No layouts found matching your criteria.</p>
                        <button
                            onClick={() => {
                                handleSearchChange('');
                                handleThemeFilterChange('all');
                            }}
                            className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Fixed Footer - Horizontal Layout - POSITIONED RELATIVE TO MODAL */}
            {!hideFooter && (
                <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-3 z-40 shadow-lg">
                    <div className="flex items-center justify-between">
                        {/* Left: Back Button */}
                        <button
                            onClick={onBack}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ← Back to Info
                        </button>

                        {/* Center: Pagination (only show if multiple pages) */}
                        {paginatedData.totalPages > 1 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={!paginatedData.hasPrevPage}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex space-x-1">
                                    {getPageNumbers().map((page) => {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                                    page === currentPage
                                                        ? 'bg-purple-600 text-white'
                                                        : 'border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={!paginatedData.hasNextPage}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {/* Right: Next Button */}
                        <button
                            onClick={onNext}
                            disabled={!selectedLayout}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Preview Card →
                        </button>
                    </div>
                </div>
            )}

            {/* Enlarged Modal with LOGO INJECTION - PRESERVED STRUCTURE, ENHANCED PREVIEW */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header - PRESERVED ORIGINAL STRUCTURE */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                            <div>


                                <h3 className="text-lg font-semibold">{selectedCard.name}</h3>
                                <p className="text-sm text-gray-600 font-mono">{selectedCard.catalogId}</p>
                            </div>


                            <div className="flex items-center gap-2">
                                {/* Navigation Controls */}


                                <span className="text-sm text-gray-600 mr-4">
                                    {currentModalIndex + 1} of {filteredLayouts.length}
                                </span>










                                <button
                                    onClick={navigateToPrevious}
                                    disabled={currentModalIndex === 0}
                                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Previous"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={navigateToNext}
                                    disabled={currentModalIndex === filteredLayouts.length - 1}
                                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
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
                            {/* ENHANCED: Large Preview with Logo Injection */}
                            <div className="flex justify-center">
                                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                                    <div
                                        className="business-card-preview shadow-lg"
                                        style={{
                                            transform: 'scale(1.5)',
                                            transformOrigin: 'center',
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: generateEnlargedModalHTML(selectedCard)
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Card Details - PRESERVED ORIGINAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium mb-2">Layout Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Theme:</span> {selectedCard.theme}</div>
                                        <div><span
                                            className="font-medium">Style:</span> {selectedCard.style.replace('-', ' ')}
                                        </div>
                                        <div>
                                            <span className="font-medium">Description:</span><br/>
                                            <span className="inline-block min-h-[2.5rem] leading-5">{selectedCard.description}</span>
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
                                                    style={{ backgroundColor: color }}
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
                                                <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded mr-2 inline-block">
                                                    {font}
                                                </span>
                                            ))}

                                        </div>

                                    </div>
                                )}
                            </div>

                            {/* Action Buttons - PRESERVED ORIGINAL */}
                            <div className="flex gap-4 pt-4 border-t">
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
        </div>
    );
};