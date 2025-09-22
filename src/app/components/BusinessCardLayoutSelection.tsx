// src/app/components/BusinessCardLayoutSelection.tsx
'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { BusinessCardData } from '../../../types/businessCard';
import {
    BUSINESS_CARD_LAYOUTS,
    BusinessCardLayout,
    getAllThemes,
    searchBusinessCardLayouts,
    getBusinessCardLayoutsByTheme
} from '../../../src/data/businessCardLayouts';

interface BusinessCardLayoutSelectionProps {
    selectedLayout: string | null;
    setSelectedLayout: (layoutId: string) => void;
    formData: BusinessCardData;
    onBack: () => void;
    onNext: () => void;
}

export const BusinessCardLayoutSelection: React.FC<BusinessCardLayoutSelectionProps> = ({
                                                                                            selectedLayout,
                                                                                            setSelectedLayout,
                                                                                            formData,
                                                                                            onBack,
                                                                                            onNext
                                                                                        }) => {
    console.log('🎨 BusinessCardLayoutSelection - Rendering with selectedLayout:', selectedLayout);

    // State for filtering, pagination, and modal viewing
    const [searchTerm, setSearchTerm] = useState('');
    const [themeFilter, setThemeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Optimized for modal view

    // Modal viewing state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [currentModalIndex, setCurrentModalIndex] = useState(0);

    // Get all themes for filtering
    const themes = useMemo(() => {
        try {
            return getAllThemes();
        } catch (err) {
            console.error('❌ Error getting themes:', err);
            return [];
        }
    }, []);

    // Filter layouts based on search and theme
    const filteredLayouts = useMemo(() => {
        try {
            let layouts = [...BUSINESS_CARD_LAYOUTS];

            // Apply search filter
            if (searchTerm.trim()) {
                layouts = searchBusinessCardLayouts(searchTerm.trim());
            }

            // Apply theme filter
            if (themeFilter !== 'all') {
                layouts = layouts.filter(layout => layout.theme === themeFilter);
            }

            console.log(`🔍 Filtered to ${layouts.length} layouts (search: "${searchTerm}", theme: "${themeFilter}")`);
            return layouts;
        } catch (err) {
            console.error('❌ Error filtering layouts:', err);
            return [];
        }
    }, [searchTerm, themeFilter]);

    // Paginate filtered layouts
    const paginatedData = useMemo(() => {
        try {
            const totalItems = filteredLayouts.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const layouts = filteredLayouts.slice(startIndex, endIndex);

            return {
                layouts,
                totalPages,
                currentPage,
                totalItems,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            };
        } catch (err) {
            console.error('❌ Error paginating layouts:', err);
            return {
                layouts: [],
                totalPages: 0,
                currentPage: 1,
                totalItems: 0,
                hasNextPage: false,
                hasPreviousPage: false
            };
        }
    }, [filteredLayouts, currentPage, itemsPerPage]);

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
        setCurrentPage(1); // Reset to first page on search
    }, []);

    // Handle theme filter change
    const handleThemeFilterChange = useCallback((theme: string) => {
        setThemeFilter(theme);
        setCurrentPage(1); // Reset to first page on filter
    }, []);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">Choose Business Card Layout</h2>
                <p className="text-gray-600 text-sm">
                    Select a business card design that matches your style. You can preview how your information will look.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-gray-200">
                {/* Search */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search layouts..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                </div>

                {/* Theme Filter */}
                <div className="flex items-center gap-2">
                    <label htmlFor="theme-filter" className="text-sm text-gray-600 whitespace-nowrap">
                        Theme:
                    </label>
                    <select
                        id="theme-filter"
                        value={themeFilter}
                        onChange={(e) => handleThemeFilterChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-w-[140px]"
                    >
                        <option value="all">All Themes</option>
                        {themes.map(theme => (
                            <option key={theme} value={theme}>
                                {theme.charAt(0).toUpperCase() + theme.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results Info */}
            <div className="text-sm text-gray-600">
                {paginatedData.totalItems === 0 ? (
                    <span>No layouts found</span>
                ) : (
                    <span>
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} layouts
                    </span>
                )}
            </div>

            {/* Layouts Grid */}
            {paginatedData.totalItems === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No business card layouts found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedData.layouts.map((layout) => (
                        <div
                            key={layout.catalogId}
                            className={`
                                relative bg-white border-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-lg
                                ${selectedLayout === layout.catalogId
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : 'border-gray-200 hover:border-purple-300'
                            }
                            `}
                        >
                            {/* Selection Indicator */}
                            {selectedLayout === layout.catalogId && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center z-10">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">{layout.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCardClick(layout)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                            title="View Details"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                        {layout.catalogId}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{layout.description}</p>

                                {/* Theme and Style Tags */}
                                <div className="flex gap-2 flex-wrap mb-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        layout.theme === 'minimalistic' ? 'bg-gray-100 text-gray-800' :
                                            layout.theme === 'modern' ? 'bg-blue-100 text-blue-800' :
                                                layout.theme === 'trendy' ? 'bg-purple-100 text-purple-800' :
                                                    layout.theme === 'classic' ? 'bg-amber-100 text-amber-800' :
                                                        layout.theme === 'creative' ? 'bg-pink-100 text-pink-800' :
                                                            layout.theme === 'professional' ? 'bg-indigo-100 text-indigo-800' :
                                                                layout.theme === 'luxury' ? 'bg-yellow-100 text-yellow-800' :
                                                                    layout.theme === 'tech' ? 'bg-green-100 text-green-800' :
                                                                        layout.theme === 'vintage' ? 'bg-orange-100 text-orange-800' :
                                                                            layout.theme === 'artistic' ? 'bg-red-100 text-red-800' :
                                                                                'bg-gray-100 text-gray-800'
                                    }`}>
                                        {layout.theme}
                                    </span>

                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        layout.style === 'contact-focused'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-cyan-100 text-cyan-800'
                                    }`}>
                                        {layout.style.replace('-', ' ')}
                                    </span>
                                </div>

                                {/* Feature Tags */}
                                {layout.metadata?.features && layout.metadata.features.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex flex-wrap gap-1">
                                            {layout.metadata.features.slice(0, 4).map((feature, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                    {feature}
                                                </span>
                                            ))}
                                            {layout.metadata.features.length > 4 && (
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                    +{layout.metadata.features.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card Preview - EXACT COPY FROM ADMIN VIEWER */}
                            <div className="relative bg-gray-100 p-4 flex items-center justify-center min-h-[200px] group">
                                <div
                                    className="business-card-preview"
                                    style={{
                                        transform: 'scale(0.7)',
                                        transformOrigin: 'center center',
                                        width: '3.5in',
                                        height: '2in'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: layout.jsx }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 bg-gray-50 flex gap-2">
                                <button
                                    onClick={() => handleLayoutSelect(layout)}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {paginatedData.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-4 border-t border-gray-200">
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

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
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
                            {/* Large Preview - EXACT COPY FROM ADMIN MODAL */}
                            <div className="flex justify-center">
                                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                                    <div
                                        className="business-card-preview shadow-lg"
                                        style={{
                                            transform: 'scale(1.5)',
                                            transformOrigin: 'center',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: selectedCard.jsx }}
                                    />
                                </div>
                            </div>

                            {/* Card Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column - Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Description</h4>
                                        <p className="text-gray-600 text-sm">{selectedCard.description}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">Catalog ID</h4>
                                        <p className="font-mono bg-gray-100 px-2 py-1 rounded text-sm inline-block">
                                            {selectedCard.catalogId}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">Theme & Style</h4>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                selectedCard.theme === 'minimalistic' ? 'bg-gray-100 text-gray-800' :
                                                    selectedCard.theme === 'modern' ? 'bg-blue-100 text-blue-800' :
                                                        selectedCard.theme === 'trendy' ? 'bg-purple-100 text-purple-800' :
                                                            selectedCard.theme === 'classic' ? 'bg-amber-100 text-amber-800' :
                                                                selectedCard.theme === 'creative' ? 'bg-pink-100 text-pink-800' :
                                                                    selectedCard.theme === 'professional' ? 'bg-indigo-100 text-indigo-800' :
                                                                        selectedCard.theme === 'luxury' ? 'bg-yellow-100 text-yellow-800' :
                                                                            selectedCard.theme === 'tech' ? 'bg-green-100 text-green-800' :
                                                                                selectedCard.theme === 'vintage' ? 'bg-orange-100 text-orange-800' :
                                                                                    selectedCard.theme === 'artistic' ? 'bg-red-100 text-red-800' :
                                                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                                {selectedCard.theme}
                                            </span>

                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                selectedCard.style === 'contact-focused'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-cyan-100 text-cyan-800'
                                            }`}>
                                                {selectedCard.style.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Features & Metadata */}
                                <div className="space-y-4">
                                    {selectedCard.metadata?.features && selectedCard.metadata.features.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Features</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedCard.metadata.features.map((feature, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                        {feature}
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
                                    {selectedLayout === selectedCard.catalogId ? 'Selected' : 'Select This Layout'}
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