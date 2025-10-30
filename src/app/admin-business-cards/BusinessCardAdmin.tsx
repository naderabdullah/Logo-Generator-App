// FILE: src/app/admin-business-cards/BusinessCardAdmin.tsx
// PURPOSE: Admin view using BusinessCardTileGrid component
// MODE: 'view' (read-only, with modal navigation)
// FIXED: Removed any misplaced code that belongs in BusinessCardTileGrid

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    BUSINESS_CARD_LAYOUTS,
    BusinessCardLayout,
    getAllThemes,
    searchBusinessCardLayouts
} from '../../data/businessCardLayouts';
import BusinessCardTileGrid from '../components/BusinessCardTileGrid';

/**
 * Business Card Admin Component
 *
 * Features:
 * - Fixed sticky header with compact filters
 * - Working search, theme, style filters
 * - Working items per page selector
 * - Grid display using BusinessCardTileGrid component
 * - View-only mode (no selection or injection)
 * - Modal navigation enabled
 */
export default function BusinessCardAdmin() {
    const { user } = useAuth();

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);  // Default is 12
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('all');
    const [selectedStyle, setSelectedStyle] = useState<'all' | 'contact-focused' | 'company-focused'>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ============================================================================
    // LOGGING
    // ============================================================================

    const logInfo = useCallback((message: string, data?: any) => {
        console.log(`[BusinessCardAdmin] ${message}`, data || '');
    }, []);

    const logError = useCallback((message: string, error?: any) => {
        console.error(`[BusinessCardAdmin] ERROR: ${message}`, error || '');
    }, []);

    // ============================================================================
    // AUTH CHECK
    // ============================================================================

    useEffect(() => {
        if (!user) {
            logInfo('No authenticated user found');
        } else {
            logInfo('User authenticated', { userId: user.id });
        }
    }, [user, logInfo]);

    // ============================================================================
    // FILTERING LOGIC
    // ============================================================================

    const filteredLayouts = useMemo(() => {
        try {
            setLoading(true);
            let filtered = [...BUSINESS_CARD_LAYOUTS];

            logInfo('Starting filter with:', {
                searchQuery,
                selectedTheme,
                selectedStyle,
                totalLayouts: filtered.length
            });

            // Apply search filter
            if (searchQuery && searchQuery.trim()) {
                const searchResults = searchBusinessCardLayouts(searchQuery);
                filtered = searchResults;
                logInfo(`Search filter applied: ${filtered.length} results for query "${searchQuery}"`);
            }

            // Apply theme filter
            if (selectedTheme !== 'all') {
                filtered = filtered.filter(layout => layout.theme === selectedTheme);
                logInfo(`Theme filter applied: ${filtered.length} results for theme "${selectedTheme}"`);
            }

            // Apply style filter
            if (selectedStyle !== 'all') {
                filtered = filtered.filter(layout => layout.style === selectedStyle);
                logInfo(`Style filter applied: ${filtered.length} results for style "${selectedStyle}"`);
            }

            setLoading(false);
            logInfo(`Filtering complete: ${filtered.length} layouts match criteria`);

            return filtered;
        } catch (err) {
            logError('Error filtering layouts', err);
            setError('Failed to filter business card layouts');
            setLoading(false);
            return [];
        }
    }, [searchQuery, selectedTheme, selectedStyle, logInfo, logError]);

    // Get available themes
    const themes = useMemo(() => {
        try {
            return getAllThemes();
        } catch (err) {
            logError('Error getting themes', err);
            return [];
        }
    }, [logError]);

    // ============================================================================
    // PAGINATION
    // ============================================================================

    // Calculate paginated layouts
    const paginatedLayouts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredLayouts.slice(startIndex, endIndex);
    }, [filteredLayouts, currentPage, itemsPerPage]);

    // Calculate pagination info
    const paginationInfo = useMemo(() => {
        const totalItems = filteredLayouts.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

        return {
            start: totalItems > 0 ? startIndex + 1 : 0,
            end: endIndex,
            total: totalItems,
            currentPage,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
        };
    }, [filteredLayouts.length, itemsPerPage, currentPage]);

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    const handleSearchChange = useCallback((value: string) => {
        try {
            logInfo(`Search query changed: "${value}"`);
            setSearchQuery(value);
            setCurrentPage(1); // Reset to first page on search
        } catch (err) {
            logError('Error handling search change', err);
        }
    }, [logInfo, logError]);

    const handleThemeChange = useCallback((value: string) => {
        try {
            logInfo(`Theme filter changed: "${value}"`);
            setSelectedTheme(value);
            setCurrentPage(1); // Reset to first page on filter change
        } catch (err) {
            logError('Error handling theme change', err);
        }
    }, [logInfo, logError]);

    const handleStyleChange = useCallback((value: string) => {
        try {
            logInfo(`Style filter changed: "${value}"`);
            setSelectedStyle(value as 'all' | 'contact-focused' | 'company-focused');
            setCurrentPage(1); // Reset to first page on filter change
        } catch (err) {
            logError('Error handling style change', err);
        }
    }, [logInfo, logError]);

    const handleItemsPerPageChange = useCallback((value: number) => {
        try {
            logInfo(`Items per page changed: ${value}`);
            setItemsPerPage(value);
            setCurrentPage(1); // Reset to first page when changing items per page
        } catch (err) {
            logError('Error handling items per page change', err);
        }
    }, [logInfo, logError]);

    const handlePageChange = useCallback((page: number) => {
        try {
            logInfo(`Page changed: ${page}`);
            setCurrentPage(page);
            // Scroll to top when changing pages
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            logError('Error handling page change', err);
        }
    }, [logInfo, logError]);

    // ============================================================================
    // PAGINATION HELPERS
    // ============================================================================

    const getPageNumbers = () => {
        const totalPages = paginationInfo.totalPages;
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
    // EFFECTS
    // ============================================================================

    // Reset page when filters change
    useEffect(() => {
        if (currentPage > paginationInfo.totalPages && paginationInfo.totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, paginationInfo.totalPages]);

    // ============================================================================
    // RENDER
    // ============================================================================

    // Show loading state
    if (!user && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
                    <p className="text-gray-600">Please log in to access the admin panel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Fixed Compact Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-20">
                {/* Title Bar */}
                <div className="px-6 py-3 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Business Card Templates</h1>
                </div>

                {/* Compact Filter Bar */}
                <div className="px-6 py-3">
                    <div className="flex items-center gap-4">
                        {/* Results Count */}
                        <div className="text-sm text-gray-600 whitespace-nowrap min-w-[200px]">
                            {paginationInfo.total > 0 ? (
                                <>
                                    Showing {paginationInfo.start} to {paginationInfo.end} of {paginationInfo.total} layouts
                                    {paginationInfo.totalPages > 1 && ` • Page ${currentPage} of ${paginationInfo.totalPages}`}
                                </>
                            ) : (
                                'No layouts found'
                            )}
                        </div>

                        {/* Filters Container */}
                        <div className="flex-1 flex items-center gap-3 justify-end">
                            {/* Search */}
                            <div className="flex-1 max-w-sm">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        placeholder="Search layouts..."
                                        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => handleSearchChange('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            title="Clear search"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Theme Filter */}
                            <select
                                value={selectedTheme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Themes</option>
                                {themes.map(theme => (
                                    <option key={theme} value={theme}>
                                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {/* Style Filter */}
                            <select
                                value={selectedStyle}
                                onChange={(e) => handleStyleChange(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Styles</option>
                                <option value="contact-focused">Contact Focused</option>
                                <option value="company-focused">Company Focused</option>
                            </select>

                            {/* Items Per Page */}
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={12}>12 per page</option>
                                <option value={18}>18 per page</option>
                                <option value={24}>24 per page</option>
                                <option value={30}>30 per page</option>
                                <option value={36}>36 per page</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Error Display */}
                {error && (
                    <div className="mx-6 mt-4">
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredLayouts.length === 0 ? (
                    /* No Results */
                    <div className="flex flex-col items-center justify-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No layouts found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                        {(searchQuery || selectedTheme !== 'all' || selectedStyle !== 'all') && (
                            <button
                                onClick={() => {
                                    handleSearchChange('');
                                    handleThemeChange('all');
                                    handleStyleChange('all');
                                }}
                                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    /* Tile Grid - Pass only what BusinessCardTileGrid expects */
                    <div className="pb-6">
                        <BusinessCardTileGrid
                            mode="view"
                            layouts={paginatedLayouts}
                        />
                    </div>
                )}
            </div>

            {/* Fixed Footer with Pagination */}
            {paginationInfo.totalPages > 1 && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                        {/* Previous Button */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!paginationInfo.hasPrevPage}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        {/* Page Numbers */}
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
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                            currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!paginationInfo.hasNextPage}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}