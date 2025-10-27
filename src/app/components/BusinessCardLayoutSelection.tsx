// FILE: src/app/components/BusinessCardLayoutSelection.tsx
// PURPOSE: Step 2 of Business Card Wizard - Layout Selection
// CHANGES: Now uses BusinessCardTileGrid component for consistency with admin view
// CHANGE LOG:
// - Replaced inline grid implementation with BusinessCardTileGrid component
// - Maintained all existing functionality (search, filter, pagination)
// - Preserved wizard-specific behaviors (selection, navigation to step 3)

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BusinessCardLayout, BUSINESS_CARD_LAYOUTS, getAllThemes, searchBusinessCardLayouts } from '@/data/businessCardLayouts';
import { StoredLogo } from '@/app/utils/indexedDBUtils';
import BusinessCardTileGrid from './BusinessCardTileGrid';

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

/**
 * BusinessCardLayoutSelection Component
 * Step 2 of the Business Card Wizard
 *
 * Now uses the shared BusinessCardTileGrid component for consistency
 * while maintaining all wizard-specific functionality
 */
const BusinessCardLayoutSelection: React.FC<BusinessCardLayoutSelectionProps> = ({
                                                                                     selectedLayout,
                                                                                     onLayoutSelect,
                                                                                     formData,
                                                                                     onNext,
                                                                                     onBack,
                                                                                     searchTerm: externalSearchTerm,
                                                                                     themeFilter: externalThemeFilter,
                                                                                     onSearchChange,
                                                                                     onThemeFilterChange,
                                                                                     externalCurrentPage,
                                                                                     onPageChange,
                                                                                     hideFooter = false,
                                                                                     logo
                                                                                 }) => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    const [internalSearchTerm, setInternalSearchTerm] = useState('');
    const [internalThemeFilter, setInternalThemeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(externalCurrentPage || 1);
    const [itemsPerPage] = useState(12);

    // Use external values if provided, otherwise use internal state
    const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
    const themeFilter = externalThemeFilter !== undefined ? externalThemeFilter : internalThemeFilter;

    // ============================================================================
    // LOGGING
    // ============================================================================

    const logInfo = useCallback((message: string, data?: any) => {
        console.log(`[BusinessCardLayoutSelection] ${message}`, data || '');
    }, []);

    const logError = useCallback((message: string, error?: any) => {
        console.error(`[BusinessCardLayoutSelection] ERROR: ${message}`, error || '');
    }, []);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Sync external page changes
    useEffect(() => {
        if (externalCurrentPage && externalCurrentPage !== currentPage) {
            setCurrentPage(externalCurrentPage);
        }
    }, [externalCurrentPage]);

    // Log component mount
    useEffect(() => {
        logInfo('Component mounted', {
            selectedLayout,
            hasFormData: !!formData,
            hasLogo: !!logo,
            searchTerm,
            themeFilter,
            currentPage
        });
    }, []);

    // ============================================================================
    // FILTERING & PAGINATION
    // ============================================================================

    const filteredLayouts = useMemo(() => {
        try {
            let layouts = [...BUSINESS_CARD_LAYOUTS];

            // Apply search filter
            if (searchTerm && searchTerm.trim()) {
                layouts = searchBusinessCardLayouts(searchTerm);
                logInfo(`Search applied: "${searchTerm}"`, { resultsCount: layouts.length });
            }

            // Apply theme filter
            if (themeFilter && themeFilter !== 'all') {
                layouts = layouts.filter(layout => layout.theme === themeFilter);
                logInfo(`Theme filter applied: "${themeFilter}"`, { resultsCount: layouts.length });
            }

            return layouts;
        } catch (error) {
            logError('Error filtering layouts', error);
            return BUSINESS_CARD_LAYOUTS;
        }
    }, [searchTerm, themeFilter, logInfo, logError]);

    const paginatedData = useMemo(() => {
        try {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedLayouts = filteredLayouts.slice(startIndex, endIndex);

            const totalPages = Math.ceil(filteredLayouts.length / itemsPerPage);
            const hasNextPage = currentPage < totalPages;
            const hasPrevPage = currentPage > 1;

            return {
                layouts: paginatedLayouts,
                totalPages,
                totalItems: filteredLayouts.length,
                hasNextPage,
                hasPrevPage,
                startIndex: filteredLayouts.length > 0 ? startIndex + 1 : 0,
                endIndex: Math.min(endIndex, filteredLayouts.length)
            };
        } catch (error) {
            logError('Error paginating layouts', error);
            return {
                layouts: [],
                totalPages: 0,
                totalItems: 0,
                hasNextPage: false,
                hasPrevPage: false,
                startIndex: 0,
                endIndex: 0
            };
        }
    }, [filteredLayouts, currentPage, itemsPerPage, logError]);

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    const handleSearchChange = useCallback((value: string) => {
        try {
            logInfo('Search term changed', { from: searchTerm, to: value });

            if (onSearchChange) {
                onSearchChange(value);
            } else {
                setInternalSearchTerm(value);
            }

            // Reset to page 1 on search
            handlePageChange(1);
        } catch (error) {
            logError('Error handling search change', error);
        }
    }, [searchTerm, onSearchChange, logInfo, logError]);

    const handleThemeFilterChange = useCallback((theme: string) => {
        try {
            logInfo('Theme filter changed', { from: themeFilter, to: theme });

            if (onThemeFilterChange) {
                onThemeFilterChange(theme);
            } else {
                setInternalThemeFilter(theme);
            }

            // Reset to page 1 on filter change
            handlePageChange(1);
        } catch (error) {
            logError('Error handling theme filter change', error);
        }
    }, [themeFilter, onThemeFilterChange, logInfo, logError]);

    const handlePageChange = useCallback((page: number) => {
        try {
            logInfo('Page changed', { from: currentPage, to: page });

            if (onPageChange) {
                onPageChange(page);
            } else {
                setCurrentPage(page);
            }
        } catch (error) {
            logError('Error handling page change', error);
        }
    }, [currentPage, onPageChange, logInfo, logError]);

    const handleLayoutSelect = useCallback((catalogId: string) => {
        try {
            logInfo('Layout selected', { catalogId });
            onLayoutSelect(catalogId);
        } catch (error) {
            logError('Error handling layout selection', error);
        }
    }, [onLayoutSelect, logInfo, logError]);

    // ============================================================================
    // PAGINATION HELPER
    // ============================================================================

    const getPageNumbers = () => {
        const totalPages = paginatedData.totalPages;
        const current = currentPage;
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <div className="flex flex-col h-full">
            {/* Sticky Header with Filters */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm px-6 py-3">
                <div className="flex items-center gap-4">
                    {/* Results Info */}
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                        Showing {paginatedData.startIndex} to {paginatedData.endIndex} of {paginatedData.totalItems} layouts
                    </div>

                    {/* Filters */}
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
                                        title="Clear search"
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

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {/* BusinessCardTileGrid Component */}
                <BusinessCardTileGrid
                    mode="select"
                    layouts={paginatedData.layouts}
                    selectedLayout={selectedLayout}
                    onLayoutSelect={handleLayoutSelect}
                    formData={formData}
                    logo={logo}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />

                {/* No Results Message */}
                {paginatedData.layouts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No layouts found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Footer with Pagination and Navigation */}
            {!hideFooter && paginatedData.totalItems > 0 && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Back Button */}
                        <button
                            onClick={onBack}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ← Back
                        </button>

                        {/* Center: Pagination */}
                        {paginatedData.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={!paginatedData.hasPrevPage}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-1">
                                    {getPageNumbers().map((page, index) => {
                                        if (page === '...') {
                                            return (
                                                <span key={`dots-${index}`} className="px-2 text-gray-400">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page as number)}
                                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                                    currentPage === page
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
        </div>
    );
};

export default BusinessCardLayoutSelection;