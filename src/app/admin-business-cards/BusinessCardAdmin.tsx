// FILE: src/app/admin-business-cards/BusinessCardAdmin.tsx
// PURPOSE: Admin view using EXACT REPLICA of wizard Step 2 grid (BusinessCardTileGrid)
// MODE: 'view' (read-only, with modal navigation)

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    BUSINESS_CARD_LAYOUTS,
    BusinessCardLayout,
    getAllThemes,
    searchBusinessCardLayouts
} from '../../data/businessCardLayouts';
import { BusinessCardTileGrid } from '../components/BusinessCardTileGrid';

/**
 * Business Card Admin Component
 * File: src/app/admin-business-cards/BusinessCardAdmin.tsx
 *
 * Features:
 * - Grid display identical to wizard Step 2
 * - Pagination, search, theme/style filtering
 * - View-only mode (no selection or injection)
 * - Modal navigation enabled
 * - Admin-only access control
 */
export default function BusinessCardAdmin() {
    const { user } = useAuth();

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(16);
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
        console.error(`[BusinessCardAdmin ERROR] ${message}`, error || '');
    }, []);

    // ============================================================================
    // AUTHENTICATION CHECK
    // ============================================================================

    useEffect(() => {
        if (!user) {
            logInfo('No user found, authentication required');
            setError('Please log in to access the admin panel');
            return;
        }

        if (!user.isSuperUser) {
            logInfo('User is not a super user', { email: user.email });
            setError('You do not have permission to access this page');
            return;
        }

        logInfo('Admin access granted', { email: user.email });
    }, [user, logInfo]);

    // ============================================================================
    // DATA FILTERING
    // ============================================================================

    const filteredLayouts = useMemo(() => {
        try {
            setLoading(true);
            logInfo('Filtering layouts', {
                searchQuery,
                selectedTheme,
                selectedStyle,
                totalLayouts: BUSINESS_CARD_LAYOUTS.length
            });

            let filtered = [...BUSINESS_CARD_LAYOUTS];

            // Apply search filter
            if (searchQuery.trim()) {
                filtered = searchBusinessCardLayouts(filtered, searchQuery);
                logInfo(`Search filter applied: ${filtered.length} results for "${searchQuery}"`);
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

    // Calculate pagination info for header display
    const paginationInfo = useMemo(() => {
        const totalItems = filteredLayouts.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

        return {
            showing: endIndex - startIndex,
            start: startIndex + 1,
            end: endIndex,
            total: totalItems,
            currentPage,
            totalPages
        };
    }, [filteredLayouts, itemsPerPage, currentPage]);

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
            setCurrentPage(1); // Reset to first page on items per page change
        } catch (err) {
            logError('Error handling items per page change', err);
        }
    }, [logInfo, logError]);

    const handlePageChange = useCallback((page: number) => {
        try {
            logInfo(`Page changed: ${page}`);
            setCurrentPage(page);
        } catch (err) {
            logError('Error handling page change', err);
        }
    }, [logInfo, logError]);

    // ============================================================================
    // RENDER
    // ============================================================================

    // Don't render if not authorized
    if (!user || !user.isSuperUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                    <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        {!user ? 'Please log in to access the admin panel.' : 'You do not have permission to access this page.'}
                    </p>
                    {!user && (
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Business Card Layouts</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Admin view of all {BUSINESS_CARD_LAYOUTS.length} business card templates
                            </p>
                        </div>
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search by name, ID, features..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => handleSearchChange('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Theme Filter */}
                        <div>
                            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                                Theme
                            </label>
                            <select
                                id="theme"
                                value={selectedTheme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Themes</option>
                                {themes.map(theme => (
                                    <option key={theme} value={theme}>
                                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Style Filter */}
                        <div>
                            <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                                Style
                            </label>
                            <select
                                id="style"
                                value={selectedStyle}
                                onChange={(e) => handleStyleChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Styles</option>
                                <option value="contact-focused">Contact Focused</option>
                                <option value="company-focused">Company Focused</option>
                            </select>
                        </div>

                        {/* Items Per Page */}
                        <div>
                            <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 mb-2">
                                Items Per Page
                            </label>
                            <select
                                id="itemsPerPage"
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={12}>12</option>
                                <option value={16}>16</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Summary - MATCHES WIZARD STYLE */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {paginationInfo.start} to {paginationInfo.end} of {paginationInfo.total} layouts
                    {paginationInfo.totalPages > 1 && ` • Page ${currentPage} of ${paginationInfo.totalPages}`}
                </div>

                {/* Tile Grid - Using EXACT REPLICA Component */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredLayouts.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No layouts found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                ) : (
                    <BusinessCardTileGrid
                        mode="view"
                        layouts={filteredLayouts}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                )}

                {/* Pagination Controls - BOTTOM */}
                {!loading && filteredLayouts.length > 0 && paginationInfo.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-2 text-sm rounded-lg ${
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
                            disabled={currentPage === paginationInfo.totalPages}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}