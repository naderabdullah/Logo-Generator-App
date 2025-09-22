// src/app/components/BusinessCardLayoutSelection.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BusinessCardLayout } from '../../data/businessCardLayouts';
import { BusinessCardData } from '../../../types/businessCard';

// Since we can't directly import the data array, we'll get it through the utility function
import { searchBusinessCardLayouts } from '../../data/businessCardLayouts';

interface BusinessCardLayoutSelectionProps {
    selectedLayout: string | null;
    setSelectedLayout: (layoutId: string) => void;
    formData: BusinessCardData;
    onBack?: () => void;
    onNext?: () => void;
    hideFooter?: boolean; // NEW: Add this prop to hide the footer when modal handles it
    onPaginationDataChange?: (data: any) => void; // NEW: Pass pagination data to parent
    currentPage?: number; // NEW: Allow parent to control pagination
    onPageChange?: (page: number) => void; // NEW: Allow parent to handle page changes
}

export const BusinessCardLayoutSelection: React.FC<BusinessCardLayoutSelectionProps> = ({
                                                                                            selectedLayout,
                                                                                            setSelectedLayout,
                                                                                            formData,
                                                                                            onBack,
                                                                                            onNext,
                                                                                            hideFooter = false, // NEW: Default to false to maintain existing behavior
                                                                                            onPaginationDataChange, // NEW: Callback to pass pagination data
                                                                                            currentPage: externalCurrentPage, // NEW: External page control
                                                                                            onPageChange: externalOnPageChange // NEW: External page change handler
                                                                                        }) => {
    // Get all layouts using the search function with empty string to get all
    const allLayouts = useMemo(() => {
        try {
            // Use the utility function to get all layouts
            const layouts = searchBusinessCardLayouts(''); // Empty search returns all
            console.log('🎨 BusinessCardLayoutSelection - Retrieved all layouts:', layouts.length);
            return layouts;
        } catch (err) {
            console.error('❌ Error retrieving all layouts:', err);
            return [];
        }
    }, []);

    console.log('🎨 BusinessCardLayoutSelection - Render with:', {
        selectedLayout,
        hideFooter,
        totalLayouts: allLayouts.length
    });

    // Local state
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [themeFilter, setThemeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [currentModalIndex, setCurrentModalIndex] = useState(0);

    // Use external page state if provided, otherwise use internal
    const currentPage = externalCurrentPage || internalCurrentPage;

    // Pagination settings
    const itemsPerPage = 12;

    // Filter and search layouts
    const filteredLayouts = useMemo(() => {
        try {
            console.log('🔍 BusinessCardLayoutSelection - Filtering layouts with:', {
                searchTerm,
                themeFilter,
                totalLayouts: allLayouts.length
            });

            let filtered = allLayouts;

            // Apply theme filter
            if (themeFilter !== 'all') {
                filtered = filtered.filter(layout => layout.theme === themeFilter);
            }

            // Apply search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(layout =>
                    layout.name.toLowerCase().includes(term) ||
                    layout.description.toLowerCase().includes(term) ||
                    layout.theme.toLowerCase().includes(term) ||
                    layout.style.toLowerCase().includes(term)
                );
            }

            console.log(`✅ Filtered layouts: ${filtered.length} layouts found`);
            return filtered;
        } catch (err) {
            console.error('❌ Error filtering layouts:', err);
            return [];
        }
    }, [searchTerm, themeFilter, allLayouts]);

    // Paginate filtered layouts
    const paginatedData = useMemo(() => {
        try {
            const totalItems = filteredLayouts.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const layouts = filteredLayouts.slice(startIndex, endIndex);

            console.log('📄 BusinessCardLayoutSelection - Pagination calculated:', {
                currentPage,
                totalPages,
                totalItems,
                startIndex,
                endIndex,
                layoutsOnPage: layouts.length
            });

            const paginationData = {
                layouts,
                currentPage,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
                totalItems,
                itemsPerPage
            };

            // Pass pagination data to parent if callback provided
            if (onPaginationDataChange) {
                onPaginationDataChange(paginationData);
            }

            return paginationData;
        } catch (err) {
            console.error('❌ Error calculating pagination:', err);
            return {
                layouts: [],
                currentPage: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
                totalItems: 0,
                itemsPerPage
            };
        }
    }, [filteredLayouts, currentPage, itemsPerPage, onPaginationDataChange]);

    // Handle layout selection
    const handleLayoutSelect = useCallback((layout: BusinessCardLayout) => {
        try {
            console.log(`🎯 Selected business card layout: ${layout.catalogId} - ${layout.name}`);
            setSelectedLayout(layout.catalogId);
        } catch (err) {
            console.error('❌ Error selecting layout:', err);
        }
    }, [setSelectedLayout]);

    // Handle card view modal
    const handleCardClick = useCallback((layout: BusinessCardLayout) => {
        try {
            console.log(`🔍 Opening enlargement modal for ${layout.catalogId}: ${layout.name}`);

            // Find the index of the selected card in filtered layouts
            const index = filteredLayouts.findIndex(l => l.catalogId === layout.catalogId);
            if (index === -1) {
                console.error(`❌ Could not find ${layout.catalogId} in filtered layouts`);
                return;
            }

            setSelectedCard(layout);
            setCurrentModalIndex(index);
            setIsModalOpen(true);

            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';

            console.log(`✅ Modal opened for card ${index + 1} of ${filteredLayouts.length}`);
        } catch (err) {
            console.error('❌ Error opening modal:', err);
        }
    }, [filteredLayouts]);

    // Navigate to previous card in modal
    const navigateToPrevious = useCallback(() => {
        try {
            if (currentModalIndex > 0) {
                const newIndex = currentModalIndex - 1;
                const newCard = filteredLayouts[newIndex];
                setCurrentModalIndex(newIndex);
                setSelectedCard(newCard);
                console.log(`⬅️ Navigated to previous card: ${newCard.catalogId}`);
            }
        } catch (err) {
            console.error('❌ Error navigating to previous card:', err);
        }
    }, [currentModalIndex, filteredLayouts]);

    // Navigate to next card in modal
    const navigateToNext = useCallback(() => {
        try {
            if (currentModalIndex < filteredLayouts.length - 1) {
                const newIndex = currentModalIndex + 1;
                const newCard = filteredLayouts[newIndex];
                setCurrentModalIndex(newIndex);
                setSelectedCard(newCard);
                console.log(`➡️ Navigated to next card: ${newCard.catalogId}`);
            }
        } catch (err) {
            console.error('❌ Error navigating to next card:', err);
        }
    }, [currentModalIndex, filteredLayouts]);

    // Close modal
    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedCard(null);
        document.body.style.overflow = '';
    }, []);

    // Handle search change
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        // Reset to first page and use appropriate handler
        if (externalOnPageChange) {
            externalOnPageChange(1);
        } else {
            setInternalCurrentPage(1);
        }
    }, [externalOnPageChange]);

    // Handle theme filter change
    const handleThemeFilterChange = useCallback((theme: string) => {
        setThemeFilter(theme);
        // Reset to first page and use appropriate handler
        if (externalOnPageChange) {
            externalOnPageChange(1);
        } else {
            setInternalCurrentPage(1);
        }
    }, [externalOnPageChange]);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        if (externalOnPageChange) {
            externalOnPageChange(page);
        } else {
            setInternalCurrentPage(page);
        }
    }, [externalOnPageChange]);

    return (
        <div className="flex flex-col h-full">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">Choose Business Card Layout</h2>
                    <p className="text-gray-600 text-sm">
                        Select a business card design that matches your style. You can preview how your information will look.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search layouts..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Theme Filter */}
                    <div>
                        <select
                            value={themeFilter}
                            onChange={(e) => handleThemeFilterChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Themes</option>
                            <option value="professional">Professional</option>
                            <option value="modern">Modern</option>
                            <option value="creative">Creative</option>
                            <option value="minimalist">Minimalist</option>
                            <option value="corporate">Corporate</option>
                            <option value="tech">Tech</option>
                            <option value="trendy">Trendy</option>
                        </select>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {paginatedData.layouts.length} of {paginatedData.totalItems} layouts
                        {paginatedData.totalPages > 1 && ` • Page ${currentPage} of ${paginatedData.totalPages}`}
                    </p>
                </div>

                {/* Layout Grid */}
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
                                {/* Layout Preview */}
                                <div className="bg-gray-100 rounded-lg mb-4 flex items-center justify-center" style={{ height: '180px' }}>
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
                                                /John Doe|Jane Smith|Alex Stone|Maya Singh|Sarah Johnson|Michael Chen|Rachel Green/g,
                                                formData.name || 'Your Name'
                                            ).replace(
                                                /Acme Corp|Creative Studio|Stone Design Co|Neon Dreams Studio|Marketing Pro|Tech Solutions|Green Marketing/g,
                                                formData.companyName || 'Your Company'
                                            )
                                        }}
                                    />
                                </div>

                                {/* Layout Info */}
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
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

            {/* Footer - Only show if hideFooter is false */}
            {!hideFooter && (
                <div className="border-t border-gray-200 bg-white px-6 py-4">
                    {/* Pagination */}
                    {paginatedData.totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mb-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!paginatedData.hasPreviousPage}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            <div className="flex space-x-1">
                                {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    const isCurrentPage = page === currentPage;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-2 text-sm rounded-lg ${
                                                isCurrentPage
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

                    {/* Navigation Buttons */}
                    <div className="flex justify-between">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ← Back to Info
                        </button>

                        <button
                            onClick={onNext}
                            disabled={!selectedLayout}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Preview Card →
                        </button>
                    </div>
                </div>
            )}

            {/* Enlargement Modal */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
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
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
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
                                            __html: selectedCard.jsx.replace(
                                                /John Doe|Jane Smith|Alex Stone|Maya Singh|Sarah Johnson|Michael Chen|Rachel Green/g,
                                                formData.name || 'Your Name'
                                            ).replace(
                                                /Acme Corp|Creative Studio|Stone Design Co|Neon Dreams Studio|Marketing Pro|Tech Solutions|Green Marketing/g,
                                                formData.companyName || 'Your Company'
                                            )
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
                                        <div><span className="font-medium">Style:</span> {selectedCard.style.replace('-', ' ')}</div>
                                        <div><span className="font-medium">Description:</span> {selectedCard.description}</div>
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

                            {/* Action Buttons */}
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