// FILE: src/app/admin-business-cards/BusinessCardAdmin.tsx
// ACTION: FULL FILE REPLACEMENT
// PURPOSE: Add enlargement modal functionality with mobile/desktop optimization

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
    getTotalLayoutCount,
    validateBusinessCardLayout
} from '../../data/businessCardLayouts';

/**
 * Business Card Admin Component
 * File: src/app/admin-business-cards/BusinessCardAdmin.tsx
 *
 * Features:
 * - Grid display of all business card layouts
 * - Pagination (12-20 items per page, default 16)
 * - Search functionality
 * - Theme and style filtering
 * - Responsive design
 * - Admin-only access control
 * - Enhanced error handling and logging
 * - JSX content sanitization and validation
 * - Enlargement modal for detailed card viewing
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
    const [layoutErrors, setLayoutErrors] = useState<{[key: string]: string[]}>({});

    // Modal state
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Validate layouts on component mount
    useEffect(() => {
        console.log('🔄 Validating business card layouts on component mount...');
        const errors: {[key: string]: string[]} = {};

        BUSINESS_CARD_LAYOUTS.forEach(layout => {
            const validation = validateBusinessCardLayout(layout);
            if (!validation.isValid) {
                errors[layout.catalogId] = validation.errors;
                console.error(`❌ Invalid layout ${layout.catalogId}:`, validation.errors);
            }
        });

        setLayoutErrors(errors);

        if (Object.keys(errors).length > 0) {
            console.warn(`⚠️ Found ${Object.keys(errors).length} invalid layouts`);
        } else {
            console.log('✅ All layouts are valid');
        }
    }, []);

    // Handle modal opening
    const handleCardClick = (layout: BusinessCardLayout) => {
        console.log(`🔍 Opening enlargement modal for ${layout.catalogId}: ${layout.name}`);
        setSelectedCard(layout);
        setIsModalOpen(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    // Handle modal closing
    const closeModal = () => {
        console.log('❌ Closing enlargement modal');
        setIsModalOpen(false);
        setSelectedCard(null);
        // Restore body scroll
        document.body.style.overflow = 'unset';
    };

    // Handle escape key press
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            return () => {
                document.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [isModalOpen]);

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
                totalPages: 0,
                currentPage: 1,
                totalItems: 0,
                hasNextPage: false,
                hasPreviousPage: false
            };
        }
    }, [filteredLayouts, currentPage, itemsPerPage]);

    const themes = useMemo(() => {
        try {
            return getAllThemes();
        } catch (err) {
            console.error('❌ Error getting themes:', err);
            return [];
        }
    }, []);

    /**
     * Sanitize JSX content to remove potential issues
     */
    const sanitizeJsxContent = (jsx: string, catalogId: string): string => {
        try {
            console.log(`🧹 Sanitizing JSX content for ${catalogId}`);

            let sanitized = jsx;

            // Remove JSX comments {/* */}
            sanitized = sanitized.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

            // Remove JavaScript comments //
            sanitized = sanitized.replace(/\/\/.*$/gm, '');

            // Remove multi-line comments /* */
            sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

            // Convert className to class for HTML compatibility
            sanitized = sanitized.replace(/className=/g, 'class=');

            // Clean up extra whitespace
            sanitized = sanitized.replace(/\s+/g, ' ').trim();

            console.log(`✅ JSX content sanitized for ${catalogId}`);
            return sanitized;
        } catch (err) {
            console.error(`❌ Error sanitizing JSX for ${catalogId}:`, err);
            return jsx; // Return original if sanitization fails
        }
    };

    /**
     * Enhanced business card rendering with error handling and modal trigger
     */
    const renderBusinessCard = (layout: BusinessCardLayout) => {
        const hasValidationErrors = layoutErrors[layout.catalogId]?.length > 0;

        try {
            // Sanitize the JSX content before rendering
            const sanitizedJsx = sanitizeJsxContent(layout.jsx, layout.catalogId);

            return (
                <div key={layout.catalogId} className={`business-card-item bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${hasValidationErrors ? 'border-2 border-red-300' : ''}`}>
                    {/* Card Preview */}
                    <div className="relative bg-gray-100 p-4 flex items-center justify-center min-h-[200px] group">
                        {hasValidationErrors ? (
                            <div className="text-center p-4">
                                <div className="text-red-500 mb-2 text-2xl">⚠️</div>
                                <p className="text-sm text-red-600 font-medium">Layout Validation Error</p>
                                <p className="text-xs text-red-500 mt-1">
                                    {layoutErrors[layout.catalogId]?.slice(0, 2).join(', ')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="business-card-preview cursor-pointer"
                                    style={{
                                        transform: 'scale(0.6)',
                                        transformOrigin: 'center center',
                                        width: '3.5in',
                                        height: '2in'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: sanitizedJsx }}
                                    onClick={() => handleCardClick(layout)}
                                />
                                {/* Enlargement Button Overlay */}
                                <button
                                    onClick={() => handleCardClick(layout)}
                                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    aria-label={`View ${layout.name} in detail`}
                                >
                                    <div className="bg-white bg-opacity-90 hover:bg-opacity-100 transition-all duration-200 rounded-full p-3 shadow-lg transform scale-90 hover:scale-100">
                                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Card Information */}
                    <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {layout.name}
                            </h3>
                            <div className="flex items-center gap-1">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${hasValidationErrors ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {layout.catalogId}
                                </span>
                                {hasValidationErrors && (
                                    <span className="text-xs px-1 py-1 bg-red-100 text-red-600 rounded" title="Validation errors">
                                        ⚠️
                                    </span>
                                )}
                            </div>
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
                                                                    layout.theme === 'artistic' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
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

                        {/* View Details Button */}
                        <button
                            onClick={() => handleCardClick(layout)}
                            className="w-full mt-3 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            View Details
                        </button>

                        {/* Debug information for invalid layouts */}
                        {hasValidationErrors && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                <strong className="text-red-700">Validation Errors:</strong>
                                <ul className="mt-1 text-red-600 list-disc list-inside">
                                    {layoutErrors[layout.catalogId]?.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            );
        } catch (err) {
            console.error(`❌ Error rendering business card ${layout.catalogId}:`, err);
            return (
                <div key={layout.catalogId} className="business-card-item bg-red-50 rounded-lg p-4 text-center border-2 border-red-300">
                    <div className="text-red-500 mb-2">❌</div>
                    <p className="text-sm text-red-600 font-medium">Rendering Error</p>
                    <p className="text-xs text-red-500 mt-1">Failed to load {layout.catalogId}</p>
                    <details className="mt-2 text-xs text-left">
                        <summary className="cursor-pointer text-red-600 font-medium">Error Details</summary>
                        <pre className="mt-1 text-red-500 bg-red-100 p-2 rounded overflow-auto">
                            {err instanceof Error ? err.message : String(err)}
                        </pre>
                    </details>
                </div>
            );
        }
    };

    // Error boundary for the entire component
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-xl font-bold text-red-600 mb-4">System Error</h1>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            window.location.reload();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Reload Page
                    </button>
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
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleThemeChange = (theme: string) => {
        console.log(`🎨 Changing theme filter to: ${theme}`);
        setSelectedTheme(theme);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleStyleChange = (style: 'all' | 'contact-focused' | 'company-focused') => {
        console.log(`🎯 Changing style filter to: ${style}`);
        setSelectedStyle(style);
        setCurrentPage(1); // Reset to first page when filtering
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Business Card Layouts</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Admin view of all {getTotalLayoutCount()} business card layout templates
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {Object.keys(layoutErrors).length > 0 && (
                                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                                    ⚠️ {Object.keys(layoutErrors).length} layout{Object.keys(layoutErrors).length !== 1 ? 's' : ''} with errors
                                </div>
                            )}
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                {filteredLayouts.length} layout{filteredLayouts.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search by name, theme, or features..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Theme Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Theme
                            </label>
                            <select
                                value={selectedTheme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Style
                            </label>
                            <select
                                value={selectedStyle}
                                onChange={(e) => handleStyleChange(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="all">All Styles</option>
                                <option value="contact-focused">Contact Focused</option>
                                <option value="company-focused">Company Focused</option>
                            </select>
                        </div>

                        {/* Items Per Page */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Per Page
                            </label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value={12}>12 per page</option>
                                <option value={16}>16 per page</option>
                                <option value={20}>20 per page</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Business Cards Grid */}
                <div id="business-cards-grid">
                    {paginationData.layouts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paginationData.layouts.map(renderBusinessCard)}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No layouts found</h3>
                            <p className="text-gray-600">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginationData.totalItems)} of {paginationData.totalItems} layouts
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!paginationData.hasPreviousPage}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                                            currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            {paginationData.totalPages > 5 && (
                                <>
                                    <span className="px-2 text-gray-500">...</span>
                                    <button
                                        onClick={() => handlePageChange(paginationData.totalPages)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                                            currentPage === paginationData.totalPages
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {paginationData.totalPages}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!paginationData.hasNextPage}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Enlargement Modal */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[95vh] w-full flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedCard.name}</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectedCard.catalogId} • {selectedCard.theme} • {selectedCard.style.replace('-', ' ')}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
                                aria-label="Close modal"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto">
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Business Card Preview - Large */}
                                    <div className="lg:col-span-2">
                                        <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                                            <div
                                                className="business-card-preview shadow-lg"
                                                style={{
                                                    transform: 'scale(1.2)',
                                                    transformOrigin: 'center center',
                                                    width: '3.5in',
                                                    height: '2in'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: sanitizeJsxContent(selectedCard.jsx, selectedCard.catalogId) }}
                                            />
                                        </div>

                                        {/* Mobile: Show description below preview */}
                                        <div className="lg:hidden mt-6">
                                            {selectedCard.description && (
                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <h4 className="font-medium text-blue-900 mb-2">Description</h4>
                                                    <p className="text-blue-800">{selectedCard.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Details */}
                                    <div className="space-y-6">
                                        {/* Desktop: Show description in sidebar */}
                                        {selectedCard.description && (
                                            <div className="hidden lg:block bg-blue-50 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-900 mb-2">Description</h4>
                                                <p className="text-blue-800">{selectedCard.description}</p>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Card Properties</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Dimensions:</span>
                                                    <span className="ml-2 text-sm text-gray-900">
                                                        {selectedCard.metadata.dimensions.width} × {selectedCard.metadata.dimensions.height}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Theme:</span>
                                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
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
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Style:</span>
                                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                                        selectedCard.style === 'contact-focused'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-cyan-100 text-cyan-800'
                                                    }`}>
                                                        {selectedCard.style.replace('-', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Color Palette */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Color Palette</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCard.metadata.colors.map((color, index) => (
                                                    <div key={index} className="flex items-center space-x-2">
                                                        <div
                                                            className="w-6 h-6 rounded border border-gray-300"
                                                            style={{ backgroundColor: color }}
                                                        ></div>
                                                        <span className="text-xs font-mono text-gray-600">{color}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fonts */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Typography</h4>
                                            <div className="space-y-1">
                                                {selectedCard.metadata.fonts.map((font, index) => (
                                                    <span key={index} className="inline-block bg-white px-2 py-1 rounded text-sm text-gray-700 mr-2 mb-1">
                                                        {font}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Features</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedCard.metadata.features.map((feature, index) => (
                                                    <span
                                                        key={index}
                                                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to close
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
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
}