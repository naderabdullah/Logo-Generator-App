// src/app/public-catalog/PublicCatalogView.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { INDUSTRIES } from '@/app/constants/industries';

interface CatalogLogo {
    id: number;
    catalog_code: string;
    logo_key_id: string;
    parameters: any;
    created_at: string;
    created_by: string;
    original_company_name: string;
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

// Cache manager for logo images
type LogoCacheEntry = {
    data: string;
    timestamp: number;
    expires: number;
};
const MAX_CACHE_SIZE = 30;
const CACHE_DURATION = 1000 * 60 * 10;

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

// LogoCard component
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

    const loadImage = useCallback(async () => {
        if (imageLoading || imageDataUri || imageError || loadAttemptedRef.current) {
            return;
        }
        
        loadAttemptedRef.current = true;
        setImageLoading(true);
        setImageError(false);
        
        try {
            const cache = getCacheManager();
            const cacheKey = `logo-${logo.id}`;
            
            const cached = cache.get(cacheKey);
            if (cached && Date.now() < cached.expires) {
                setImageDataUri(cached.data);
                setImageError(false);
                setImageLoading(false);
                return;
            }
            
            // FIX: Use the correct API endpoint without /public
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
            
            const now = Date.now();
            if (cache.size >= MAX_CACHE_SIZE) {
                const firstKey = cache.keys().next().value;
                if (typeof firstKey === 'string') {
                    cache.delete(firstKey);
                }
            }
            
            cache.set(cacheKey, {
                data: imageData,
                timestamp: now,
                expires: now + CACHE_DURATION
            });
            
            setImageDataUri(imageData);
            setImageError(false);
            
        } catch (error: any) {
            console.error(`Error loading logo image ${logo.id}:`, error.message);
            setImageError(true);
        } finally {
            setImageLoading(false);
        }
    }, [logo.id, imageLoading, imageDataUri, imageError]);

    useEffect(() => {
        setMounted(true);
        loadAttemptedRef.current = false;
        
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
        
        if (cardRef.current && !loadAttemptedRef.current) {
            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !loadAttemptedRef.current) {
                        loadImage();
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

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [logo.id, loadImage]);

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

    const handleOpenModal = () => {
        onViewParameters({ ...logo, image_data_uri: imageDataUri || undefined });
    };

    return (
        <div
            ref={cardRef}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
        >
            <div 
                className="aspect-square mb-3 bg-gray-50 rounded-lg p-2 relative cursor-pointer"
                onClick={handleOpenModal}
            >
                {!mounted ? (
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                ) : imageError ? (
                    <div className="w-full h-full bg-red-50 rounded flex items-center justify-center">
                        <div className="text-center">
                            <svg className="w-8 h-8 text-red-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-red-600">Failed to load</p>
                        </div>
                    </div>
                ) : imageLoading ? (
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                ) : imageDataUri ? (
                    <img
                        src={imageDataUri}
                        alt={logo.original_company_name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

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

            <div 
                className="text-sm font-medium text-gray-900 text-center truncate mb-1 cursor-pointer hover:text-indigo-600"
                onClick={handleOpenModal}
            >
                {logo.original_company_name}
            </div>
            
            <div 
                className="text-xs text-gray-500 text-center cursor-pointer hover:text-gray-700"
                onClick={handleOpenModal}
            >
                {logo.parameters?.industry || 'Unknown Industry'}
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
    const [industryFilter, setIndustryFilter] = useState<string>('all');
    
    const router = useRouter();
    const perPageOptions = [5, 10, 15, 20, 30];

    const fetchCatalog = useCallback(async (page: number, search: string, industry: string, limit: number) => {
        setLoadingMore(page > 1);
        if (page === 1) {
            setInitialLoading(true);
        }

        try {
            const searchParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(industry !== 'all' && { industry })
            });

            const response = await fetch(`/api/catalog/public?${searchParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch catalog');
            }
            
            const data = await response.json();
            
            setCatalogLogos(data.logos || []);
            setStats(data.stats || null);
            setPagination(data.pagination || null);
            
        } catch (err: any) {
            setError(err.message || 'Failed to load catalog');
        } finally {
            setInitialLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Fetch data when page, search, industry, or limit changes
    useEffect(() => {
        fetchCatalog(currentPage, searchTerm, industryFilter, itemsPerPage);
    }, [currentPage, searchTerm, industryFilter, itemsPerPage, fetchCatalog]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to page 1 when search changes
    };

    const handleIndustryChange = (value: string) => {
        setIndustryFilter(value);
        setCurrentPage(1); // Reset to page 1 when filter changes
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        // Calculate which page we should be on to maintain approximate position
        const currentFirstItem = (currentPage - 1) * itemsPerPage + 1;
        const newPage = Math.max(1, Math.ceil(currentFirstItem / newItemsPerPage));
        
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(newPage);
    };

    const handleViewParameters = (logo: CatalogLogo) => {
        setSelectedLogo(logo);
        setShowParametersModal(true);
        setCopied(false);
    };

    const handleCopyCatalogCode = async () => {
        if (!selectedLogo) return;
        
        try {
            await navigator.clipboard.writeText(selectedLogo.catalog_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy catalog code:', err);
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

    const PaginationControls = () => {
        if (!pagination || pagination.totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages = [];
            const totalPages = pagination.totalPages;
            const current = currentPage;
            
            // Always show first page
            pages.push(1);
            
            // Show pages around current page
            const start = Math.max(2, current - 1);
            const end = Math.min(totalPages - 1, current + 1);
            
            // Add ellipsis if needed
            if (start > 2) pages.push(-1); // -1 represents ellipsis
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            // Add ellipsis if needed
            if (end < totalPages - 1) pages.push(-1);
            
            // Always show last page if more than 1 page
            if (totalPages > 1) pages.push(totalPages);
            
            return pages;
        };

        return (
            <div className="flex justify-center items-center space-x-2">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || loadingMore}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                
                <div className="flex space-x-1">
                    {getPageNumbers().map((pageNum, idx) => {
                        if (pageNum === -1) {
                            return (
                                <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-400">
                                    ...
                                </span>
                            );
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={loadingMore}
                                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                    pageNum === currentPage
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                } disabled:opacity-50`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                
                <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage >= pagination.totalPages || loadingMore}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        );
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
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-indigo-600 mb-2">Logo Catalog</h1>
                    <p className="text-gray-600">Browse our collection of AI-generated logos</p>
                </div>

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

                <div className="mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by company name or catalog code..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 whitespace-nowrap">Industry:</span>
                            <select
                                value={industryFilter}
                                onChange={(e) => handleIndustryChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-w-[160px]"
                            >
                                <option value="all">All Industries</option>
                                {INDUSTRIES.map(industry => (
                                    <option key={industry} value={industry}>{industry}</option>
                                ))}
                            </select>
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
                    
                    {(searchTerm.trim() || industryFilter !== 'all') && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setIndustryFilter('all');
                                    setCurrentPage(1);
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        {(initialLoading && catalogLogos.length === 0) ? (
                            <span>Loading logos...</span>
                        ) : (
                            <>
                                {pagination && pagination.total > 0 ? (
                                    <>
                                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} logos
                                    </>
                                ) : (
                                    'No logos found'
                                )}
                            </>
                        )}
                    </div>
                    <PaginationControls />
                </div>

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

                {loadingMore && (
                    <div className="flex justify-center mt-8">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                            <span className="text-sm text-gray-600">Loading page...</span>
                        </div>
                    </div>
                )}

                {catalogLogos.length === 0 && !initialLoading && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No logos found matching your search.</p>
                    </div>
                )}

                <div className="mt-8 mb-8">
                    <PaginationControls />
                </div>

                {showParametersModal && selectedLogo && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Logo Details</h3>
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

                                <div className="mb-4">
                                    {selectedLogo.image_data_uri ? (
                                        <img
                                            src={selectedLogo.image_data_uri}
                                            alt={selectedLogo.original_company_name}
                                            className="w-full max-w-md mx-auto h-auto object-contain bg-gray-50 rounded-lg p-4"
                                        />
                                    ) : (
                                        <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <p className="text-gray-500">Loading image...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="text-sm text-gray-600 mb-4">
                                    <p><strong>Company:</strong> {selectedLogo.original_company_name}</p>
                                    <p><strong>Industry:</strong> {selectedLogo.parameters.industry}</p>
                                    <p><strong>Date:</strong> {new Date(selectedLogo.created_at).toLocaleDateString()}</p>
                                </div>

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