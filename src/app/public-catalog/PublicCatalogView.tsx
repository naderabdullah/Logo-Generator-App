// src/app/public-catalog/PublicCatalogView.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface CatalogLogo {
    id: number;
    catalog_code: string;
    logo_key_id: string;
    parameters: any;
    created_at: string;
    created_by: string;
    original_company_name: string;
    // image_data_uri will be loaded separately
    image_data_uri?: string;
}

interface CatalogStats {
    totalLogos: number;
    totalContributors: number;
    latestAddition: string | null;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

// --- Simple in-memory cache manager for logo images ---
type LogoCacheEntry = {
    data: string;
    timestamp: number;
    expires: number;
};
const MAX_CACHE_SIZE = 50;
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

let _logoCache: Map<string, LogoCacheEntry> | null = null;
function getCacheManager(): Map<string, LogoCacheEntry> {
    if (!_logoCache) {
        _logoCache = new Map();
    }
    return _logoCache;
}

// Skeleton placeholder component
const LogoSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
        <div className="aspect-square mb-3 bg-gray-200 rounded-lg"></div>
        <div className="text-center mb-2">
            <div className="inline-block bg-gray-200 h-5 w-16 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded mx-auto w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded mx-auto w-1/2"></div>
    </div>
);

// FIXED: LogoCard component with better error handling to prevent infinite loops

// SIMPLIFIED: LogoCard component without aggressive abort handling

const LogoCard = ({ logo, onViewParameters }: { 
    logo: CatalogLogo; 
    onViewParameters: (logo: CatalogLogo) => void;
}) => {
    const [imageDataUri, setImageDataUri] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadAttemptedRef = useRef(false);

    // Simplified load image function
    const loadImage = useCallback(async () => {
        // Prevent multiple simultaneous loads
        if (imageLoading || imageDataUri || imageError || loadAttemptedRef.current) {
            return;
        }
        
        loadAttemptedRef.current = true;
        
        const cache = getCacheManager();
        const cacheKey = `logo-${logo.id}`;
        
        // Check cache first
        if (cache) {
            const cached = cache.get(cacheKey);
            if (cached && Date.now() < cached.expires) {
                setImageDataUri(cached.data);
                return;
            }
            // Remove expired cache entry
            if (cached) {
                cache.delete(cacheKey);
            }
        }

        setImageLoading(true);
        setImageError(false);
        
        try {
            // Simple fetch without AbortController for now
            const response = await fetch(`/api/catalog/image/${logo.id}`, {
                cache: 'default'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const imageData = data.image_data_uri;
            
            if (!imageData) {
                throw new Error('No image data received');
            }
            
            // Store in client-side cache
            if (cache) {
                const now = Date.now();
                
                // Enforce cache size limit
                if (cache.size >= MAX_CACHE_SIZE) {
                    const entries = Array.from(cache.entries())
                        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
                    cache.delete(entries[0][0]);
                }
                
                cache.set(cacheKey, {
                    data: imageData,
                    timestamp: now,
                    expires: now + CACHE_DURATION
                });
            }
            
            setImageDataUri(imageData);
            setImageError(false);
            
        } catch (error: any) {
            console.error(`Error loading logo image ${logo.id}:`, error.message);
            setImageError(true);
        } finally {
            setImageLoading(false);
        }
    }, [logo.id, imageLoading, imageDataUri, imageError]);

    // Mount effect - check cache and set up intersection observer
    useEffect(() => {
        setMounted(true);
        
        // Reset load attempted flag when logo ID changes
        loadAttemptedRef.current = false;
        
        // Check cache when component mounts
        const cache = getCacheManager();
        if (cache) {
            const cacheKey = `logo-${logo.id}`;
            const cached = cache.get(cacheKey);
            
            if (cached && Date.now() < cached.expires) {
                setImageDataUri(cached.data);
                loadAttemptedRef.current = true;
                return;
            }
            
            if (cached) {
                cache.delete(cacheKey);
            }
        }
        
        // Set up intersection observer
        if (cardRef.current && !loadAttemptedRef.current) {
            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !loadAttemptedRef.current) {
                        loadImage();
                        // Disconnect after triggering
                        if (observerRef.current) {
                            observerRef.current.disconnect();
                            observerRef.current = null;
                        }
                    }
                },
                { threshold: 0.1, rootMargin: '100px' }
            );

            observerRef.current.observe(cardRef.current);
        }

        // Cleanup function - only cleanup observer
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [logo.id, loadImage]);

    // Handle copy catalog code
    const handleCopyCatalogCode = async () => {
        try {
            await navigator.clipboard.writeText(logo.catalog_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy catalog code:', err);
            const textArea = document.createElement('textarea');
            textArea.value = logo.catalog_code;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    };

    // Handle modal open
    const handleOpenModal = () => {
        onViewParameters({ ...logo, image_data_uri: imageDataUri || undefined });
    };

    return (
        <div
            ref={cardRef}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
        >
            {/* Image - clickable for modal */}
            <div 
                className="aspect-square mb-3 bg-gray-50 rounded-lg p-2 relative cursor-pointer"
                onClick={handleOpenModal}
            >
                {!mounted ? (
                    // Not mounted yet - show placeholder
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                ) : imageError ? (
                    // Error state
                    <div className="w-full h-full bg-red-50 rounded flex items-center justify-center">
                        <div className="text-center">
                            <svg className="w-8 h-8 text-red-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-red-600">Failed to load</p>
                        </div>
                    </div>
                ) : imageLoading ? (
                    // Loading state
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                ) : imageDataUri ? (
                    // Loaded image
                    <img
                        src={imageDataUri}
                        alt={logo.original_company_name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                ) : (
                    // Default placeholder
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Catalog Code Button with Copy Icon */}
            <div className="text-center mb-2">
                <button
                    onClick={handleCopyCatalogCode}
                    className="inline-flex items-center bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                    title="Click to copy"
                >
                    <span className="mr-1">{logo.catalog_code}</span>
                    {copied ? (
                        <svg className="w-3 h-3 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Company Name - clickable for modal */}
            <div 
                className="text-sm font-medium text-gray-900 text-center truncate mb-1 cursor-pointer hover:text-indigo-600"
                onClick={handleOpenModal}
            >
                {logo.original_company_name}
            </div>
            
            {/* Creator - clickable for modal */}
            <div 
                className="text-xs text-gray-500 text-center cursor-pointer hover:text-gray-700"
                onClick={handleOpenModal}
            >
                By {logo.created_by.split('@')[0]}
            </div>
        </div>
    );
};

export default function PublicCatalogView() {
    const [catalogLogos, setCatalogLogos] = useState<CatalogLogo[]>([]);
    const [stats, setStats] = useState<CatalogStats | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLogo, setSelectedLogo] = useState<CatalogLogo | null>(null);
    const [showParametersModal, setShowParametersModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    
    // Cache for storing previously loaded results
    const cacheRef = useRef<Map<string, {
        logos: CatalogLogo[];
        stats: CatalogStats | null;
        pagination: PaginationInfo | null;
    }>>(new Map());
    
    const router = useRouter();

    const perPageOptions = [5, 10, 15, 20, 30];

    // Generate cache key for current request
    const getCacheKey = (page: number, search: string, limit: number) => {
        return `${search || 'all'}_${page}_${limit}`;
    };

    // Pagination Controls Component
    const PaginationControls = () => {
        if (!pagination || pagination.totalPages <= 1) return null;

        return (
            <div className="flex justify-center items-center space-x-4">
                <button
                    onClick={() => fetchCatalog(pagination.page - 1, searchTerm, itemsPerPage, true)}
                    disabled={pagination.page <= 1 || loadingMore}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                
                <div className="flex space-x-2">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => fetchCatalog(pageNum, searchTerm, itemsPerPage, true)}
                                disabled={loadingMore}
                                className={`px-3 py-2 rounded-md ${
                                    pageNum === pagination.page
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                } disabled:opacity-50`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                
                <button
                    onClick={() => fetchCatalog(pagination.page + 1, searchTerm, itemsPerPage, true)}
                    disabled={!pagination.hasMore || loadingMore}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        );
    };

    // Fetch catalog data with pagination and caching
    const fetchCatalog = useCallback(
        async (
            page: number = 1,
            search: string = '',
            limit?: number,
            shouldScrollToTop: boolean = true
        ) => {
            const effectiveLimit = typeof limit === 'number' ? limit : itemsPerPage;
            const cacheKey = getCacheKey(page, search, effectiveLimit);

            const cachedData = cacheRef.current.get(cacheKey);
            if (cachedData) {
                setCatalogLogos(cachedData.logos);
                if (cachedData.stats && (!stats || cachedData.stats.totalLogos > 0)) {
                    setStats(cachedData.stats);
                }
                setPagination(cachedData.pagination);

                if (shouldScrollToTop && page !== currentPage) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                setCurrentPage(page);
                return;
            }

            try {
                if (page === 1 && catalogLogos.length === 0) {
                    setInitialLoading(true);
                } else {
                    setLoadingMore(true);
                }

                const searchParams = new URLSearchParams({
                    page: page.toString(),
                    limit: effectiveLimit.toString(),
                    ...(search && { search })
                });

                const response = await fetch(`/api/catalog/public?${searchParams}`);
                if (!response.ok) throw new Error('Failed to fetch catalog');
                const data = await response.json();

                const newCacheData = {
                    logos: data.logos || [],
                    stats: data.stats || null,
                    pagination: data.pagination || null
                };

                cacheRef.current.set(cacheKey, newCacheData);
                if (cacheRef.current.size > 50) {
                    const firstKey = cacheRef.current.keys().next().value;
                    if (typeof firstKey === 'string') {
                        cacheRef.current.delete(firstKey);
                    }
                }

                setCatalogLogos(data.logos || []);
                if (data.stats) setStats(data.stats);
                setPagination(data.pagination || null);

                if (shouldScrollToTop && page !== currentPage) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                setCurrentPage(page);
            } catch (err: any) {
                setError(err.message || 'Failed to load catalog');
            } finally {
                setInitialLoading(false);
                setLoadingMore(false);
            }
        },
        [itemsPerPage]
    );

    // Search functionality with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                fetchCatalog(1, searchTerm, itemsPerPage, false); // Don't scroll to top on search
            } else {
                setCurrentPage(1);
                fetchCatalog(1, searchTerm, itemsPerPage, false); // Don't scroll to top on search
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, fetchCatalog]);

    // Handle items per page change
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
        fetchCatalog(1, searchTerm, newItemsPerPage, false); // Don't scroll to top on per-page change
    };

    const handleViewParameters = (logo: CatalogLogo) => {
        setSelectedLogo(logo);
        setShowParametersModal(true);
        setCopied(false); // Reset copy state when opening modal
    };

    const handleCopyCatalogCode = async () => {
        if (!selectedLogo) return;
        
        try {
            await navigator.clipboard.writeText(selectedLogo.catalog_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy catalog code:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = selectedLogo.catalog_code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-indigo-600 mb-2">Logo Catalog</h1>
                    <p className="text-gray-600">Browse our collection of AI-generated logos</p>
                </div>

                {/* Stats - Always show once loaded */}
                {(initialLoading && !stats) ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                                <div className="h-8 bg-gray-300 rounded w-16 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                            </div>
                        ))}
                    </div>
                ) : stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                            <div className="text-3xl font-bold text-indigo-600">{stats.totalLogos}</div>
                            <div className="text-sm text-gray-600">Total Logos</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">{stats.totalContributors}</div>
                            <div className="text-sm text-gray-600">Contributors</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                            <div className="text-lg font-semibold text-gray-700">
                                {stats.latestAddition ? 
                                    new Date(stats.latestAddition).toLocaleDateString() : 
                                    'N/A'
                                }
                            </div>
                            <div className="text-sm text-gray-600">Latest Addition</div>
                        </div>
                    </div>
                ) : null}

                {/* Search and Per Page Controls - Always Visible */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by company name or catalog code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">Per page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            {perPageOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results count and Top Pagination - Always Visible */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        {(initialLoading && catalogLogos.length === 0) ? (
                            <span>Loading logos...</span>
                        ) : (
                            <>
                                Showing {catalogLogos.length} of {pagination?.total || 0} logos
                                {pagination && pagination.totalPages > 1 && (
                                    <span className="ml-2">
                                        (Page {pagination.page} of {pagination.totalPages})
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <PaginationControls />
                </div>

                {/* Logo Grid - Show loading skeletons only here when needed */}
                {(initialLoading && catalogLogos.length === 0) ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({ length: itemsPerPage }, (_, i) => (
                            <LogoSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {catalogLogos.map((logo) => (
                            <LogoCard 
                                key={logo.id} 
                                logo={logo} 
                                onViewParameters={handleViewParameters}
                            />
                        ))}
                    </div>
                )}

                {/* Loading indicator when changing pages */}
                {loadingMore && (
                    <div className="flex justify-center mt-8">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                            <span className="text-sm text-gray-600">Loading page...</span>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {catalogLogos.length === 0 && !initialLoading && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No logos found matching your search.</p>
                    </div>
                )}

                {/* Bottom Page Navigation - Always Visible */}
                <div className="mt-8 mb-8">
                    <PaginationControls />
                </div>

                {/* Parameters Modal */}
                {showParametersModal && selectedLogo && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Logo Details</h3>
                                        {/* Copy button in modal header */}
                                        <div className="flex items-center mt-2">
                                            <span className="text-sm text-gray-600 mr-2">Catalog Code:</span>
                                                <button
                                                    onClick={handleCopyCatalogCode}
                                                    className="inline-flex items-center bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded hover:bg-indigo-200 transition-colors"
                                                    title="Click to copy catalog code"
                                                >
                                                    <span className="mr-2">{selectedLogo.catalog_code}</span>
                                                    {copied ? (
                                                        <svg className="w-4 h-4 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowParametersModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Logo preview in modal */}
                                <div className="mb-4">
                                    {selectedLogo.image_data_uri ? (
                                        <img
                                            src={selectedLogo.image_data_uri}
                                            alt={selectedLogo.original_company_name}
                                            className="w-full max-w-md mx-auto h-auto object-contain bg-gray-50 rounded-lg p-4"
                                        />
                                    ) : (
                                        <div className="w-full max-w-md mx-auto h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Company:</span>
                                        <span className="ml-2 text-gray-900">{selectedLogo.original_company_name}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Created by:</span>
                                        <span className="ml-2 text-gray-900">{selectedLogo.created_by}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Date:</span>
                                        <span className="ml-2 text-gray-900">
                                            {new Date(selectedLogo.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    {/* Parameters */}
                                    {selectedLogo.parameters && (
                                        <div className="mt-4">
                                            <h4 className="font-medium text-gray-700 mb-2">Generation Parameters:</h4>
                                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                                                {Object.entries(selectedLogo.parameters).map(([key, value]) => (
                                                    <div key={key} className="flex">
                                                        <span className="font-medium text-gray-600 w-1/3 capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                                                        </span>
                                                        <span className="text-gray-900 w-2/3 break-words">
                                                            {value ? String(value) : 'Not specified'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowParametersModal(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}