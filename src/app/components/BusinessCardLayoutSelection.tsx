// FILE: src/app/components/BusinessCardLayoutSelection.tsx
// FUNCTION: BusinessCardLayoutSelection Component
// PURPOSE: Business card layout selection with dual preview mode toggle in enlarged modal

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
    logo?: StoredLogo | null;
}

export const BusinessCardLayoutSelection = ({
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
                                                logo = null
                                            }: BusinessCardLayoutSelectionProps) => {

    // Log logo availability
    useEffect(() => {
        console.log('🎨 BusinessCardLayoutSelection - Logo prop received:', {
            hasLogo: !!logo,
            hasImageData: !!logo?.imageDataUri,
            imageDataLength: logo?.imageDataUri?.length
        });
    }, [logo]);

    const allLayouts = BUSINESS_CARD_LAYOUTS;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [currentModalIndex, setCurrentModalIndex] = useState(0);

    const [previewMode, setPreviewMode] = useState<'generic' | 'injected'>('injected');

    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const currentPage = externalCurrentPage || internalCurrentPage;
    const itemsPerPage = 12;

    // Filter and search layouts
    const filteredLayouts = useMemo(() => {
        let filtered = allLayouts;

        if (themeFilter !== 'all') {
            filtered = filtered.filter(layout => layout.theme === themeFilter);
        }

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

    // Paginate layouts
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

    // Handle layout selection
    const handleLayoutSelect = (layout: BusinessCardLayout) => {
        console.log('📋 BusinessCardLayoutSelection - Layout selected:', layout.catalogId);
        onLayoutSelect(layout.catalogId);
    };

    // Handle card click
    const handleCardClick = (layout: BusinessCardLayout) => {
        console.log('👁️ BusinessCardLayoutSelection - Opening enlarged view:', layout.catalogId);
        setSelectedCard(layout);
        setCurrentModalIndex(filteredLayouts.findIndex(l => l.catalogId === layout.catalogId));
        setIsModalOpen(true);
        setPreviewMode('injected'); // Reset to injected mode when opening
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        console.log('📄 BusinessCardLayoutSelection - Page change:', newPage);
        if (onPageChange) {
            onPageChange(newPage);
        } else {
            setInternalCurrentPage(newPage);
        }
    };

    // Generate page numbers
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

    // Modal navigation
    const navigateToPrevious = useCallback(() => {
        if (currentModalIndex > 0) {
            const newIndex = currentModalIndex - 1;
            console.log('⬅️ BusinessCardLayoutSelection - Previous card:', newIndex);
            setCurrentModalIndex(newIndex);
            setSelectedCard(filteredLayouts[newIndex]);
        }
    }, [currentModalIndex, filteredLayouts]);

    const navigateToNext = useCallback(() => {
        if (currentModalIndex < filteredLayouts.length - 1) {
            const newIndex = currentModalIndex + 1;
            console.log('➡️ BusinessCardLayoutSelection - Next card:', newIndex);
            setCurrentModalIndex(newIndex);
            setSelectedCard(filteredLayouts[newIndex]);
        }
    }, [currentModalIndex, filteredLayouts]);

    // Close modal
    const closeModal = useCallback(() => {
        console.log('❌ BusinessCardLayoutSelection - Closing modal');
        setIsModalOpen(false);
        setSelectedCard(null);
        setPreviewMode('injected');
        document.body.style.overflow = '';
    }, []);

    // Handle search change
    const handleSearchChange = useCallback((value: string) => {
        console.log('🔍 BusinessCardLayoutSelection - Search:', value);
        if (onSearchChange) {
            onSearchChange(value);
        }
    }, [onSearchChange]);

    // Handle theme filter change
    const handleThemeFilterChange = useCallback((theme: string) => {
        console.log('🎨 BusinessCardLayoutSelection - Theme filter:', theme);
        if (onThemeFilterChange) {
            onThemeFilterChange(theme);
        }
    }, [onThemeFilterChange]);

    // Generate injected HTML with logo and contact info
    const generateEnlargedModalHTML = (card: BusinessCardLayout): string => {
        try {
            console.log('🎨 BusinessCardLayoutSelection - Generating modal HTML:', card.catalogId);
            let processedHTML = card.jsx;

            console.log('📝 BusinessCardLayoutSelection - Injecting contact info');
            processedHTML = injectContactInfo(processedHTML, formData);

            if (validateLogoForInjection(logo)) {
                console.log('✅ BusinessCardLayoutSelection - Injecting logo');
                processedHTML = injectLogoIntoBusinessCard(processedHTML, logo);
            } else {
                console.log('ℹ️ BusinessCardLayoutSelection - No logo injection');
            }

            return processedHTML;
        } catch (error) {
            console.error('❌ BusinessCardLayoutSelection - Error:', error);
            return card.jsx;
        }
    };

    // Get HTML based on preview mode
    const getModalPreviewHTML = (card: BusinessCardLayout): string => {
        if (previewMode === 'generic') {
            console.log('📝 BusinessCardLayoutSelection - Showing generic preview');
            return card.jsx;
        } else {
            console.log('📝 BusinessCardLayoutSelection - Showing injected preview');
            return generateEnlargedModalHTML(card);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* NEW: Sticky Compact Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm px-6 py-3">
                {/* Single Row: Results + Filters */}
                <div className="flex items-center gap-4">
                    {/* Results Info - Left aligned */}
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} layouts
                    </div>

                    {/* Filters - Right side */}
                    <div className="flex-1 flex items-center gap-3 justify-end">
                        {/* Search */}
                        <div className="flex-1 max-w-md">
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
                                        ×
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
                                {getAllThemes().map(theme => (
                                    <option key={theme} value={theme}>
                                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
                {/* Layout Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedData.layouts.map(layout => (
                        <div
                            key={layout.catalogId}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                                selectedLayout === layout.catalogId
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-300'
                            }`}
                            onClick={() => handleCardClick(layout)}
                        >
                            {/* Preview */}
                            <div
                                className="mb-4 bg-gray-100 rounded-lg p-4 flex items-center justify-center overflow-hidden">
                                <div
                                    className="business-card-preview shadow-sm"
                                    style={{
                                        transform: 'scale(0.85)',
                                        transformOrigin: 'center',
                                    }}
                                    dangerouslySetInnerHTML={{__html: layout.jsx}}
                                />
                            </div>

                            {/* Layout Info */}
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">
                                            {layout.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-mono">{layout.catalogId}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded shrink-0 ${
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

                                {/* Feature Tags */}
                                {layout.metadata?.features && layout.metadata.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {layout.metadata.features.slice(0, 3).map((feature, idx) => (
                                            <span key={idx}
                                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
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
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLayoutSelect(layout);
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                            selectedLayout === layout.catalogId
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-white border border-purple-600 text-purple-600 hover:bg-purple-50'
                                        }`}
                                    >
                                        {selectedLayout === layout.catalogId ? 'Selected ✓' : 'Select'}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCardClick(layout);
                                        }}
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

                {/* No Results */}
                {paginatedData.layouts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No layouts found matching your criteria</p>
                        <button
                            onClick={() => {
                                handleSearchChange('');
                                handleThemeFilterChange('all');
                            }}
                            className="mt-4 text-purple-600 hover:text-purple-700 underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Fixed Footer */}
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

                        {/* Center: Pagination */}
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

            {/* Enlarged Modal with Preview Mode Toggle */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div
                            className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{selectedCard.name}</h2>
                                <p className="text-sm text-gray-600">
                                    {selectedCard.catalogId} • {selectedCard.theme} • {selectedCard.style.replace('-', ' ')}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={navigateToPrevious}
                                    disabled={currentModalIndex === 0}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Previous"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M15 19l-7-7 7-7"/>
                                    </svg>
                                </button>

                                <button
                                    onClick={navigateToNext}
                                    disabled={currentModalIndex === filteredLayouts.length - 1}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Next"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M9 5l7 7-7 7"/>
                                    </svg>
                                </button>

                                <button
                                    onClick={closeModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors ml-2"
                                    title="Close"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Preview Mode Indicator */}
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

                            {/* Large Preview */}
                            <div className="flex justify-center">
                                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                                    <div
                                        className="business-card-preview shadow-lg"
                                        style={{
                                            transform: 'scale(1.5)',
                                            transformOrigin: 'center',
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: getModalPreviewHTML(selectedCard)
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Card Details */}
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

                            {/* Action Buttons with Toggle */}
                            <div className="flex gap-4 pt-4 border-t items-center">
                                {/* Preview Mode Toggle */}
                                <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
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
                                            <div
                                                className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                                                    previewMode === 'injected' ? 'translate-x-6' : 'translate-x-0'
                                                }`}></div>
                                        </div>
                                        <div className="ml-3 text-sm font-medium text-gray-700">
                                            {previewMode === 'injected' ? `Client's Info` : 'Generic'}
                                        </div>
                                    </label>
                                </div>

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