// src/app/history/HistoryView.tsx - EXACT CATALOG PATTERN - ONLY LOAD CURRENT PAGE LOGOS
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { 
  deleteLogo, 
  StoredLogo,
  getUserUsage,
  syncUserUsageWithDynamoDB,
  getLogo,
  getOriginalLogos,
  getRevisionsForLogo
} from '@/app/utils/indexedDBUtils';
import Link from 'next/link';
// @ts-ignore - JSZip might not have perfect types
import JSZip from 'jszip';
import { INDUSTRIES } from '@/app/constants/industries';

// Metadata-only interface (excludes heavy imageDataUri)
interface LogoMetadata {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  parameters: any;
  isRevision: boolean;
  originalLogoId?: string;
  revisionNumber?: number;
}

interface LogoWithRevisions {
  original: LogoMetadata;
  revisions: LogoMetadata[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Cache manager for images
const MAX_CACHE_SIZE = 20;
const CACHE_DURATION = 5 * 60 * 1000;

let imageCache: Map<string, { data: string; expires: number; timestamp: number }> | null = null;

const getCacheManager = () => {
  if (typeof window === 'undefined') return null;
  if (!imageCache) {
    imageCache = new Map();
  }
  return imageCache;
};

// Lazy loading image component
const LazyLogoImage = ({ logoId, userEmail, alt, className }: {
  logoId: string;
  userEmail: string;
  alt: string; 
  className: string;
}) => {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadAttemptedRef = useRef(false);

  const loadImage = useCallback(async () => {
    if (imageLoading || imageDataUri || imageError || loadAttemptedRef.current) {
      return;
    }
    
    loadAttemptedRef.current = true;
    
    const cache = getCacheManager();
    const cacheKey = `logo-${logoId}`;
    
    if (cache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        setImageDataUri(cached.data);
        return;
      }
      if (cached) {
        cache.delete(cacheKey);
      }
    }

    setImageLoading(true);
    setImageError(false);
    
    try {
      const logoData = await getLogo(logoId, userEmail);
      
      if (!logoData?.imageDataUri) {
        throw new Error('Logo not found or no image data');
      }
      
      const imageData = logoData.imageDataUri;
      
      if (cache) {
        const now = Date.now();
        
        if (cache.size >= MAX_CACHE_SIZE) {
          const entries = Array.from(cache.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);
          cache.delete(entries[0][0]);
        }
        
        cache.set(cacheKey, {
          data: imageData,
          expires: now + CACHE_DURATION,
          timestamp: now
        });
      }
      
      setImageDataUri(imageData);
      
    } catch (error) {
      console.error(`Error loading image for logo ${logoId}:`, error);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  }, [logoId, userEmail, imageLoading, imageDataUri, imageError]);

  useEffect(() => {
    if (!mounted || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadImage();
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [mounted, loadImage]);

  useEffect(() => {
    setMounted(true);
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {!imageDataUri && !imageLoading && !imageError ? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-gray-200 rounded">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      ) : imageError ? (
        <div className="w-full h-full bg-red-50 flex items-center justify-center border border-red-200 rounded">
          <div className="text-center">
            <svg className="w-6 h-6 text-red-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-red-600">Failed</p>
          </div>
        </div>
      ) : imageLoading ? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-gray-200 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      ) : imageDataUri ? (
        <img
          src={imageDataUri}
          alt={alt}
          className="w-full h-full object-contain border border-gray-200 rounded"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : null}
    </div>
  );
};

// Skeleton component
const LogoSkeleton = () => (
  <div className="border rounded-lg p-4 bg-white shadow-sm animate-pulse">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-shrink-0">
        <div className="w-32 h-32 bg-gray-200 rounded"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
);

// SEPARATE LOGO GRID COMPONENT - EXACTLY LIKE CATALOG
const LogoGrid = ({ userEmail, searchTerm, industryFilter, itemsPerPage }: {
  userEmail: string;
  searchTerm: string;
  industryFilter: string;
  itemsPerPage: number;
}) => {
  const router = useRouter();
  
  // ONLY current page state - like catalog
  const [currentPageLogos, setCurrentPageLogos] = useState<LogoWithRevisions[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection state
  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set());
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // CORE FUNCTION: Fetch ONLY current page logos - EXACTLY like catalog fetchCatalog
  const fetchLogosPage = useCallback(async (page: number, search: string = '', industry: string = 'all', limit: number = 3) => {
    console.log(`Fetching page ${page} with search="${search}" industry="${industry}" limit=${limit}`);
    
    // Prevent multiple simultaneous fetches
    if (loadingMore && page > 1) return;
    if (initialLoading && page > 1) return;
    
    setLoadingMore(page > 1);
    if (page === 1) {
      setInitialLoading(true);
    }

    try {
      // Get ALL metadata first (fast since no images)
      const originals = await getOriginalLogos(userEmail);
      
      const allLogosWithRevisions = await Promise.all(
        originals.map(async (original) => {
          const revisions = await getRevisionsForLogo(original.id, userEmail);
          
          const originalMetadata: LogoMetadata = {
            id: original.id,
            userId: original.userId,
            name: original.name,
            createdAt: original.createdAt,
            parameters: original.parameters,
            isRevision: original.isRevision,
            originalLogoId: original.originalLogoId,
            revisionNumber: original.revisionNumber
          };
          
          const revisionsMetadata: LogoMetadata[] = revisions.map(rev => ({
            id: rev.id,
            userId: rev.userId,
            name: rev.name,
            createdAt: rev.createdAt,
            parameters: rev.parameters,
            isRevision: rev.isRevision,
            originalLogoId: rev.originalLogoId,
            revisionNumber: rev.revisionNumber
          }));
          
          return { original: originalMetadata, revisions: revisionsMetadata };
        })
      );

      // Apply filters
      let filtered = allLogosWithRevisions;

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        filtered = filtered.filter(({ original, revisions }) => {
          const originalMatches = 
            original.name?.toLowerCase().includes(query) ||
            original.parameters.companyName?.toLowerCase().includes(query);
          
          const revisionMatches = revisions.some(revision => 
            revision.name?.toLowerCase().includes(query) ||
            revision.parameters.companyName?.toLowerCase().includes(query)
          );
          
          return originalMatches || revisionMatches;
        });
      }

      if (industry !== 'all') {
        filtered = filtered.filter(({ original, revisions }) => {
          const originalMatches = original.parameters.industry === industry;
          const revisionMatches = revisions.some(revision => 
            revision.parameters.industry === industry
          );
          return originalMatches || revisionMatches;
        });
      }

      // Calculate pagination
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const pageLogos = filtered.slice(offset, offset + limit);
      
      // Set ONLY current page data - just like catalog
      setCurrentPageLogos(pageLogos);
      setPagination({
        page,
        limit,
        total,
        totalPages,
        hasMore: offset + pageLogos.length < total
      });
      
      console.log(`Loaded ${pageLogos.length} logos for page ${page}`);
      
    } catch (err: any) {
      console.error('Error fetching logos page:', err);
      setError(err.message || 'Failed to load logos');
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [userEmail]);

  // Search with debounce - reset to page 1 when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchLogosPage(1, searchTerm, industryFilter, itemsPerPage);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, industryFilter, itemsPerPage, fetchLogosPage]);

  // When page changes, fetch that specific page
  useEffect(() => {
    fetchLogosPage(currentPage, searchTerm, industryFilter, itemsPerPage);
  }, [currentPage, fetchLogosPage, searchTerm, industryFilter, itemsPerPage]);

  // Initial load page 1
  useEffect(() => {
    fetchLogosPage(1, searchTerm, industryFilter, itemsPerPage);
  }, []); // Only run once on mount

  // Pagination Controls Component - EXACTLY like catalog
  const PaginationControls = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-4">
        <button
          onClick={() => setCurrentPage(pagination.page - 1)}
          disabled={pagination.page <= 1 || loadingMore}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="flex space-x-2">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = Math.max(1, pagination.page - 2) + i;
            if (pageNum > pagination.totalPages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                disabled={loadingMore}
                className={`px-3 py-2 rounded-md ${
                  pageNum === pagination.page
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => setCurrentPage(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages || loadingMore}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
    };

    if (showActionsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsDropdown]);

  // Helper functions
  const getLatestRevision = (revisions: LogoMetadata[]): LogoMetadata | null => {
    if (revisions.length === 0) return null;
    return [...revisions].sort((a, b) => 
      (b.revisionNumber || 0) - (a.revisionNumber || 0)
    )[0];
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(timestamp));
  };

  const handleViewLogo = (id: string) => {
    setLoadingButton(`view-${id}`);
    router.push(`/logos/${id}`);
  };
  
  const handleEditLogo = (id: string) => {
    setLoadingButton(`edit-${id}`);
    router.push(`/?edit=${id}`);
  };

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
    const currentPageLogoIds = currentPageLogos.map(({ original, revisions }) => {
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

  const handleSelectAllFiltered = async () => {
    // Need to get ALL filtered logos, not just current page
    try {
      const originals = await getOriginalLogos(userEmail);
      
      const allLogosWithRevisions = await Promise.all(
        originals.map(async (original) => {
          const revisions = await getRevisionsForLogo(original.id, userEmail);
          
          const originalMetadata: LogoMetadata = {
            id: original.id,
            userId: original.userId,
            name: original.name,
            createdAt: original.createdAt,
            parameters: original.parameters,
            isRevision: original.isRevision,
            originalLogoId: original.originalLogoId,
            revisionNumber: original.revisionNumber
          };
          
          const revisionsMetadata: LogoMetadata[] = revisions.map(rev => ({
            id: rev.id,
            userId: rev.userId,
            name: rev.name,
            createdAt: rev.createdAt,
            parameters: rev.parameters,
            isRevision: rev.isRevision,
            originalLogoId: rev.originalLogoId,
            revisionNumber: rev.revisionNumber
          }));
          
          return { original: originalMetadata, revisions: revisionsMetadata };
        })
      );

      // Apply same filters
      let filtered = allLogosWithRevisions;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(({ original, revisions }) => {
          const originalMatches = 
            original.name?.toLowerCase().includes(query) ||
            original.parameters.companyName?.toLowerCase().includes(query);
          
          const revisionMatches = revisions.some(revision => 
            revision.name?.toLowerCase().includes(query) ||
            revision.parameters.companyName?.toLowerCase().includes(query)
          );
          
          return originalMatches || revisionMatches;
        });
      }

      if (industryFilter !== 'all') {
        filtered = filtered.filter(({ original, revisions }) => {
          const originalMatches = original.parameters.industry === industryFilter;
          const revisionMatches = revisions.some(revision => 
            revision.parameters.industry === industryFilter
          );
          return originalMatches || revisionMatches;
        });
      }

      const allFilteredLogoIds = filtered.map(({ original, revisions }) => {
        const latestRevision = getLatestRevision(revisions);
        const displayedLogo = latestRevision || original;
        return displayedLogo.id;
      });
      
      setSelectedLogos(new Set(allFilteredLogoIds));
    } catch (error) {
      console.error('Error selecting all filtered logos:', error);
    }
  };

  const handleDeselectAll = () => {
    setSelectedLogos(new Set());
  };

  const handleDeleteLogo = async () => {
    if (!selectedLogo || !userEmail) return;
    
    try {
      await deleteLogo(selectedLogo, userEmail);
      setSelectedLogo(null);
      setSelectedLogos(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedLogo);
        return newSet;
      });
      
      // Refresh current page
      await fetchLogosPage(currentPage, searchTerm, industryFilter, itemsPerPage);
      
    } catch (err) {
      console.error('Error deleting logo:', err);
    }
  };

  // Helper function to create safe filename from logo name
  const createSafeFilename = (name: string | undefined, fallback: string = 'logo'): string => {
    if (!name || name.trim() === '' || name === 'Untitled') {
      return fallback;
    }
    
    return name
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  };

  // Get selected logos data for bulk operations
  const getSelectedLogosData = async () => {
    const selectedData: Array<{ logo: StoredLogo; filename: string }> = [];
    
    // Only process logos that are actually selected
    for (const logoId of selectedLogos) {
      try {
        const fullLogoData = await getLogo(logoId, userEmail);
        if (fullLogoData) {
          const baseFileName = createSafeFilename(fullLogoData.name, `logo-${fullLogoData.parameters.companyName || 'untitled'}`);
          selectedData.push({
            logo: fullLogoData,
            filename: baseFileName
          });
        }
      } catch (error) {
        console.error(`Error loading logo ${logoId}:`, error);
      }
    }
    
    return selectedData;
  };

  // Handle bulk download
  const handleBulkDownload = async (format: 'png' | 'svg' | 'jpg') => {
    setBulkActionLoading(true);
    
    try {
      const selectedData = await getSelectedLogosData();
      
      if (selectedData.length === 0) {
        return;
      }

      const zip = new JSZip();
      
      for (const { logo, filename } of selectedData) {
        if (format === 'png') {
          const response = await fetch(logo.imageDataUri);
          const blob = await response.blob();
          zip.file(`${filename}.png`, blob);
        } else if (format === 'jpg') {
          const response = await fetch(logo.imageDataUri);
          const blob = await response.blob();
          
          const img = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          await new Promise((resolve) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              
              ctx!.fillStyle = '#FFFFFF';
              ctx!.fillRect(0, 0, canvas.width, canvas.height);
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
            const response = await fetch(logo.imageDataUri);
            const blob = await response.blob();
            
            const formData = new FormData();
            const file = new File([blob], 'logo.png', { type: blob.type });
            formData.append('image', file);
            
            const options = {
              type: 'simple',
              width: 1000,
              height: 1000,
              threshold: 128,
              color: '#000000'
            };
            
            formData.append('options', JSON.stringify(options));
            
            const serverResponse = await fetch('/api/convert-to-svg', {
              method: 'POST',
              body: formData
            });
            
            if (serverResponse.ok) {
              const result = await serverResponse.json();
              if (result.svg && result.svg.includes('<svg')) {
                zip.file(`${filename}.svg`, result.svg);
              }
            }
          } catch (error) {
            console.warn(`Failed to process ${filename}:`, error);
          }
        }
      }
      
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
      for (const logoId of selectedLogos) {
        try {
          await deleteLogo(logoId, userEmail);
        } catch (error) {
          console.error(`Error deleting logo ${logoId}:`, error);
        }
      }
      
      setSelectedLogos(new Set());
      
      // Refresh current page
      await fetchLogosPage(currentPage, searchTerm, industryFilter, itemsPerPage);
      
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const selectedCount = selectedLogos.size;
  const hasSelection = selectedCount > 0;

  return (
    <>
      {/* Pagination Controls Top */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-3">
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
          {(initialLoading && currentPageLogos.length === 0) ? (
            <span>Loading logos...</span>
          ) : (
            <>
              Showing {currentPageLogos.length} of {pagination?.total || 0} logos
              {pagination && pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Page {pagination.page} of {pagination.totalPages})
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <PaginationControls />
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 order-2 sm:order-1">
              <span className="text-sm font-medium text-indigo-800">
                {selectedCount} logo{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 underline hidden sm:block"
              >
                Clear selection
              </button>
            </div>
            
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <div className="relative" ref={dropdownRef}>
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
                      <span>Actions</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                
                {showActionsDropdown && (
                  <div className="absolute mt-1 z-50 w-56 bg-white rounded-md shadow-lg border border-gray-200 right-0">
                    <div
                      className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                      onClick={() => handleBulkDownload('png')}
                    >
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Download as PNG
                      </button>
                    </div>

                    <div
                      className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                      onClick={() => handleBulkDownload('jpg')}
                    >
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Download as JPG
                      </button>
                    </div>

                    <div
                      className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                      onClick={() => handleBulkDownload('svg')}
                    >
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Download as SVG
                      </button>
                    </div>

                    <div className="h-px bg-gray-200" />

                    <div
                      className="group w-full cursor-pointer transition-colors hover:bg-red-50"
                      onClick={() => setShowBulkDeleteModal(true)}
                    >
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 text-left">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {(initialLoading && currentPageLogos.length === 0) && (
        <div className="space-y-4">
          {Array.from({ length: itemsPerPage }, (_, i) => (
            <LogoSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !initialLoading && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* No logos state */}
      {!initialLoading && !error && currentPageLogos.length === 0 && !searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You haven't created any logos yet.</p>
          <Link href="/" className="btn btn-primary">
            Create Your First Logo
          </Link>
        </div>
      )}

      {/* Logo Grid - ONLY current page logos */}
      {!initialLoading && !error && currentPageLogos.length > 0 && (
        <div className="space-y-4">
          {currentPageLogos.map(({ original, revisions }) => {
            const latestRevision = getLatestRevision(revisions);
            const displayedLogo = latestRevision || original;
            const hasRevisions = revisions.length > 0;
            const isSelected = selectedLogos.has(displayedLogo.id);
            
            return (
              <div key={original.id} className={`relative border rounded-lg p-4 bg-white shadow-sm transition-all ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-shrink-0">
                    <LazyLogoImage
                      logoId={displayedLogo.id}
                      userEmail={userEmail}
                      alt={displayedLogo.name || 'Logo'}
                      className="w-32 h-32"
                    />
                  </div>
                  
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
                      
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleLogoSelect(displayedLogo.id, e.target.checked)}
                          className="absolute top-2 right-2 z-10 w-5 h-5 border-gray-300 rounded focus:ring-indigo-500 accent-indigo-600 bg-white"
                          aria-label={`Select ${displayedLogo.name}`}
                        />
                      </div>
                    </div>
                    
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
                        {displayedLogo.parameters.overallStyle} • {displayedLogo.parameters.colorScheme}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewLogo(displayedLogo.id)}
                        className="btn-action btn-primary flex items-center justify-center gap-1"
                        disabled={loadingButton === `view-${displayedLogo.id}`}
                      >
                        {loadingButton === `view-${displayedLogo.id}` ? (
                          <>
                            <svg className="w-3 h-3 animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          hasRevisions ? "View All" : "View Logo"
                        )}
                      </button>

                      <button
                        onClick={() => handleEditLogo(displayedLogo.id)}
                        className="btn-action btn-secondary flex items-center justify-center gap-1"
                        disabled={revisions.length >= 3 || loadingButton === `edit-${displayedLogo.id}`}
                      >
                        {loadingButton === `edit-${displayedLogo.id}` ? (
                          <>
                            <svg className="w-3 h-3 animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          revisions.length >= 3 ? "Max Revisions" : "Create Revision"
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedLogo(displayedLogo.id)}
                        className="btn-action btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8">
          <PaginationControls />
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

      {/* Delete Modal */}
      {selectedLogo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
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
    </>
  );
};

// MAIN PAGE COMPONENT 
export default function HistoryView() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Page-level state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number, limit: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  // User authentication and setup
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        
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
        } else if (userResponse.status === 401) {
          router.push('/login?redirect=/history');
          return;
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data');
      } finally {
        setUserLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const clearSearch = () => {
    setSearchTerm('');
    setIndustryFilter('all');
  };

  return (
    <main className="container mx-auto px-4 pb-6 max-w-4xl history-page">
      <div className="mt-2 card">
        <h2 className="text-2xl text-indigo-600 font-semibold mb-4 text-center">Logo History</h2>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by company name or logo name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Industry:</span>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-w-[160px]"
              >
                <option value="all">All Industries</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value={1}>1 per page</option>
                <option value={3}>3 per page</option>
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {(searchTerm.trim() || industryFilter !== 'all') && (
            <div className="flex justify-end">
              <button
                onClick={clearSearch}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* User loading state */}
        {userLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user data...</p>
          </div>
        )}

        {/* User error state */}
        {error && !userLoading && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* LOGO GRID - ONLY LOADS CURRENT PAGE */}
        {!userLoading && !error && userEmail && (
          <LogoGrid 
            userEmail={userEmail}
            searchTerm={searchTerm}
            industryFilter={industryFilter}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </main>
  );
}