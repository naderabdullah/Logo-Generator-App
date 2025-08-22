// src/app/history/HistoryView.tsx - COMPLETE with search, bulk selection, and actions dropdown + ONLY lazy loading and simple pagination
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';


import ImageDisplay from '@/app/components/ImageDisplay';
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

// ADDED: Lazy loading image component
const LazyImage = ({ src, alt, className }: {
  src: string; 
  alt: string; className: string;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={className}>
      {!isInView ? (
        <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      ) : (
        <>
          {!isLoaded && !hasError && (
            <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          )}
          {hasError ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          )}
        </>
      )}
    </div>
  );
};

export default function HistoryView() {
  const { user } = useAuth();
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

  const [catalogStates, setCatalogStates] = useState<{[logoId: string]: {
      isInCatalog: boolean;
      catalogLoading: boolean;
      catalogCode: string | null;
    }}>({});
  
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
        } else {
          throw new Error('Failed to fetch user data');
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

const handleAddToCatalog = async (displayedLogo: StoredLogo) => {
    if (!user?.isSuperUser) return;

    const logoId = displayedLogo.id;
    const currentState = catalogStates[logoId];

    if (currentState?.isInCatalog) return;

    setCatalogStates(prev => ({
        ...prev,
        [logoId]: {
            ...prev[logoId],
            catalogLoading: true
        }
    }));

    try {
        const response = await fetch('/api/catalog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                logoKeyId: displayedLogo.id,
                imageDataUri: displayedLogo.imageDataUri,
                parameters: displayedLogo.parameters,
                originalCompanyName: displayedLogo.parameters.companyName || 'Unknown Company'
            }),
        });

        if (response.ok) {
            const data = await response.json();
            setCatalogStates(prev => ({
                ...prev,
                [logoId]: {
                    isInCatalog: true,
                    catalogLoading: false,
                    catalogCode: data.catalogLogo.catalog_code
                }
            }));
        } else if (response.status === 409) {
            // Logo already in catalog
            const data = await response.json();
            setCatalogStates(prev => ({
                ...prev,
                [logoId]: {
                    isInCatalog: true,
                    catalogLoading: false,
                    catalogCode: data.catalogCode
                }
            }));
        } else {
            throw new Error('Failed to add to catalog');
        }
    } catch (error) {
        console.error('Error adding to catalog:', error);
        setCatalogStates(prev => ({
            ...prev,
            [logoId]: {
                ...prev[logoId],
                catalogLoading: false
            }
        }));
    }
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
  const currentLogos = useMemo(() => {
    return filteredLogosWithRevisions.slice(startIndex, endIndex);
  }, [filteredLogosWithRevisions, startIndex, endIndex]);

  const currentLogoIds = useMemo(() => {
    return currentLogos.map(({ original, revisions }) => {
      const latestRevision = getLatestRevision(revisions);
      const displayedLogo = latestRevision || original;
      return displayedLogo.id;
    });
  }, [currentLogos]);

  useEffect(() => {
    const checkAllCatalogStatuses = async () => {
      if (!user?.isSuperUser) return;

      const logoIds = currentLogos.map(({ original, revisions }) => {
        const latestRevision = getLatestRevision(revisions);
        const displayedLogo = latestRevision || original;
        return displayedLogo.id;
      });

      // Check catalog status for each displayed logo
      for (const logoId of logoIds) {
        try {
          const response = await fetch('/api/catalog', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ logoKeyId: logoId }),
          });

          if (response.ok) {
            const data = await response.json();
            setCatalogStates(prev => ({
              ...prev,
              [logoId]: {
                isInCatalog: data.isInCatalog,
                catalogLoading: false,
                catalogCode: data.catalogLogo?.catalog_code || null
              }
            }));
          }
        } catch (error) {
          console.error(`Error checking catalog status for logo ${logoId}:`, error);
          setCatalogStates(prev => ({
            ...prev,
            [logoId]: {
              isInCatalog: false,
              catalogLoading: false,
              catalogCode: null
            }
          }));
        }
      }
    };

    if (currentLogos.length > 0) {
      checkAllCatalogStatuses();
    }
  }, [currentLogoIds, user?.isSuperUser]);

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

  // Handle bulk download
  const handleBulkDownload = async (format: 'png' | 'svg' | 'jpg') => {
    setBulkActionLoading(true);
    
    try {
      const selectedData = getSelectedLogosData();
      
      if (selectedData.length === 0) {
        return;
      }

      const zip = new JSZip();
      
      for (const { logo, filename } of selectedData) {
        if (format === 'png') {
          // Convert data URI to blob and add to ZIP
          const response = await fetch(logo.imageDataUri);
          const blob = await response.blob();
          zip.file(`${filename}.png`, blob);
        } else if (format === 'jpg') {
          // Convert PNG to JPG
          const response = await fetch(logo.imageDataUri);
          const blob = await response.blob();
          
          // Create a canvas to convert to JPG
          const img = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          await new Promise((resolve) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Fill with white background for JPG
              ctx!.fillStyle = '#FFFFFF';
              ctx!.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw the image
              ctx!.drawImage(img, 0, 0);
              
              canvas.toBlob((jpgBlob) => {
                if (jpgBlob) {
                  zip.file(`${filename}.jpg`, jpgBlob);
                }
                resolve(void 0);
              }, 'image/jpeg', 0.9);
            };
            img.src = logo.imageDataUri;
          });
        } else if (format === 'svg') {
          try {
            // Convert data URI to blob
            const response = await fetch(logo.imageDataUri);
            const blob = await response.blob();
            
            // Create form data for SVG conversion
            const formData = new FormData();
            const file = new File([blob], 'logo.png', { type: blob.type });
            formData.append('image', file);
            
            // Set options for SVG conversion
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
            
            if (serverResponse.ok) {
              const result = await serverResponse.json();
              if (result.svg && result.svg.includes('<svg')) {
                zip.file(`${filename}.svg`, result.svg);
              } else {
                console.warn(`Failed to convert ${filename} to SVG`);
              }
            }
          } catch (error) {
            console.warn(`Failed to process ${filename}:`, error);
          }
        }
      }
      
      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-logos-${format}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(`${format.toUpperCase()} bulk download failed:`, error);
    } finally {
      setBulkActionLoading(false);
      setShowActionsDropdown(false);
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
        <h2 className="text-2xl text-indigo-600 font-semibold mb-2 text-center">Logo History</h2>

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
                    <div
                      className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div
                        className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                        onClick={() => handleBulkDownload('png')}
                        role="menuitem"
                      >
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 group-hover:text-gray-900 bg-transparent appearance-none outline-none text-left"
                          type="button"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span className="flex-1">Download as PNG</span>
                        </button>
                      </div>

                      <div
                        className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                        onClick={() => handleBulkDownload('jpg')}
                        role="menuitem"
                      >
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 group-hover:text-gray-900 bg-transparent appearance-none outline-none text-left"
                          type="button"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span className="flex-1">Download as JPG</span>
                        </button>
                      </div>

                      <div
                        className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                        onClick={() => handleBulkDownload('svg')}
                        role="menuitem"
                      >
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 group-hover:text-gray-900 bg-transparent appearance-none outline-none text-left"
                          type="button"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span className="flex-1">Download as SVG</span>
                        </button>
                      </div>

                      <div className="h-px bg-gray-200" />

                      <div
                        className="group w-full cursor-pointer transition-colors hover:bg-red-50"
                        onClick={() => setShowBulkDeleteModal(true)}
                        role="menuitem"
                      >
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 group-hover:text-red-800 bg-transparent appearance-none outline-none text-left"
                          type="button"
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

        {/* Search Bar */}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search logos by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pl-10"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Pagination Controls Top */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 per page</option>
                <option value={3}>3 per page</option>
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleSelectAllCurrentPage}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 underline whitespace-nowrap"
              >
                Select page
              </button>
              <button
                onClick={handleSelectAllFiltered}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 underline whitespace-nowrap"
              >
                Select all
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {searchQuery ? (
              <>
                Showing {filteredLogosWithRevisions.length} of {logosWithRevisions.length} logos
                {filteredLogosWithRevisions.length === 0 && (
                  <span className="text-red-600 ml-2">No matches found</span>
                )}
              </>
            ) : (
              `${logosWithRevisions.length} total logos`
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your logos...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* No Logos State */}
        {!loading && !error && logosWithRevisions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't created any logos yet.</p>
            <Link href="/" className="btn btn-primary">
              Create Your First Logo
            </Link>
          </div>
        )}

        {/* No Search Results State */}
        {!loading && !error && logosWithRevisions.length > 0 && filteredLogosWithRevisions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No logos match your search.</p>
            <button onClick={clearSearch} className="btn btn-secondary">
              Clear Search
            </button>
          </div>
        )}

        {/* Logos Grid */}
        {!loading && !error && filteredLogosWithRevisions.length > 0 && (
          <>
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
                      {/* Logo Image - MODIFIED: Now uses LazyImage */}
                      <div className="flex-shrink-0">
                        <LazyImage
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
                          {user?.isSuperUser && (() => {
                            const catalogState = catalogStates[displayedLogo.id] || {
                              isInCatalog: false,
                              catalogLoading: false,
                              catalogCode: null
                            };

                            return (
                                <button
                                    onClick={() => handleAddToCatalog(displayedLogo)}
                                    disabled={catalogState.catalogLoading || catalogState.isInCatalog}
                                    className={`btn-action flex items-center space-x-1 text-xs ${
                                        catalogState.isInCatalog
                                            ? 'bg-gray-800 text-white cursor-not-allowed'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                                    }`}
                                >
                                  {catalogState.catalogLoading ? (
                                      <>
                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Adding...</span>
                                      </>
                                  ) : catalogState.isInCatalog ? (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>

                                        {catalogState.catalogCode && (
                                            <span className="text-xs">({catalogState.catalogCode})</span>
                                        )}
                                      </>
                                  ) : (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M12 4v16m8-8H4"/>
                                        </svg>
                                        <span>Catalog</span>
                                      </>
                                  )}
                                </button>
                            );
                          })()}

                          <button
                              onClick={() => confirmDeleteLogo(displayedLogo.id)}
                            className="btn-action btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Selection Checkbox */}
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

            {/* Pagination Controls - Bottom - UPDATED: Simple pagination like catalog */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
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