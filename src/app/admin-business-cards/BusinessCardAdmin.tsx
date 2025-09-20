// FILE: src/app/admin-business-cards/BusinessCardAdmin.tsx
// ACTION: FULL FILE REPLACEMENT
// PURPOSE: Add modal navigation functionality to iterate through business cards

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
 * - Modal navigation to iterate through cards without closing
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

    // Modal state with navigation support
    const [selectedCard, setSelectedCard] = useState<BusinessCardLayout | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModalIndex, setCurrentModalIndex] = useState(0);

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

    // Handle modal opening with navigation setup (after filteredLayouts is defined)
    const handleCardClick = useCallback((layout: BusinessCardLayout) => {
        try {
            console.log(`🔍 Opening enlargement modal for ${layout.catalogId}: ${layout.name}`);

            // Find the index of the selected card in filtered layouts
            const index = filteredLayouts.findIndex(l => l.catalogId === layout.catalogId);
            if (index === -1) {
                console.error(`❌ Could not find ${layout.catalogId} in filtered layouts`);
                setError('Failed to open card details');
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
            setError('Failed to open card details');
        }
    }, [filteredLayouts]);

    // Navigate to previous card in modal
    const navigateToPrevious = useCallback(() => {
        try {
            if (currentModalIndex > 0) {
                const newIndex = currentModalIndex - 1;
                const newCard = filteredLayouts[newIndex];

                console.log(`⬅️ Navigating to previous card: ${newCard.catalogId} (${newIndex + 1}/${filteredLayouts.length})`);

                setCurrentModalIndex(newIndex);
                setSelectedCard(newCard);

                console.log('✅ Previous navigation completed');
            } else {
                console.log('⚠️ Already at first card, cannot navigate previous');
            }
        } catch (err) {
            console.error('❌ Error navigating to previous card:', err);
            setError('Failed to navigate to previous card');
        }
    }, [currentModalIndex, filteredLayouts]);

    // Navigate to next card in modal
    const navigateToNext = useCallback(() => {
        try {
            if (currentModalIndex < filteredLayouts.length - 1) {
                const newIndex = currentModalIndex + 1;
                const newCard = filteredLayouts[newIndex];

                console.log(`➡️ Navigating to next card: ${newCard.catalogId} (${newIndex + 1}/${filteredLayouts.length})`);

                setCurrentModalIndex(newIndex);
                setSelectedCard(newCard);

                console.log('✅ Next navigation completed');
            } else {
                console.log('⚠️ Already at last card, cannot navigate next');
            }
        } catch (err) {
            console.error('❌ Error navigating to next card:', err);
            setError('Failed to navigate to next card');
        }
    }, [currentModalIndex, filteredLayouts]);

    // Handle modal closing
    const closeModal = useCallback(() => {
        try {
            console.log('❌ Closing enlargement modal');
            setIsModalOpen(false);
            setSelectedCard(null);
            setCurrentModalIndex(0);

            // Restore body scroll
            document.body.style.overflow = 'unset';

            console.log('✅ Modal closed successfully');
        } catch (err) {
            console.error('❌ Error closing modal:', err);
        }
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isModalOpen) return;

            try {
                switch (event.key) {
                    case 'Escape':
                        console.log('⌨️ Escape key pressed - closing modal');
                        closeModal();
                        break;
                    case 'ArrowLeft':
                        console.log('⌨️ Left arrow key pressed - navigating previous');
                        event.preventDefault();
                        navigateToPrevious();
                        break;
                    case 'ArrowRight':
                        console.log('⌨️ Right arrow key pressed - navigating next');
                        event.preventDefault();
                        navigateToNext();
                        break;
                    default:
                        break;
                }
            } catch (err) {
                console.error('❌ Error handling keyboard navigation:', err);
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleKeyDown);
            console.log('🎹 Keyboard navigation listeners added');

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                console.log('🎹 Keyboard navigation listeners removed');
            };
        }
    }, [isModalOpen, closeModal, navigateToPrevious, navigateToNext]);

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
                    {/* Card Preview - ORIGINAL WITH HOVER REMOVED */}
                    <div className="relative bg-gray-100 p-4 flex items-center justify-center min-h-[200px] group">
                        {hasValidationErrors ? (
                            <div className="text-center text-red-600">
                                <div className="text-lg font-semibold mb-2">⚠️ Validation Error</div>
                                <div className="text-sm">
                                    {layoutErrors[layout.catalogId].map((error, idx) => (
                                        <div key={idx}>{error}</div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="business-card-preview"
                                style={{
                                    transform: 'scale(0.7)',
                                    transformOrigin: 'center center',
                                    width: '3.5in',
                                    height: '2in'
                                }}
                                dangerouslySetInnerHTML={{ __html: sanitizedJsx }}
                            />
                        )}
                    </div>

                    {/* Card Info */}
                    <div className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{layout.name}</h3>
                                    <button
                                        onClick={() => handleCardClick(layout)}
                                        className="ml-2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                        aria-label="View details"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{layout.catalogId}</p>

                                <div className="flex items-center space-x-2 mt-2">
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

                                {layout.metadata.features && layout.metadata.features.length > 0 && (
                                    <div className="mt-2">
                                        <div className="flex flex-wrap gap-1">
                                            {layout.metadata.features.slice(0, 3).map((feature, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                    {feature}
                                                </span>
                                            ))}
                                            {layout.metadata.features.length > 3 && (
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                    +{layout.metadata.features.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                    </div>
                </div>
            );
        } catch (err) {
            console.error(`❌ Error rendering business card ${layout.catalogId}:`, err);
            return (
                <div key={layout.catalogId} className="business-card-item bg-white rounded-lg shadow-md overflow-hidden border-2 border-red-300">
                    <div className="p-4 text-center text-red-600">
                        <div className="text-lg font-semibold mb-2">⚠️ Render Error</div>
                        <div className="text-sm">Failed to render {layout.name}</div>
                        <div className="text-xs mt-1 text-gray-500">{layout.catalogId}</div>
                    </div>
                </div>
            );
        }
    };

    // Handle filter changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleThemeChange = (theme: string) => {
        setSelectedTheme(theme);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleStyleChange = (style: 'all' | 'contact-focused' | 'company-focused') => {
        setSelectedStyle(style);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    // Access control - Fixed to use correct user properties
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">Please log in to access the admin panel.</p>
                </div>
            </div>
        );
    }

    if (!user.isSuperUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access this page. Super user privileges required.</p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Current user: {user.email}</p>
                        <p>Super user status: {user.isSuperUser ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Card Layouts</h1>
                    <p className="text-gray-600">
                        Catalog of {getTotalLayoutCount()} pre-generated business card layouts
                        {filteredLayouts.length !== BUSINESS_CARD_LAYOUTS.length && ` (${filteredLayouts.length} filtered)`}
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                                <div className="mt-3">
                                    <button
                                        onClick={() => setError(null)}
                                        className="text-sm bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-md transition-colors duration-200"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                Search Layouts
                            </label>
                            <input
                                type="text"
                                id="search"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search by name, theme, or features..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
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
                                onChange={(e) => handleStyleChange(e.target.value as 'all' | 'contact-focused' | 'company-focused')}
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

                {/* Results Summary */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {paginationData.layouts.length} of {filteredLayouts.length} layouts
                    {paginationData.totalPages > 1 && ` • Page ${currentPage} of ${paginationData.totalPages}`}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Loading skeletons */}
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                                    <div className="flex space-x-2">
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : paginationData.layouts.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No layouts found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginationData.layouts.map(layout => renderBusinessCard(layout))}
                    </div>
                )}

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLayouts.length)} of {filteredLayouts.length} results
                        </div>

                        <div className="flex items-center space-x-2">
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

            {/* Enhanced Enlargement Modal with Navigation */}
            {isModalOpen && selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[95vh] w-full flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{selectedCard.name}</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectedCard.catalogId} • {selectedCard.theme} • {selectedCard.style.replace('-', ' ')}
                                </p>
                                <div className="text-xs text-gray-500 mt-1">
                                    Card {currentModalIndex + 1} of {filteredLayouts.length}
                                </div>
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
                                                    transform: 'scale(1.5)',
                                                    transformOrigin: 'center',
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeJsxContent(selectedCard.jsx, selectedCard.catalogId)
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Business Card Details */}
                                    <div className="space-y-6">
                                        {/* Card Info */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Card Information</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Catalog ID:</span>
                                                    <span className="ml-2 text-sm text-gray-900">{selectedCard.catalogId}</span>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">Name:</span>
                                                    <span className="ml-2 text-sm text-gray-900">{selectedCard.name}</span>
                                                </div>
                                                <div className="flex items-center">
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
                                                <div className="flex items-center">
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

                                        {/* Description (if available) */}
                                        {selectedCard.description && (
                                            <div className="bg-blue-50 rounded-lg p-4">
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
                                            </div>
                                        </div>

                                        {/* Color Palette - RESTORED */}
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

                                        {/* Typography - RESTORED */}
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
                                        {selectedCard.metadata.features && selectedCard.metadata.features.length > 0 && (
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <h4 className="font-medium text-green-900 mb-3">Features</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedCard.metadata.features.map((feature, index) => (
                                                        <span
                                                            key={index}
                                                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                                                        >
                                                            {feature}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Modal Footer with Navigation */}
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <div className="flex justify-between items-center">
                                {/* Navigation Controls */}
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={navigateToPrevious}
                                        disabled={currentModalIndex === 0}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label="Previous card"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Previous
                                    </button>

                                    <span className="text-sm text-gray-600 px-3 py-1 bg-gray-100 rounded">
                                        {currentModalIndex + 1} of {filteredLayouts.length}
                                    </span>

                                    <button
                                        onClick={navigateToNext}
                                        disabled={currentModalIndex === filteredLayouts.length - 1}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label="Next card"
                                    >
                                        Next
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Keyboard Shortcuts and Close */}
                                <div className="flex items-center space-x-4">
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <div>
                                            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">←</kbd>
                                            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono ml-1">→</kbd>
                                            <span className="ml-1">Navigate</span>
                                        </div>
                                        <div>
                                            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Esc</kbd>
                                            <span className="ml-1">Close</span>
                                        </div>
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
                </div>
            )}
        </div>
    );
}