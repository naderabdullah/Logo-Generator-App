// src/app/components/SharedCatalogComponent.tsx
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

interface SharedCatalogProps {
    apiEndpoint: string; // '/api/catalog' or '/api/catalog/public'
    title: string;
    defaultItemsPerPage?: number;
    canRemoveLogos?: boolean;
    onRemoveLogo?: (logoId: number) => Promise<void>;
    hasHeader?: boolean; // Whether the page has a header
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
const LogoCard = ({ 
    logo, 
    onViewParameters,
    canRemove,
    onRemove
}: { 
    logo: CatalogLogo; 
    onViewParameters: (logo: CatalogLogo) => void;
    canRemove?: boolean;
    onRemove?: (logo: CatalogLogo) => void;
}) => {
    const [imageDataUri, setImageDataUri] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadAttempted = useRef(false);
    
    const cacheManager = getCacheManager();
    
    const loadImage = useCallback(async () => {
        if (imageLoading || imageDataUri || imageError || loadAttempted.current) {
            return;
        }
        
        loadAttempted.current = true;
        setImageLoading(true);
        setImageError(false);
        
        try {
            const cache = getCacheManager();
            const cacheKey = `logo-${logo.id}`;
            
            // Check cache first
            const cached = cache.get(cacheKey);
            if (cached && Date.now() < cached.expires) {
                setImageDataUri(cached.data);
                setImageError(false);
                setImageLoading(false);
                return;
            }
            
            // Fetch from API using logo.id
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
            
            setImageDataUri(imageData);
            setImageError(false);
            
            // Update cache
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
        } catch (error: any) {
            console.error(`Error loading logo image ${logo.id}:`, error.message);
            setImageError(true);
        } finally {
            setImageLoading(false);
        }
    }, [logo.id, imageLoading, imageDataUri, imageError]);
    
    useEffect(() => {
        setMounted(true);
        loadAttempted.current = false;
        
        if (cardRef.current && !loadAttempted.current) {
            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !loadAttempted.current) {
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
            setMounted(false);
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [logo.id]);
    
    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(logo.catalog_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = logo.catalog_code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    return (
        <div 
            ref={cardRef} 
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewParameters(logo)}
        >
            <div className="aspect-square mb-3 bg-gray-50 rounded-lg p-2 relative">
                {imageLoading && !imageDataUri && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                )}
                
                {imageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Failed to load</span>
                    </div>
                )}
                
                {imageDataUri && (
                    <img 
                        src={imageDataUri}
                        alt={`Logo for ${logo.original_company_name}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                )}
            </div>
            
            <div className="text-center space-y-1">
                <div className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
                    {logo.catalog_code}
                </div>
                
                <p className="text-sm font-medium text-gray-900 px-2 leading-tight break-words" title={logo.original_company_name}>
                    {logo.original_company_name}
                </p>
                
                <p className="text-xs text-gray-500">
                    {new Date(logo.created_at).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

export default function SharedCatalogComponent({
    apiEndpoint,
    title,
    defaultItemsPerPage = 15,
    canRemoveLogos = false,
    onRemoveLogo,
    hasHeader = false
}: SharedCatalogProps) {
    const [catalogLogos, setCatalogLogos] = useState<CatalogLogo[]>([]);
    const [stats, setStats] = useState<CatalogStats | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedLogo, setSelectedLogo] = useState<CatalogLogo | null>(null);
    const [showParametersModal, setShowParametersModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [logoToRemove, setLogoToRemove] = useState<CatalogLogo | null>(null);
    const [removing, setRemoving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
    const [industryFilter, setIndustryFilter] = useState<string>('all');
    
    const router = useRouter();
    const perPageOptions = defaultItemsPerPage === 30 ? [6, 12, 18, 30, 60] : [5, 10, 15, 20, 30];

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

            const response = await fetch(`${apiEndpoint}?${searchParams}`);
            
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
    }, [apiEndpoint]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fetch data when page, search, industry, or limit changes
    useEffect(() => {
        fetchCatalog(currentPage, searchTerm, industryFilter, itemsPerPage);
    }, [currentPage, searchTerm, industryFilter, itemsPerPage, fetchCatalog]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleIndustryChange = (value: string) => {
        setIndustryFilter(value);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        const currentFirstItem = (currentPage - 1) * itemsPerPage + 1;
        const newPage = Math.max(1, Math.ceil(currentFirstItem / newItemsPerPage));
        
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(newPage);
    };

    const handleViewParameters = (logo: CatalogLogo) => {
        setSelectedLogo(logo);
        setShowParametersModal(true);
        setCopied(false);
        
        // If the logo doesn't have image data, fetch it
        if (!logo.image_data_uri) {
            fetch(`/api/catalog/image/${logo.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.image_data_uri) {
                        setSelectedLogo(prev => prev ? {...prev, image_data_uri: data.image_data_uri} : prev);
                    }
                })
                .catch(console.error);
        }
    };

    const handleAskRemove = (logo: CatalogLogo) => {
        if (canRemoveLogos) {
            setLogoToRemove(logo);
            setShowRemoveModal(true);
        }
    };

    const handleConfirmRemove = async () => {
        if (!logoToRemove || !onRemoveLogo) return;
        setRemoving(true);
        try {
            await onRemoveLogo(logoToRemove.id);
            setShowRemoveModal(false);
            setLogoToRemove(null);
            setShowParametersModal(false);
            await fetchCatalog(currentPage, searchTerm, industryFilter, itemsPerPage);
        } catch (e: any) {
            alert(e.message || 'Failed to remove from catalog');
        } finally {
            setRemoving(false);
        }
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

    const renderParameterValue = (key: string, value: any) => {
        if (value === null || value === undefined || value === '') return 'Not specified';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    const PaginationControls = () => {
        if (!pagination || pagination.totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages = [];
            const totalPages = pagination.totalPages;
            const current = currentPage;
            
            pages.push(1);
            
            const start = Math.max(2, current - 1);
            const end = Math.min(totalPages - 1, current + 1);
            
            if (start > 2) pages.push('...');
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (end < totalPages - 1) pages.push('...');
            
            if (totalPages > 1) pages.push(totalPages);
            
            return pages;
        };

        const pages = getPageNumbers();

        return (
            <div className="flex items-center justify-center space-x-2">
                <button
                    onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                        scrollToTop();
                    }}
                    disabled={currentPage <= 1 || loadingMore}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                
                <div className="flex space-x-1">
                    {pages.map((pageNum, idx) => {
                        if (pageNum === '...') {
                            return <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500">...</span>;
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => {
                                    setCurrentPage(Number(pageNum));
                                    scrollToTop();
                                }}
                                disabled={loadingMore}
                                className={`px-3 py-2 text-sm rounded-md ${
                                    currentPage === pageNum
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
                    onClick={() => {
                        setCurrentPage(p => Math.min(pagination.totalPages, p + 1));
                        scrollToTop();
                    }}
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
        <div className={`min-h-screen bg-gray-50 ${hasHeader ? 'pt-16' : ''}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8 text-center">
                    <h1 className={`text-3xl font-bold text-indigo-600 ${hasHeader ? 'mt-8' : 'mt-4'} mb-2`}>{title}</h1>
                    
                    {stats && (
                        <div className="text-gray-600 space-y-1">
                            <p className="text-lg">Browse our collection of AI-generated logos</p>
                            <p className="text-sm">
                                {stats.totalLogos} logos • {stats.totalContributors} contributors
                                {stats.latestAddition && ` • Latest: ${new Date(stats.latestAddition).toLocaleDateString()}`}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by company name or catalog code..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="industry-filter" className="text-sm text-gray-600 whitespace-nowrap">
                                Industry:
                            </label>
                            <select
                                id="industry-filter"
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
                        <div className="flex justify-end mt-2">
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
                                    <span>
                                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} logos
                                    </span>
                                ) : (
                                    <span>No logos found</span>
                                )}
                            </>
                        )}
                    </div>
                    
                    {pagination && pagination.totalPages > 1 && (
                        <div className="text-sm text-gray-600">
                            Page {currentPage} of {pagination.totalPages}
                        </div>
                    )}
                </div>

                {/* Top Pagination Controls */}
                {!initialLoading && catalogLogos.length > 0 && (
                    <div className="mb-6">
                        <PaginationControls />
                    </div>
                )}

                {/* Logo Grid */}
                {initialLoading && catalogLogos.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: itemsPerPage }).map((_, i) => (
                            <LogoSkeleton key={i} />
                        ))}
                    </div>
                ) : catalogLogos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {catalogLogos.map(logo => (
                                <LogoCard 
                                    key={logo.id} 
                                    logo={logo} 
                                    onViewParameters={handleViewParameters}
                                    canRemove={canRemoveLogos}
                                    onRemove={handleAskRemove}
                                />
                            ))}
                        </div>
                        
                        {loadingMore && (
                            <div className="mt-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        {searchTerm || industryFilter !== 'all' 
                            ? 'No logos found matching your search criteria' 
                            : 'No logos in the catalog yet'}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-8 pb-8">
                        <PaginationControls />
                    </div>
                )}
            </div>

            {/* Parameters Modal */}
            {showParametersModal && selectedLogo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Logo Details</h3>
                                <button
                                    onClick={() => setShowParametersModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="flex justify-center">
                                <div className="w-48 h-48 bg-gray-100 rounded-lg p-4">
                                    {selectedLogo.image_data_uri ? (
                                        <img 
                                            src={selectedLogo.image_data_uri} 
                                            alt={selectedLogo.original_company_name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            Loading...
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Catalog Code:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                            {selectedLogo.catalog_code}
                                        </code>
                                        <button
                                            onClick={handleCopyCatalogCode}
                                            className="text-indigo-600 hover:text-indigo-800"
                                            title="Copy catalog code"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                            </svg>
                                        </button>
                                        {copied && (
                                            <span className="text-green-600 text-sm">Copied!</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <span className="font-medium">Company:</span> {selectedLogo.original_company_name}
                                </div>
                                
                                <div>
                                    <span className="font-medium">Created:</span> {new Date(selectedLogo.created_at).toLocaleString()}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-medium mb-2">Parameters:</h4>
                                <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
                                    {Object.entries(selectedLogo.parameters || {}).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="font-medium text-gray-600">{key}:</span>
                                            <span className="text-gray-800 text-right max-w-[60%]">
                                                {renderParameterValue(key, value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {canRemoveLogos && (
                                <div className="pt-4 border-t">
                                    <button
                                        onClick={() => handleAskRemove(selectedLogo)}
                                        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        Remove from Catalog
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Confirmation Modal */}
            {showRemoveModal && logoToRemove && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Confirm Removal</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to remove this logo from the catalog?
                        </p>
                        <div className="bg-gray-50 rounded p-3 mb-6">
                            <p className="text-sm"><strong>Code:</strong> {logoToRemove.catalog_code}</p>
                            <p className="text-sm"><strong>Company:</strong> {logoToRemove.original_company_name}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRemoveModal(false)}
                                disabled={removing}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRemove}
                                disabled={removing}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {removing ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}