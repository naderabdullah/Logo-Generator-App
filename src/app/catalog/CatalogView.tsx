// src/app/catalog/CatalogView.tsx - Updated with smart loading
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

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

// Smart loading LogoCard component with intersection observer
const CatalogLogoCard = ({ logo, onViewParameters }: { 
    logo: CatalogLogo; 
    onViewParameters: (logo: CatalogLogo) => void;
}) => {
    const [imageDataUri, setImageDataUri] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Intersection observer for when card becomes visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !imageDataUri && !imageLoading && !imageError) {
                    setIsVisible(true);
                    loadImage();
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [imageDataUri, imageLoading, imageError]);

    const loadImage = async () => {
        setImageLoading(true);
        try {
            const response = await fetch(`/api/catalog/image/${logo.id}`);
            
            if (!response.ok) {
                throw new Error('Failed to load image');
            }
            
            const data = await response.json();
            setImageDataUri(data.image_data_uri);
        } catch (error) {
            console.error('Error loading logo image:', error);
            setImageError(true);
        } finally {
            setImageLoading(false);
        }
    };

    return (
        <div
            ref={cardRef}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewParameters({ ...logo, image_data_uri: imageDataUri || undefined })}
        >
            <div className="aspect-square mb-3 bg-gray-50 rounded-lg p-2 relative">
                {!isVisible || (!imageDataUri && !imageLoading && !imageError) ? (
                    // Placeholder until visible
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                ) : imageLoading ? (
                    // Loading state with spinner
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
                    // Error state
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Catalog Code */}
            <div className="text-center mb-2">
                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded">
                    {logo.catalog_code}
                </span>
            </div>

            {/* Company Name */}
            <div className="text-sm font-medium text-gray-900 text-center truncate mb-1">
                {logo.original_company_name}
            </div>

            {/* Creator */}
            <div className="text-xs text-gray-500 text-center">
                By {logo.created_by.split('@')[0]}
            </div>

            {/* Date */}
            <div className="text-xs text-gray-500 text-center mt-1">
                {new Date(logo.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })}
            </div>
        </div>
    );
};

export default function CatalogView() {
    const [catalogLogos, setCatalogLogos] = useState<CatalogLogo[]>([]);
    const [stats, setStats] = useState<CatalogStats | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLogo, setSelectedLogo] = useState<CatalogLogo | null>(null);
    const [showParametersModal, setShowParametersModal] = useState(false);

    const { user } = useAuth();
    const router = useRouter();

    // Redirect if not authorized
    useEffect(() => {
        if (!user || !user.isSuperUser) {
            router.push('/');
            return;
        }
    }, [user, router]);

    // Fetch catalog data with pagination like public catalog
    const fetchCatalog = useCallback(async (page: number = 1, search: string = '') => {
        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            
            const searchParams = new URLSearchParams({
                page: page.toString(),
                limit: '30',
                ...(search && { search })
            });

            const response = await fetch(`/api/catalog/public?${searchParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch catalog');
            }
            
            const data = await response.json();
            
            // Always replace content for page navigation
            setCatalogLogos(data.logos || []);
            setStats(data.stats || null);
            setPagination(data.pagination || null);
            setCurrentPage(page);
            
        } catch (err: any) {
            setError(err.message || 'Failed to load catalog');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        if (user?.isSuperUser) {
            fetchCatalog(1, searchTerm);
        }
    }, [fetchCatalog, user]);

    // Search functionality with debounce
    useEffect(() => {
        if (!user?.isSuperUser) return;
        
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                fetchCatalog(1, searchTerm);
            } else {
                setCurrentPage(1);
                fetchCatalog(1, searchTerm);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, fetchCatalog, user, currentPage]);

    // Remove the old client-side filtering useEffect

    // Remove old client-side filtering and pagination logic - now handled server-side
    
    // Handle viewing logo parameters
    const handleViewParameters = (logo: CatalogLogo) => {
        setSelectedLogo(logo);
        setShowParametersModal(true);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Render parameter value nicely
    const renderParameterValue = (key: string, value: any) => {
        if (value === null || value === undefined || value === '') return 'Not specified';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'string') return value;
        return JSON.stringify(value);
    };

    // Check authorization
    if (!user || !user.isSuperUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access the catalog.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading catalog...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 pb-6 max-w-7xl">
            <div className="mt-4">
                {/* Header Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-indigo-600 mb-2">
                                📚 Logo Catalog
                            </h1>
                            <p className="text-gray-600">
                                Comprehensive catalog of all generated logos
                            </p>
                        </div>

                        {/* Statistics */}
                        {stats && (
                            <div className="mt-4 md:mt-0">
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    {/* Total Logos */}
                                    <div style={{ flex: 1, backgroundColor: '#e0e7ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4338ca' }}>
                                            {stats.totalLogos}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#4338ca' }}>
                                            Total Logos
                                        </div>
                                    </div>

                                    {/* Total Contributors */}
                                    <div style={{ flex: 1, backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
                                            {stats.totalContributors}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#16a34a' }}>
                                            Contributors
                                        </div>
                                    </div>

                                    {/* Latest Addition */}
                                    <div style={{ flex: 1, backgroundColor: '#f3e8ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#9333ea' }}>
                                            {stats.latestAddition ? 
                                                new Date(stats.latestAddition).toLocaleDateString() : 
                                                'N/A'
                                            }
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#9333ea' }}>
                                            Latest Addition
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by company name, catalog code, creator, industry, or style..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Results count */}
                    <div className="text-sm text-gray-600">
                        Showing {catalogLogos.length} of {pagination?.total || 0} logos
                        {pagination && pagination.totalPages > 1 && (
                            <span className="ml-2">
                                (Page {pagination.page} of {pagination.totalPages})
                            </span>
                        )}
                    </div>
                </div>

                {/* Logo Grid with Smart Loading */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {catalogLogos.map((logo) => (
                        <CatalogLogoCard 
                            key={logo.id} 
                            logo={logo} 
                            onViewParameters={handleViewParameters}
                        />
                    ))}
                </div>

                {/* Pagination Controls like public catalog */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-8">
                        <button
                            onClick={() => fetchCatalog(pagination.page - 1, searchTerm)}
                            disabled={pagination.page <= 1 || loadingMore}
                            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-300"
                        >
                            Previous
                        </button>
                        
                        <span className="px-3 py-2 text-sm text-gray-600">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        
                        <button
                            onClick={() => fetchCatalog(pagination.page + 1, searchTerm)}
                            disabled={pagination.page >= pagination.totalPages || loadingMore}
                            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-300"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Loading indicator when changing pages */}
                {loadingMore && (
                    <div className="flex justify-center items-center mt-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                )}

                {/* Empty State */}
                {catalogLogos.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No matching logos found' : 'No logos in catalog'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm ? 'Try adjusting your search terms.' : 'The catalog is empty.'}
                        </p>
                    </div>
                )}

                {/* Parameters Modal */}
                {showParametersModal && selectedLogo && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                {/* Modal Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {selectedLogo.catalog_code}
                                        </h3>
                                        <p className="text-gray-600">{selectedLogo.original_company_name}</p>
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

                                {/* Logo Image */}
                                {selectedLogo.image_data_uri && (
                                    <div className="mb-6">
                                        <img
                                            src={selectedLogo.image_data_uri}
                                            alt={selectedLogo.original_company_name}
                                            className="w-full max-w-md mx-auto h-auto object-contain bg-gray-50 rounded-lg p-4"
                                        />
                                    </div>
                                )}

                                {/* Basic Info */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700">Catalog Code:</span>
                                            <span className="ml-2 text-gray-900">{selectedLogo.catalog_code}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Company:</span>
                                            <span className="ml-2 text-gray-900">{selectedLogo.original_company_name}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Created By:</span>
                                            <span className="ml-2 text-gray-900">{selectedLogo.created_by}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Date:</span>
                                            <span className="ml-2 text-gray-900">{formatDate(selectedLogo.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Parameters */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Generation Parameters</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            {Object.entries(selectedLogo.parameters || {}).map(([key, value]) => (
                                                <div key={key} className="flex">
                                                    <span className="font-medium text-gray-700 w-1/3 capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                                    </span>
                                                    <span className="text-gray-900 w-2/3 break-words">
                                                        {renderParameterValue(key, value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Actions */}
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
        </main>
    );
}