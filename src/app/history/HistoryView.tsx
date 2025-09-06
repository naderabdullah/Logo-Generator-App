// src/app/history/HistoryView.tsx - TRUE catalog-style approach with separate grid entity + ALL ORIGINAL CONTROLS
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

// Pagination Controls Component
const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center items-center space-x-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      <div className="flex space-x-2">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, currentPage - 2) + i;
          if (pageNum > totalPages) return null;
          
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 rounded-md ${
                pageNum === currentPage
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
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

// Lazy loading image component (same as catalog)
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

// Skeleton component (same as catalog)
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

// MAIN PAGE COMPONENT WITH ALL ORIGINAL CONTROLS
export default function HistoryView() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Core state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number, limit: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Logo data state
  const [logosWithRevisions, setLogosWithRevisions] = useState<LogoWithRevisions[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  
  // Selection state
  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all logos with revisions function
  const getAllLogosWithRevisions = useCallback(async (email: string): Promise<LogoWithRevisions[]> => {
    try {
      const originals = await getOriginalLogos(email);
      
      const allLogosWithRevisions = await Promise.all(
        originals.map(async (original) => {
          const revisions = await getRevisionsForLogo(original.id, email);
          
          // Convert to metadata-only
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

      return allLogosWithRevisions;
    } catch (err: any) {
      console.error('Error fetching logos:', err);
      throw err;
    }
  }, []);

  // Load logos effect
  useEffect(() => {
    const loadLogos = async () => {
      if (!userEmail) return;
      
      setLoading(true);
      try {
        const logos = await getAllLogosWithRevisions(userEmail);
        setLogosWithRevisions(logos);
      } catch (err: any) {
        setError(err.message || 'Failed to load logos');
      } finally {
        setLoading(false);
      }
    };

    loadLogos();
  }, [userEmail, getAllLogosWithRevisions]);

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

  // FILTER LOGIC
  const filteredLogosWithRevisions = useMemo(() => {
    let filtered = [...logosWithRevisions];

    // Apply search filter
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

    // Apply industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(({ original, revisions }) => {
        const originalMatches = original.parameters.industry === industryFilter;
        const revisionMatches = revisions.some(revision => 
          revision.parameters.industry === industryFilter
        );
        return originalMatches || revisionMatches;
      });
    }

    return filtered;
  }, [logosWithRevisions, searchTerm, industryFilter]);

  // PAGINATION LOGIC
  const totalLogos = filteredLogosWithRevisions.length;
  const totalPages = Math.ceil(totalLogos / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogos = useMemo(() => {
    return filteredLogosWithRevisions.slice(startIndex, endIndex);
  }, [filteredLogosWithRevisions, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, industryFilter, itemsPerPage]);

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
      
      // Refresh logos
      const logos = await getAllLogosWithRevisions(userEmail);
      setLogosWithRevisions(logos);
      
    } catch (err) {
      console.error('Error deleting logo:', err);
    }
  };

  // ORIGINAL CONTROLS FUNCTIONS
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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

  const clearSearch = () => {
    setSearchTerm('');
    setIndustryFilter('all');
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

  // Get selected logos data for bulk operations
  const getSelectedLogosData = async () => {
    const selectedData: Array<{ logo: StoredLogo; filename: string }> = [];
    
    for (const { original, revisions } of currentLogos) {
      const latestRevision = getLatestRevision(revisions);
      const displayedLogo = latestRevision || original;
      
      if (selectedLogos.has(displayedLogo.id)) {
        try {
          const fullLogoData = await getLogo(displayedLogo.id, userEmail!);
          if (fullLogoData) {
            const baseFileName = createSafeFilename(displayedLogo.name, `logo-${displayedLogo.parameters.companyName || 'untitled'}`);
            selectedData.push({
              logo: fullLogoData,
              filename: baseFileName
            });
          }
        } catch (error) {
          console.error(`Error loading logo ${displayedLogo.id}:`, error);
        }
      }
    }
    
    // Also check other pages for selected logos
    for (const { original, revisions } of filteredLogosWithRevisions) {
      const latestRevision = getLatestRevision(revisions);
      const displayedLogo = latestRevision || original;
      
      if (selectedLogos.has(displayedLogo.id) && !selectedData.find(item => item.logo.id === displayedLogo.id)) {
        try {
          const fullLogoData = await getLogo(displayedLogo.id, userEmail!);
          if (fullLogoData) {
            const baseFileName = createSafeFilename(displayedLogo.name, `logo-${displayedLogo.parameters.companyName || 'untitled'}`);
            selectedData.push({
              logo: fullLogoData,
              filename: baseFileName
            });
          }
        } catch (error) {
          console.error(`Error loading logo ${displayedLogo.id}:`, error);
        }
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
      
      setSelectedLogos(new Set());
      
      // Refresh logos
      const logos = await getAllLogosWithRevisions(userEmail);
      setLogosWithRevisions(logos);
      
      // Adjust current page if needed after deletion
      const newTotalLogos = logos.length;
      const newTotalPages = Math.ceil(newTotalLogos / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const selectedCount = selectedLogos.size;
  const hasSelection = selectedCount > 0;

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

        {/* ORIGINAL PAGINATION CONTROLS TOP */}
        {!userLoading && !error && userEmail && (
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
              {searchTerm ? 
                `Showing ${currentLogos.length} of ${totalLogos} filtered logos` :
                `Showing ${currentLogos.length} of ${totalLogos} logos`
              }
              {totalPages > 1 && (
                <span className="ml-2">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </div>
          </div>
        )}

        {/* TOP PAGINATION CONTROLS */}
        {!userLoading && !error && userEmail && totalPages > 1 && (
          <div className="mb-4">
            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}

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
                {/* Actions Dropdown */}
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
                      className="absolute mt-1 z-50 w-56 max-w-[calc(100vw-1rem)] sm:max-w-none bg-white rounded-md shadow-lg border border-gray-200 overflow-auto max-h-60 left-0 sm:left-auto sm:right-0"
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

        {/* Loading skeletons */}
        {(loading && currentLogos.length === 0) && (
          <div className="space-y-4">
            {Array.from({ length: itemsPerPage }, (_, i) => (
              <LogoSkeleton key={i} />
            ))}
          </div>
        )}

        {/* No logos state */}
        {!loading && !error && currentLogos.length === 0 && !searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't created any logos yet.</p>
            <Link href="/" className="btn btn-primary">
              Create Your First Logo
            </Link>
          </div>
        )}

        {/* No search results */}
        {!loading && !error && currentLogos.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No logos found matching your search.</p>
            <button onClick={clearSearch} className="text-indigo-600 hover:text-indigo-800 font-medium">
              Clear Search
            </button>
          </div>
        )}

        {/* Logo Grid */}
        {!loading && !error && currentLogos.length > 0 && (
          <div className="space-y-4">
            {currentLogos.map(({ original, revisions }) => {
              const latestRevision = getLatestRevision(revisions);
              const displayedLogo = latestRevision || original;
              const hasRevisions = revisions.length > 0;
              const isSelected = selectedLogos.has(displayedLogo.id);
              
              return (
                <div key={original.id} className={`relative border rounded-lg p-4 bg-white shadow-sm transition-all ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Logo Image - Lazy Loaded */}
                    <div className="flex-shrink-0">
                      <LazyLogoImage
                        logoId={displayedLogo.id}
                        userEmail={userEmail!}
                        alt={displayedLogo.name || 'Logo'}
                        className="w-32 h-32"
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
                        
                        {/* Selection Checkbox */}
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
                      
                      {/* Company Details */}
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
                      
                      {/* Action Buttons */}
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
        {!loading && !error && totalPages > 1 && (
          <div className="mt-8">
            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
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
      </div>
    </main>
  );
}