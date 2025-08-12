// src/app/history/HistoryView.tsx - COMPLETE with search, bulk selection, and actions dropdown
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllLogosWithRevisions, 
  deleteLogo, 
  StoredLogo,
  getUserUsage,
  syncUserUsageWithDynamoDB
} from '@/app/utils/indexedDBUtils';
import Link from 'next/link';
// @ts-ignore - JSZip might not have perfect types
import JSZip from 'jszip';

export default function HistoryView() {
  const [logosWithRevisions, setLogosWithRevisions] = useState<{
    original: StoredLogo;
    revisions: StoredLogo[];
  }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number, limit: number } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection state
  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        setLoading(true);
        
        const userResponse = await fetch('/api/user');
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const email = userData.email;
          setUserEmail(email);
          
          // FIXED: Pass userId (email) as first parameter
          await syncUserUsageWithDynamoDB(email, {
            logosCreated: userData.logosCreated,
            logosLimit: userData.logosLimit
          });
          
          setUsage({
            used: userData.logosCreated,
            limit: userData.logosLimit
          });
          
          // FIXED: Pass userId (email) to getAllLogosWithRevisions
          const allLogosWithRevisions = await getAllLogosWithRevisions(email);
          setLogosWithRevisions(allLogosWithRevisions);
        } else if (userResponse.status === 401) {
          router.push('/login?redirect=/history');
          return;
        }
        
      } catch (err) {
        console.error('Error fetching logos:', err);
        setError('Failed to load logo history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogos();
  }, [router]);

  // Reset to page 1 when items per page changes or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchQuery]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedLogos(new Set());
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionsDropdown(false);
    };
    
    if (showActionsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsDropdown]);

  const getLatestRevision = (revisions: StoredLogo[]): StoredLogo | null => {
    if (revisions.length === 0) return null;
    return [...revisions].sort((a, b) => 
      (b.revisionNumber || 0) - (a.revisionNumber || 0)
    )[0];
  };
  
  const handleViewLogo = (id: string) => {
    router.push(`/logos/${id}`);
  };
  
  const handleEditLogo = (id: string) => {
    router.push(`/?edit=${id}`);
  };
  
  const confirmDeleteLogo = (id: string) => {
    setSelectedLogo(id);
  };
  
  const handleDeleteLogo = async () => {
    if (!selectedLogo || !userEmail) return;
    
    try {
      // FIXED: Pass userId (email) to deleteLogo
      await deleteLogo(selectedLogo, userEmail);
      
      // FIXED: Pass userId (email) to getAllLogosWithRevisions
      const allLogosWithRevisions = await getAllLogosWithRevisions(userEmail);
      setLogosWithRevisions(allLogosWithRevisions);
      setSelectedLogo(null);
      
      // Remove from selection if it was selected
      setSelectedLogos(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedLogo);
        return newSet;
      });
      
      // Adjust current page if needed after deletion
      const totalPages = Math.ceil((filteredLogosWithRevisions.length) / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error('Error deleting logo:', err);
      setError('Failed to delete logo');
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // ADD: Filtered logos based on search query
  const filteredLogosWithRevisions = useMemo(() => {
    if (!searchQuery.trim()) {
      return logosWithRevisions;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    return logosWithRevisions.filter(({ original, revisions }) => {
      // Search in original logo name and company name
      const originalMatches = 
        original.name?.toLowerCase().includes(query) ||
        original.parameters.companyName?.toLowerCase().includes(query);
      
      // Search in revision names
      const revisionMatches = revisions.some(revision => 
        revision.name?.toLowerCase().includes(query) ||
        revision.parameters.companyName?.toLowerCase().includes(query)
      );
      
      return originalMatches || revisionMatches;
    });
  }, [logosWithRevisions, searchQuery]);

  // ADD: Clear search function
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Pagination calculations - use filtered logos
  const totalLogos = filteredLogosWithRevisions.length;
  const totalPages = Math.ceil(totalLogos / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogos = filteredLogosWithRevisions.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  // Bulk selection functions
  const handleLogoSelect = (logoId: string, checked: boolean) => {
    setSelectedLogos(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(logoId);
      } else {
        newSet.delete(logoId);
      }
      return newSet;
    });
  };

  const handleSelectAllCurrentPage = () => {
    const currentPageLogoIds = currentLogos.map(({ original, revisions }) => {
      const latestRevision = getLatestRevision(revisions);
      const displayedLogo = latestRevision || original;
      return displayedLogo.id;
    });
    
    setSelectedLogos(prev => {
      const newSet = new Set(prev);
      currentPageLogoIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const handleDeselectAll = () => {
    setSelectedLogos(new Set());
  };

  const handleSelectAllFiltered = () => {
    const allFilteredLogoIds = filteredLogosWithRevisions.map(({ original, revisions }) => {
      const latestRevision = getLatestRevision(revisions);
      const displayedLogo = latestRevision || original;
      return displayedLogo.id;
    });
    
    setSelectedLogos(new Set(allFilteredLogoIds));
  };

  // Helper function to create safe filename from logo name
  const createSafeFilename = (name: string | undefined, fallback: string = 'logo'): string => {
    if (!name || name.trim() === '' || name === 'Untitled') {
      return fallback;
    }
    
    // Remove special characters and replace spaces with hyphens
    return name
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .toLowerCase();
  };

  // Get selected logos data
  const getSelectedLogosData = () => {
    const selectedData: Array<{ logo: StoredLogo; filename: string }> = [];
    
    for (const { original, revisions } of filteredLogosWithRevisions) {
      const latestRevision = getLatestRevision(revisions);
      const displayedLogo = latestRevision || original;
      
      if (selectedLogos.has(displayedLogo.id)) {
        const baseFileName = createSafeFilename(displayedLogo.name, `logo-${displayedLogo.parameters.companyName || 'untitled'}`);
        selectedData.push({
          logo: displayedLogo,
          filename: baseFileName
        });
      }
    }
    
    return selectedData;
  };

  // Download individual logo as SVG (using existing method)
  const downloadAsSVG = async (imageDataUri: string, baseFilename: string) => {
    try {
      // Convert data URI to blob
      const response = await fetch(imageDataUri);
      const blob = await response.blob();
      
      // Create form data for SVG conversion
      const formData = new FormData();
      const file = new File([blob], 'logo.png', { type: blob.type });
      formData.append('image', file);
      
      // Set options for SVG conversion (using simple type)
      const options = {
        type: 'simple',
        width: 1000,
        height: 1000,
        threshold: 128,
        color: '#000000'
      };
      
      formData.append('options', JSON.stringify(options));
      
      // Call SVG conversion API
      const serverResponse = await fetch('/api/convert-to-svg', {
        method: 'POST',
        body: formData
      });
      
      if (!serverResponse.ok) {
        const error = await serverResponse.json();
        throw new Error(error.error || 'SVG conversion failed');
      }
      
      const result = await serverResponse.json();
      
      if (!result.svg || !result.svg.includes('<svg')) {
        throw new Error('Invalid SVG output');
      }
      
      return result.svg;
      
    } catch (error) {
      console.error('SVG conversion error:', error);
      throw error;
    }
  };

  // Download individual logo as PNG or JPEG
  const downloadAsFormat = async (imageDataUri: string, format: 'png' | 'jpeg') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise<Blob>((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          if (format === 'jpeg') {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create JPEG blob'));
            }, 'image/jpeg', 0.9);
          } else {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create PNG blob'));
            }, 'image/png');
          }
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUri;
    });
  };

  // Download selected logos in specific format as ZIP
  const handleBulkDownload = async (format: 'png' | 'jpeg' | 'svg') => {
    if (selectedLogos.size === 0) return;
    
    setBulkActionLoading(true);
    setShowActionsDropdown(false);
    
    try {
      const zip = new JSZip();
      const selectedData = getSelectedLogosData();
      
      for (const { logo, filename } of selectedData) {
        try {
          if (format === 'svg') {
            // Convert to SVG and add to zip
            const svgContent = await downloadAsSVG(logo.imageDataUri, filename);
            zip.file(`${filename}.svg`, svgContent);
          } else {
            // Convert to PNG/JPEG and add to zip
            const blob = await downloadAsFormat(logo.imageDataUri, format);
            zip.file(`${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`, blob);
          }
        } catch (error) {
          console.error(`Error converting ${filename} to ${format}:`, error);
        }
      }
      
      // Generate and download the zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logos-${format}-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(`Error creating ${format} zip file:`, error);
      alert(`Failed to create ${format.toUpperCase()} zip file. Please try again.`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedLogos.size === 0 || !userEmail) return;
    
    setBulkActionLoading(true);
    setShowBulkDeleteModal(false);
    
    try {
      // Delete each selected logo
      for (const logoId of selectedLogos) {
        try {
          await deleteLogo(logoId, userEmail);
        } catch (error) {
          console.error(`Error deleting logo ${logoId}:`, error);
        }
      }
      
      // Refresh the logos list
      const allLogosWithRevisions = await getAllLogosWithRevisions(userEmail);
      setLogosWithRevisions(allLogosWithRevisions);
      setSelectedLogos(new Set());
      
      // Adjust current page if needed after deletion
      const newTotalLogos = allLogosWithRevisions.length;
      const newTotalPages = Math.ceil(newTotalLogos / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
    } catch (error) {
      console.error('Error in bulk delete:', error);
      setError('Failed to delete some logos');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const selectedCount = selectedLogos.size;
  const hasSelection = selectedCount > 0;
  
  return (
    <main className="container mx-auto px-4 pb-6 max-w-4xl history-page">
      <div className="mt-2 card">
        <h2 className="text-xl font-semibold mb-2 text-center">Logo History</h2>

        {/* Bulk Actions Bar */}
        {hasSelection && (
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-indigo-800">
                  {selectedCount} logo{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsDropdown(!showActionsDropdown);
                    }}
                    disabled={bulkActionLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {bulkActionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-t border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        <span>Actions</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showActionsDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleBulkDownload('png')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span className="flex-1">Download as PNG</span>
                        </button>
                        <button
                          onClick={() => handleBulkDownload('jpeg')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span className="flex-1">Download as JPEG</span>
                        </button>
                        <button
                          onClick={() => handleBulkDownload('svg')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span className="flex-1">Download as SVG</span>
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => setShowBulkDeleteModal(true)}
                          className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="flex-1">Delete Selected</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Pagination Controls */}
        {!loading && !error && logosWithRevisions.length > 0 && (
          <>
            {/* Pagination Controls - Top */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-1 gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="form-select w-auto min-w-0 py-1 px-2 text-sm"
                >
                  <option value={1}>1 per page</option>
                  <option value={3}>3 per page</option>
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
              </div>
              
              {/* Search Bar in the middle */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="form-input w-full text-sm"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }}
                    placeholder="Search logos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {searchQuery ? (
                  <>Showing {Math.min(startIndex + 1, totalLogos)}-{Math.min(endIndex, totalLogos)} of {totalLogos} search results</>
                ) : (
                  <>Showing {Math.min(startIndex + 1, totalLogos)}-{Math.min(endIndex, totalLogos)} of {totalLogos} logos</>
                )}
              </div>
            </div>

            {/* Bulk Selection Controls */}
            {totalLogos > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                <span className="text-gray-600">Select:</span>
                <button
                  onClick={handleSelectAllCurrentPage}
                  className="text-indigo-600 hover:text-indigo-700 underline"
                >
                  All on page
                </button>
                <span className="text-gray-400">•</span>
                <button
                  onClick={handleSelectAllFiltered}
                  className="text-indigo-600 hover:text-indigo-700 underline"
                >
                  All {searchQuery ? 'search results' : 'logos'} ({totalLogos})
                </button>
                {hasSelection && (
                  <>
                    <span className="text-gray-400">•</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-gray-600 hover:text-gray-700 underline"
                    >
                      Clear selection
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Search Results Info */}
            {searchQuery && filteredLogosWithRevisions.length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-600 mb-2">No logos found matching "{searchQuery}"</p>
                <button 
                  onClick={clearSearch}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear search to see all logos
                </button>
              </div>
            )}
          </>
        )}
        
        {loading && (
          <div className="text-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your logos...</p>
          </div>
        )}
        
        {error && !loading && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && logosWithRevisions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't created any logos yet.</p>
            <Link href="/" className="btn btn-primary">
              Create Your First Logo
            </Link>
          </div>
        )}

        {!loading && !error && filteredLogosWithRevisions.length > 0 && (
          <>
            {/* Logos Grid */}
            <div className="grid gap-2">
              {currentLogos.map(({ original, revisions }) => {
                // Determine which logo to display (latest revision or original)
                const latestRevision = getLatestRevision(revisions);
                const displayedLogo = latestRevision || original;
                const hasRevisions = revisions.length > 0;
                const isSelected = selectedLogos.has(displayedLogo.id);
                
                return (
                  <div key={original.id} className={`border rounded-lg p-4 bg-white shadow-sm transition-all ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Logo Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={displayedLogo.imageDataUri}
                          alt={displayedLogo.name}
                          className="w-32 h-32 object-contain border border-gray-200 rounded"
                        />
                      </div>
                      
                      {/* Logo Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {displayedLogo.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Created: {formatDate(original.createdAt)}
                            </p>
                            {hasRevisions && (
                              <p className="text-sm text-indigo-600 font-medium">
                                Showing: Revision {latestRevision?.revisionNumber} 
                                <span className="text-gray-500"> ({3 - revisions.length} remaining)</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Company Name and Details */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">
                            Company: {displayedLogo.parameters.companyName}
                          </p>
                          {displayedLogo.parameters.slogan && (
                            <p className="text-sm text-gray-600">
                              Slogan: "{displayedLogo.parameters.slogan}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {displayedLogo.parameters.overallStyle} •&nbsp;
                            {displayedLogo.parameters.colorScheme}
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewLogo(displayedLogo.id)}
                            className="btn-action btn-primary"
                          >
                            {hasRevisions ? "View All" : "View Logo"}
                          </button>
                          
                          <button
                            onClick={() => handleEditLogo(displayedLogo.id)}
                            className="btn-action btn-secondary"
                            disabled={revisions.length >= 3}
                          >
                            {revisions.length >= 3 ? "Max Revisions" : "Edit Logo"}
                          </button>
                          
                          <button
                            onClick={() => confirmDeleteLogo(displayedLogo.id)}
                            className="btn-action btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Selection Checkbox - moved to the right */}
                      <div className="flex-shrink-0 flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleLogoSelect(displayedLogo.id, e.target.checked)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          aria-label={`Select ${displayedLogo.name}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls - Bottom */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="btn-action btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Show first, last, current, and nearby pages
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`btn-action ${
                          page === currentPage 
                            ? 'btn-primary' 
                            : 'btn-secondary'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="btn-action btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {selectedLogo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Logo</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this logo and all its revisions? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteLogo}
                className="btn-action btn-danger flex-1"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedLogo(null)}
                className="btn-action btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Selected Logos</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete {selectedCount} selected logo{selectedCount !== 1 ? 's' : ''} and all their revisions? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="btn-action btn-danger flex-1"
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? 'Deleting...' : 'Delete All'}
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="btn-action btn-secondary flex-1"
                disabled={bulkActionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}