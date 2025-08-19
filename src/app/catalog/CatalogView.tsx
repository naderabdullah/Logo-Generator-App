// src/app/catalog/CatalogView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

// Define the CatalogLogo interface to match the backend
interface CatalogLogo {
    id: number;
    catalog_code: string;
    logo_key_id: string;
    image_data_uri: string;
    parameters: any; // LogoParameters
    created_at: string;
    created_by: string;
    original_company_name: string;
}

interface CatalogStats {
    totalLogos: number;
    totalContributors: number;
    latestAddition: string | null;
}

export default function CatalogView() {
    const { user } = useAuth();
    const router = useRouter();

    // State management
    const [catalogLogos, setCatalogLogos] = useState<CatalogLogo[]>([]);
    const [stats, setStats] = useState<CatalogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredLogos, setFilteredLogos] = useState<CatalogLogo[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Modal state for viewing parameters
    const [selectedLogo, setSelectedLogo] = useState<CatalogLogo | null>(null);
    const [showParametersModal, setShowParametersModal] = useState(false);

    // Check authorization
    useEffect(() => {
        if (!user || !user.isSuperUser) {
            router.push('/');
            return;
        }
    }, [user, router]);

    // Fetch catalog data
    useEffect(() => {
        const fetchCatalogData = async () => {
            if (!user || !user.isSuperUser) return;

            try {
                setLoading(true);

                // Fetch catalog logos and stats in parallel
                const [catalogResponse, statsResponse] = await Promise.all([
                    fetch('/api/catalog'),
                    fetch('/api/catalog?action=stats')
                ]);

                if (!catalogResponse.ok || !statsResponse.ok) {
                    throw new Error('Failed to fetch catalog data');
                }

                const catalogData = await catalogResponse.json();
                const statsData = await statsResponse.json();

                setCatalogLogos(catalogData.catalogLogos || []);
                setStats(statsData.stats || null);
                setFilteredLogos(catalogData.catalogLogos || []);

            } catch (err) {
                console.error('Error fetching catalog:', err);
                setError('Failed to load catalog data');
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogData();
    }, [user]);

    // Handle search filtering
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredLogos(catalogLogos);
            setCurrentPage(1);
            return;
        }

        const filtered = catalogLogos.filter(logo =>
            logo.catalog_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            logo.original_company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            logo.created_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (logo.parameters.industry && logo.parameters.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (logo.parameters.overallStyle && logo.parameters.overallStyle.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        setFilteredLogos(filtered);
        setCurrentPage(1);
    }, [searchTerm, catalogLogos]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredLogos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentLogos = filteredLogos.slice(startIndex, endIndex);

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
                                {/* Ultra simple horizontal layout */}
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
                                            {stats.latestAddition ? formatDate(stats.latestAddition) : 'N/A'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#9333ea' }}>
                                            Latest Addition
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by catalog code, company name, creator, industry, or style..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading catalog...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredLogos.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No matching logos found' : 'No logos in catalog yet'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm ? 'Try adjusting your search terms' : 'Logos will appear here when users add them to the catalog'}
                        </p>
                    </div>
                )}

                {/* Results Info & Pagination Controls */}
                {!loading && !error && filteredLogos.length > 0 && (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredLogos.length)} of {filteredLogos.length} logos
                    {searchTerm && ` (filtered from ${catalogLogos.length})`}
                </span>

                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="form-select w-auto min-w-0 py-1 px-2 text-sm"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={15}>15 per page</option>
                                    <option value={20}>20 per page</option>
                                    <option value={25}>25 per page</option>
                                    <option value={50}>50 per page</option>
                                </select>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Logo Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {currentLogos.map((logo) => (
                                <div
                                    key={logo.id}
                                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleViewParameters(logo)}
                                >
                                    {/* Logo Image */}
                                    <div className="aspect-square mb-3 bg-gray-50 rounded-lg p-2">
                                        <img
                                            src={logo.image_data_uri}
                                            alt={logo.original_company_name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {/* Catalog Code */}
                                    <div className="text-center mb-2">
                    <span
                        className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded">
                      {logo.catalog_code}
                    </span>
                                    </div>

                                    {/* Company Name */}
                                    <div className="text-sm font-medium text-gray-900 text-center truncate mb-1">
                                        {logo.original_company_name}
                                    </div>

                                    {/* Quick Parameters */}
                                    <div className="text-xs text-gray-500 text-center space-y-1">
                                        <div className="truncate">
                                            {logo.parameters.industry || 'Unknown Industry'}
                                        </div>
                                        <div className="truncate">
                                            {logo.parameters.overallStyle || 'Unknown Style'}
                                        </div>
                                    </div>

                                    {/* Creation Info */}
                                    <div
                                        className="text-xs text-gray-400 text-center mt-2 pt-2 border-t border-gray-100">
                                        <div className="truncate">By: {logo.created_by}</div>
                                        <div>{formatDate(logo.created_at)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Parameters Modal */}
            {showParametersModal && selectedLogo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="border-b border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {selectedLogo.catalog_code} - {selectedLogo.original_company_name}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Created by {selectedLogo.created_by} on {formatDate(selectedLogo.created_at)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowParametersModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Logo Image */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900">Logo Preview</h3>
                                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                                        <img
                                            src={selectedLogo.image_data_uri}
                                            alt={selectedLogo.original_company_name}
                                            className="max-w-full max-h-80 object-contain mx-auto"
                                        />
                                    </div>
                                </div>

                                {/* Parameters */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900">Generation Parameters</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            {/* Core Parameters */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="font-medium text-gray-700">Company:</div>
                                                <div className="col-span-2 text-gray-900">{selectedLogo.parameters.companyName || 'Not specified'}</div>
                                            </div>

                                            {selectedLogo.parameters.slogan && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="font-medium text-gray-700">Slogan:</div>
                                                    <div className="col-span-2 text-gray-900">"{selectedLogo.parameters.slogan}"</div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="font-medium text-gray-700">Industry:</div>
                                                <div className="col-span-2 text-gray-900">{renderParameterValue('industry', selectedLogo.parameters.industry)}</div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="font-medium text-gray-700">Style:</div>
                                                <div className="col-span-2 text-gray-900">{renderParameterValue('overallStyle', selectedLogo.parameters.overallStyle)}</div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="font-medium text-gray-700">Colors:</div>
                                                <div className="col-span-2 text-gray-900">{renderParameterValue('colorScheme', selectedLogo.parameters.colorScheme)}</div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="font-medium text-gray-700">Symbol:</div>
                                                <div className="col-span-2 text-gray-900">{renderParameterValue('symbolFocus', selectedLogo.parameters.symbolFocus)}</div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="font-medium text-gray-700">Personality:</div>
                                                <div className="col-span-2 text-gray-900">{renderParameterValue('brandPersonality', selectedLogo.parameters.brandPersonality)}</div>
                                            </div>

                                            {/* Optional Parameters */}
                                            {Object.entries(selectedLogo.parameters).map(([key, value]) => {
                                                // Skip already displayed parameters
                                                if (['companyName', 'slogan', 'industry', 'overallStyle', 'colorScheme', 'symbolFocus', 'brandPersonality'].includes(key)) {
                                                    return null;
                                                }

                                                // Skip empty values
                                                if (!value || value === '' || value === 'undefined') {
                                                    return null;
                                                }

                                                // Format key name for display
                                                const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                                                return (
                                                    <div key={key} className="grid grid-cols-3 gap-2">
                                                        <div className="font-medium text-gray-700">{displayKey}:</div>
                                                        <div className="col-span-2 text-gray-900">{renderParameterValue(key, value)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowParametersModal(false)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}