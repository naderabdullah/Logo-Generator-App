// src/app/admin-business-cards/BusinessCardAdmin.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    BUSINESS_CARD_LAYOUTS,
    BusinessCardLayout,
    getAllThemes,
    getBusinessCardLayoutsByTheme,
    getBusinessCardLayoutsByStyle,
    searchBusinessCardLayouts,
    paginateBusinessCardLayouts,
    getTotalLayoutCount
} from '../../data/businessCardLayouts';

/**
 * Business Card Admin Component
 * File: src/app/admin-business-cards/BusinessCardAdmin.tsx
 *
 * Features:
 * - Grid display of all 100 business card layouts
 * - Pagination (12-20 items per page, default 16)
 * - Search functionality
 * - Theme and style filtering
 * - Responsive design
 * - Admin-only access control
 */
export default function BusinessCardAdmin() {
    const { user } = useAuth();

    // State management
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(16);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('all');
    const [selectedStyle, setSelectedStyle] = useState<'all' | 'contact-focused' | 'company-focused'>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data processing with memoization for performance
    const filteredLayouts = useMemo(() => {
        console.log('🔍 Filtering layouts with:', { searchQuery, selectedTheme, selectedStyle });

        try {
            let layouts = BUSINESS_CARD_LAYOUTS;

            // Apply search filter
            if (searchQuery.trim()) {
                layouts = searchBusinessCardLayouts(searchQuery);
            }

            // Apply theme filter
            if (selectedTheme !== 'all') {
                layouts = layouts.filter(layout => layout.theme === selectedTheme);
            }

            // Apply style filter
            if (selectedStyle !== 'all') {
                layouts = layouts.filter(layout => layout.style === selectedStyle);
            }

            console.log(`✅ Filtered ${layouts.length} layouts from ${BUSINESS_CARD_LAYOUTS.length} total`);
            return layouts;
        } catch (err) {
            console.error('❌ Error filtering layouts:', err);
            setError('Failed to filter business card layouts');
            return [];
        }
    }, [searchQuery, selectedTheme, selectedStyle]);

    const paginationData = useMemo(() => {
        try {
            return paginateBusinessCardLayouts(filteredLayouts, currentPage, itemsPerPage);
        } catch (err) {
            console.error('❌ Error paginating layouts:', err);
            setError('Failed to paginate business card layouts');
            return {
                layouts: [],
                totalPages: 1,
                currentPage: 1,
                totalItems: 0
            };
        }
    }, [filteredLayouts, currentPage, itemsPerPage]);

    const availableThemes = useMemo(() => {
        try {
            return getAllThemes();
        } catch (err) {
            console.error('❌ Error getting themes:', err);
            return [];
        }
    }, []);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedTheme, selectedStyle, itemsPerPage]);

    // Authorization check
    if (!user || !user.isSuperUser) {
        console.warn('⚠️ Unauthorized access attempt to admin business cards');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to access the business card admin panel.
                    </p>
                    <p className="text-sm text-gray-500">
                        Please contact an administrator if you believe this is an error.
                    </p>
                </div>
            </div>
        );
    }

    const handlePageChange = (page: number) => {
        console.log(`📄 Changing to page ${page}`);
        setCurrentPage(page);
        // Scroll to top of grid
        document.getElementById('business-cards-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSearch = (query: string) => {
        console.log(`🔍 Searching for: "${query}"`);
        setSearchQuery(query);
    };

    const handleThemeChange = (theme: string) => {
        console.log(`🎨 Changing theme filter to: ${theme}`);
        setSelectedTheme(theme);
    };

    const handleStyleChange = (style: 'all' | 'contact-focused' | 'company-focused') => {
        console.log(`🎯 Changing style filter to: ${style}`);
        setSelectedStyle(style);
    };

    const renderBusinessCard = (layout: BusinessCardLayout) => {
        try {
            return (
                <div key={layout.catalogId} className="business-card-item bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    {/* Card Preview */}
                    <div className="relative bg-gray-100 p-4 flex items-center justify-center min-h-[200px]">
                        <div
                            className="business-card-preview"
                            style={{
                                transform: 'scale(0.6)',
                                transformOrigin: 'center center',
                                width: '3.5in',
                                height: '2in'
                            }}
                            dangerouslySetInnerHTML={{ __html: layout.jsx }}
                        />
                    </div>

                    {/* Card Information */}
                    <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {layout.name}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                {layout.catalogId}
              </span>
                        </div>

                        {layout.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                                {layout.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-1 rounded-full font-medium ${
                  layout.theme === 'minimalistic' ? 'bg-gray-100 text-gray-800' :
                      layout.theme === 'modern' ? 'bg-blue-100 text-blue-800' :
                          layout.theme === 'trendy' ? 'bg-purple-100 text-purple-800' :
                              layout.theme === 'classic' ? 'bg-amber-100 text-amber-800' :
                                  layout.theme === 'creative' ? 'bg-pink-100 text-pink-800' :
                                      layout.theme === 'professional' ? 'bg-indigo-100 text-indigo-800' :
                                          layout.theme === 'luxury' ? 'bg-yellow-100 text-yellow-800' :
                                              layout.theme === 'tech' ? 'bg-green-100 text-green-800' :
                                                  layout.theme === 'vintage' ? 'bg-orange-100 text-orange-800' :
                                                      'bg-red-100 text-red-800'
              }`}>
                {layout.theme}
              </span>

                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                layout.style === 'contact-focused'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-cyan-100 text-cyan-800'
                            }`}>
                {layout.style.replace('-', ' ')}
              </span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                            {layout.metadata.features.slice(0, 3).map((feature, index) => (
                                <span
                                    key={index}
                                    className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                                >
                  {feature}
                </span>
                            ))}
                            {layout.metadata.features.length > 3 && (
                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  +{layout.metadata.features.length - 3}
                </span>
                            )}
                        </div>
                    </div>
                </div>
            );
        } catch (err) {
            console.error(`❌ Error rendering business card ${layout.catalogId}:`, err);
            return (
                <div key={layout.catalogId} className="business-card-item bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-red-500 mb-2">⚠️</div>
                    <p className="text-sm text-red-600">Error loading {layout.catalogId}</p>
                </div>
            );
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-xl font-bold text-red-600 mb-4">Error Loading Business Cards</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            window.location.reload();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Business Card Layouts</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Catalog of {getTotalLayoutCount()} pre-designed business card layouts
                            </p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Total: {paginationData.totalItems} layouts</span>
                            <span>•</span>
                            <span>Page {paginationData.currentPage} of {paginationData.totalPages}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search layouts..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Theme Filter */}
                            <select
                                value={selectedTheme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Themes</option>
                                {availableThemes.map(theme => (
                                    <option key={theme} value={theme}>
                                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {/* Style Filter */}
                            <select
                                value={selectedStyle}
                                onChange={(e) => handleStyleChange(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Styles</option>
                                <option value="contact-focused">Contact Focused</option>
                                <option value="company-focused">Company Focused</option>
                            </select>

                            {/* Items Per Page */}
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={12}>12 per page</option>
                                <option value={16}>16 per page</option>
                                <option value={20}>20 per page</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Cards Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div id="business-cards-grid">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Loading business cards...</span>
                        </div>
                    ) : paginationData.layouts.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No layouts found</h3>
                            <p className="text-gray-500">
                                {searchQuery || selectedTheme !== 'all' || selectedStyle !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No business card layouts available'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paginationData.layouts.map(layout => renderBusinessCard(layout))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center">
                        <nav className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {/* Page Numbers */}
                            {[...Array(Math.min(5, paginationData.totalPages))].map((_, index) => {
                                const pageNumber = Math.max(1, currentPage - 2) + index;
                                if (pageNumber <= paginationData.totalPages) {
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => handlePageChange(pageNumber)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                pageNumber === currentPage
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                }
                                return null;
                            })}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === paginationData.totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}

                {/* Stats Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginationData.totalItems)} of {paginationData.totalItems} layouts
                </div>
            </div>
        </div>
    );
}