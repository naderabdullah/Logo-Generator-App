// src/app/history/HistoryView.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
  deleteLogo,
  StoredLogo,
  syncUserUsageWithDynamoDB,
  getLogo,
  getOriginalLogos,
  getRevisionsForLogo
} from '@/app/utils/indexedDBUtils';
import Link from 'next/link';
// @ts-ignore
import JSZip from 'jszip';
import { INDUSTRIES } from '@/app/constants/industries';
// REMOVED: BusinessCardModal import - no longer needed

/** Types kept lean for page-only payloads */
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
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// catalog status cache
const CATALOG_CACHE_KEY = 'catalogFlags:v1';
type CatalogFlag = { isInCatalog: boolean; catalogCode: string | null };

function readCatalogCache(): Record<string, CatalogFlag> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCatalogCache(update: Record<string, CatalogFlag>) {
  if (typeof window === 'undefined') return;
  try {
    const cur = readCatalogCache();
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ ...cur, ...update }));
  } catch {}
}

/** Small in-memory image cache */
const MAX_CACHE_SIZE = 20;
const CACHE_DURATION = 5 * 60 * 1000;
let imageCache: Map<string, { data: string; expires: number; ts: number }> | null = null;
const cacheMgr = () => {
  if (typeof window === 'undefined') return null;
  if (!imageCache) imageCache = new Map();
  return imageCache;
};

/** Lazy image pulls imageDataUri on demand via getLogo(id, email) */
const LazyLogoImage = ({
                         logoId,
                         userEmail,
                         alt,
                         className
                       }: {
  logoId: string;
  userEmail: string;
  alt: string;
  className: string;
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const load = useCallback(async () => {
    if (seenRef.current || loading || src || err) return;
    seenRef.current = true;

    const cache = cacheMgr();
    const key = `logo-${logoId}`;
    if (cache) {
      const hit = cache.get(key);
      if (hit && Date.now() < hit.expires) {
        setSrc(hit.data);
        return;
      }
      if (hit) cache.delete(key);
    }

    setLoading(true);
    setErr(false);
    try {
      const data = await getLogo(logoId, userEmail);
      if (!data?.imageDataUri) throw new Error('no image');
      const uri = data.imageDataUri;

      if (cache) {
        const now = Date.now();
        if (cache.size >= MAX_CACHE_SIZE) {
          // evict oldest
          const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]?.[0];
          if (oldest) cache.delete(oldest);
        }
        cache.set(key, { data: uri, ts: now, expires: now + CACHE_DURATION });
      }

      setSrc(uri);
    } catch (e) {
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [logoId, userEmail, loading, src, err]);

  useEffect(() => {
    if (!rootRef.current) return;
    ioRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            load();
            ioRef.current?.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
    );
    ioRef.current.observe(rootRef.current);
    return () => ioRef.current?.disconnect();
  }, [load]);

  return (
      <div ref={rootRef} className={className}>
        {!src && !loading && !err ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-gray-200 rounded">
              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                />
              </svg>
            </div>
        ) : err ? (
            <div className="w-full h-full bg-red-50 flex items-center justify-center border border-red-200 rounded">
              <span className="text-xs text-red-600">Failed</span>
            </div>
        ) : loading ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-gray-200 rounded">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
        ) : (
            <img src={src!} alt={alt} className="w-full h-full object-contain border border-gray-200 rounded" loading="lazy" />
        )}
      </div>
  );
};

const LogoSkeleton = () => (
    <div className="border rounded-lg p-4 bg-white shadow-sm animate-pulse">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-gray-200 rounded" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
);

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(
      new Date(ts)
  );
}

function safeName(name?: string, fallback = 'logo') {
  if (!name || name.trim() === '' || name === 'Untitled') return fallback;
  return name.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();
}

/** Grid with page-only fetch + admin Catalog actions merged in */
const LogoGrid = ({
                    userEmail,
                    isSuperUser,
                    searchTerm,
                    industryFilter,
                    itemsPerPage
                  }: {
  userEmail: string;
  isSuperUser: boolean;
  searchTerm: string;
  industryFilter: string;
  itemsPerPage: number;
}) => {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageLogos, setCurrentPageLogos] = useState<LogoWithRevisions[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set());
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // request guard to kill stale responses
  const reqSeqRef = useRef(0);

  // Catalog admin state (per displayed logo)
  const [catalogStates, setCatalogStates] = useState<
      Record<string, { isInCatalog: boolean; catalogLoading: boolean; catalogCode: string | null }>
  >({});

  // REMOVED: Business cards state variables - no longer needed
  // const [showBusinessCardModal, setShowBusinessCardModal] = useState(false);
  // const [selectedLogoForCards, setSelectedLogoForCards] = useState<StoredLogo | null>(null);

  const getLatestRevision = (revs: LogoMetadata[]) => {
    if (!revs.length) return null;
    return [...revs].sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0))[0];
  };

  const fetchLogosPage = useCallback(
      async (page: number, search = '', industry = 'all', limit = 3) => {
        const seq = ++reqSeqRef.current;
        setError(null);
        setLoadingMore(page > 1);
        if (page === 1) setInitialLoading(true);

        try {
          const originals = await getOriginalLogos(userEmail);

          // stable sort for consistent paging
          let filtered = [...originals].sort((a, b) => b.createdAt - a.createdAt);

          const q = search.trim().toLowerCase();
          if (q) {
            filtered = filtered.filter((o) => {
              const nm = o.name?.toLowerCase() || '';
              const co = o.parameters?.companyName?.toLowerCase() || '';
              return nm.includes(q) || co.includes(q);
            });
          }
          if (industry !== 'all') {
            filtered = filtered.filter((o) => o.parameters?.industry === industry);
          }

          const total = filtered.length;
          const totalPages = Math.max(1, Math.ceil(total / limit));
          const clamped = Math.min(Math.max(1, page), totalPages);
          const offset = (clamped - 1) * limit;
          const originalsForPage = filtered.slice(offset, offset + limit);

          const withRevs: LogoWithRevisions[] = [];
          for (const o of originalsForPage) {
            const revs = await getRevisionsForLogo(o.id, userEmail);
            withRevs.push({
              original: {
                id: o.id,
                userId: o.userId,
                name: o.name,
                createdAt: o.createdAt,
                parameters: o.parameters,
                isRevision: o.isRevision,
                originalLogoId: o.originalLogoId,
                revisionNumber: o.revisionNumber
              },
              revisions: revs.map((r) => ({
                id: r.id,
                userId: r.userId,
                name: r.name,
                createdAt: r.createdAt,
                parameters: r.parameters,
                isRevision: r.isRevision,
                originalLogoId: r.originalLogoId,
                revisionNumber: r.revisionNumber
              }))
            });
          }

          if (seq !== reqSeqRef.current) return; // stale

          setCurrentPageLogos(withRevs);
          setPagination({
            limit,
            total,
            totalPages,
            hasMore: offset + originalsForPage.length < total
          });
        } catch (e: any) {
          if (seq !== reqSeqRef.current) return;
          setError(e?.message || 'Failed to load logos');
        } finally {
          if (seq === reqSeqRef.current) {
            setInitialLoading(false);
            setLoadingMore(false);
          }
        }
      },
      [userEmail]
  );

  // drive fetch by state changes
  useEffect(() => {
    fetchLogosPage(currentPage, searchTerm, industryFilter, itemsPerPage);
  }, [currentPage, searchTerm, industryFilter, itemsPerPage, fetchLogosPage]);

  // when filters change, snap to page 1 after tiny debounce to avoid double fetch churn
  useEffect(() => {
    const t = setTimeout(() => setCurrentPage(1), 250);
    return () => clearTimeout(t);
  }, [searchTerm, industryFilter, itemsPerPage]);

  // close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowActionsDropdown(false);
      }
    };
    if (showActionsDropdown) {
      document.addEventListener('click', onClick);
      return () => document.removeEventListener('click', onClick);
    }
  }, [showActionsDropdown]);

  // pre-seed and then check Catalog state for currently displayed items
  useEffect(() => {
    if (!isSuperUser || currentPageLogos.length === 0) return;

    const displayIds = currentPageLogos.map(({original, revisions}) => (getLatestRevision(revisions) || original).id);

    // hydrate from local cache first so the pill is instant on refresh
    const cache = readCatalogCache();
    const primed: Record<string, { isInCatalog: boolean; catalogLoading: boolean; catalogCode: string | null }> = {};
    for (const id of displayIds) {
      if (cache[id]) {
        primed[id] = {
          isInCatalog: !!cache[id].isInCatalog,
          catalogLoading: false,
          catalogCode: cache[id].catalogCode || null
        };
      }
    }
    if (Object.keys(primed).length) {
      setCatalogStates((prev) => ({...primed, ...prev}));
    }

    // then validate via API
    let cancelled = false;
    (async () => {
      for (const id of displayIds) {
        try {
          const res = await fetch('/api/catalog', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({logoKeyId: id})
          });
          if (!res.ok) continue;
          const data = await res.json();
          if (cancelled) return;

          const next = {
            isInCatalog: !!data.isInCatalog,
            catalogLoading: false,
            catalogCode: data.catalogLogo?.catalog_code || null
          };

          setCatalogStates((prev) => ({...prev, [id]: next}));
          writeCatalogCache({[id]: {isInCatalog: next.isInCatalog, catalogCode: next.catalogCode}});
        } catch {
          if (cancelled) return;
          const fallback = {isInCatalog: false, catalogLoading: false, catalogCode: null};
          setCatalogStates((prev) => ({...prev, [id]: fallback}));
          // do not write negatives to cache to avoid wiping a known true state on transient error
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSuperUser, currentPageLogos]);

  const addToCatalog = async (logo: LogoMetadata) => {
    if (!isSuperUser) return;
    const id = logo.id;

    setCatalogStates((p) => ({
      ...p,
      [id]: {...(p[id] || {isInCatalog: false, catalogCode: null}), catalogLoading: true}
    }));

    try {
      // need the image data for POST; fetch full logo
      const full = await getLogo(id, userEmail);
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          logoKeyId: id,
          imageDataUri: full?.imageDataUri,
          parameters: full?.parameters,
          originalCompanyName: full?.parameters?.companyName || 'Unknown Company'
        })
      });

      if (res.status === 409) {
        const data = await res.json();
        const next = {isInCatalog: true, catalogLoading: false, catalogCode: data.catalogCode || null};
        setCatalogStates((p) => ({...p, [id]: next}));
        writeCatalogCache({[id]: {isInCatalog: next.isInCatalog, catalogCode: next.catalogCode}});
        return;
      }

      if (!res.ok) throw new Error('catalog add failed');
      const data = await res.json();
      const next = {
        isInCatalog: true,
        catalogLoading: false,
        catalogCode: data.catalogLogo?.catalog_code || null
      };
      setCatalogStates((p) => ({...p, [id]: next}));
      writeCatalogCache({[id]: {isInCatalog: next.isInCatalog, catalogCode: next.catalogCode}});
    } catch (e) {
      setCatalogStates((p) => ({...p, [id]: {...(p[id] || {}), catalogLoading: false}}));
    }
  };

  const handleViewLogo = (id: string) => {
    setLoadingButton(`view-${id}`);
    router.push(`/logos/${id}`);
  };
  const handleEditLogo = (id: string) => {
    setLoadingButton(`edit-${id}`);
    router.push(`/?edit=${id}`);
  };

  const handleLogoSelect = (id: string, checked: boolean) =>
      setSelectedLogos((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      });

  const selectPage = () => {
    const ids = currentPageLogos.map(({original, revisions}) => (getLatestRevision(revisions) || original).id);
    setSelectedLogos((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectAllFiltered = async () => {
    try {
      const originals = await getOriginalLogos(userEmail);
      let filtered = [...originals];

      const q = searchTerm.trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((o) => {
          const nm = o.name?.toLowerCase() || '';
          const co = o.parameters?.companyName?.toLowerCase() || '';
          return nm.includes(q) || co.includes(q);
        });
      }
      if (industryFilter !== 'all') filtered = filtered.filter((o) => o.parameters?.industry === industryFilter);

      const revIds: string[] = [];
      for (const o of filtered) {
        const revs = await getRevisionsForLogo(o.id, userEmail);
        const latest = [...revs].sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0))[0];
        revIds.push((latest || o).id);
      }
      setSelectedLogos(new Set(revIds));
    } catch (e) {
      // noop
    }
  };

  const deselectAll = () => setSelectedLogos(new Set());

  const confirmDelete = (id: string) => setSelectedLogo(id);

  const removeOne = async () => {
    if (!selectedLogo) return;
    try {
      await deleteLogo(selectedLogo, userEmail);
      setSelectedLogo(null);
      setSelectedLogos((prev) => {
        const next = new Set(prev);
        next.delete(selectedLogo);
        return next;
      });
      await fetchLogosPage(currentPage, searchTerm, industryFilter, itemsPerPage);
    } catch {
      // surfaced in UI already
    }
  };

  const readSelectedFull = async () => {
    const out: Array<{ logo: StoredLogo; filename: string }> = [];
    for (const id of selectedLogos) {
      try {
        const full = await getLogo(id, userEmail);
        if (full) {
          const base = safeName(full.name, `logo-${full.parameters?.companyName || 'untitled'}`);
          out.push({logo: full, filename: base});
        }
      } catch {
        // skip bad item
      }
    }
    return out;
  };

  const download = async (fmt: 'png' | 'jpg' | 'svg') => {
    setBulkActionLoading(true);
    try {
      const picked = await readSelectedFull();
      if (picked.length === 0) return;

      const zip = new JSZip();
      for (const {logo, filename} of picked) {
        if (fmt === 'png') {
          const blob = await (await fetch(logo.imageDataUri)).blob();
          zip.file(`${filename}.png`, blob);
        } else if (fmt === 'jpg') {
          const blob = await (await fetch(logo.imageDataUri)).blob();
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = img.width;
              c.height = img.height;
              const ctx = c.getContext('2d')!;
              ctx.fillStyle = '#FFF';
              ctx.fillRect(0, 0, c.width, c.height);
              ctx.drawImage(img, 0, 0);
              c.toBlob((b) => {
                if (b) zip.file(`${filename}.jpg`, b);
                resolve();
              }, 'image/jpeg', 0.9);
            };
            img.src = URL.createObjectURL(blob);
          });
        } else {
          try {
            const blob = await (await fetch(logo.imageDataUri)).blob();
            const fd = new FormData();
            fd.append('image', new File([blob], 'logo.png', {type: blob.type}));
            fd.append(
                'options',
                JSON.stringify({type: 'simple', width: 1000, height: 1000, threshold: 128, color: '#000000'})
            );
            const res = await fetch('/api/convert-to-svg', {method: 'POST', body: fd});
            if (res.ok) {
              const r = await res.json();
              if (r.svg && r.svg.includes('<svg')) zip.file(`${filename}.svg`, r.svg);
            }
          } catch {
            // continue
          }
        }
      }
      const zipBlob = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-logos-${fmt}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBulkActionLoading(false);
      setShowActionsDropdown(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedLogos.size === 0) return;
    setBulkActionLoading(true);
    setShowBulkDeleteModal(false);
    try {
      for (const id of selectedLogos) {
        try {
          await deleteLogo(id, userEmail);
        } catch {
          // skip failed deletes to keep batch going
        }
      }
      setSelectedLogos(new Set());
      await fetchLogosPage(currentPage, searchTerm, industryFilter, itemsPerPage);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const PaginationControls = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center space-x-4">
          <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loadingMore}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
              const pg = Math.max(1, currentPage - 2) + i;
              if (pg > pagination.totalPages) return null;
              return (
                  <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      disabled={loadingMore}
                      className={`px-3 py-2 rounded-md ${
                          pg === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {pg}
                  </button>
              );
            })}
          </div>

          <button
              onClick={() => setCurrentPage((p) => Math.min((pagination?.totalPages || p) as number, p + 1))}
              disabled={currentPage >= (pagination?.totalPages || 1) || loadingMore}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
    );
  };

  const selectedCount = selectedLogos.size;
  const hasSelection = selectedCount > 0;

  return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={selectPage}
                      className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 underline whitespace-nowrap">
                Select page
              </button>
              <button onClick={selectAllFiltered}
                      className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 underline whitespace-nowrap">
                Select all
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {initialLoading && currentPageLogos.length === 0 ? (
                <span>Loading logos...</span>
            ) : (
                <>
                  Showing {currentPageLogos.length} of {pagination?.total || 0} logos
                  {pagination && pagination.totalPages > 1 && (
                      <span className="ml-2">(Page {currentPage} of {pagination.totalPages})</span>
                  )}
                </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <PaginationControls/>
        </div>

        {hasSelection && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 order-2 sm:order-1">
              <span className="text-sm font-medium text-indigo-800">
                {selectedCount} logo{selectedCount !== 1 ? 's' : ''}
              </span>
                  <button onClick={deselectAll}
                          className="text-xs text-indigo-600 hover:text-indigo-700 underline hidden sm:block">
                    Clear selection
                  </button>
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionsDropdown((v) => !v);
                        }}
                        disabled={bulkActionLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {bulkActionLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-t border-white"/>
                            <span>Processing...</span>
                          </>
                      ) : (
                          <>
                            <span>Actions</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                            </svg>
                          </>
                      )}
                    </button>

                    {showActionsDropdown && (
                        <div
                            className="absolute mt-1 z-50 w-56 bg-white rounded-md shadow-lg border border-gray-200 right-0">
                          <div className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                               onClick={() => download('png')}>
                            <button
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                              </svg>
                              Download as PNG
                            </button>
                          </div>

                          <div className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                               onClick={() => download('jpg')}>
                            <button
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                              </svg>
                              Download as JPG
                            </button>
                          </div>

                          <div className="group w-full cursor-pointer transition-colors hover:bg-gray-100"
                               onClick={() => download('svg')}>
                            <button
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                              </svg>
                              Download as SVG
                            </button>
                          </div>

                          <div className="h-px bg-gray-200"/>

                          <div className="group w-full cursor-pointer transition-colors hover:bg-red-50"
                               onClick={() => setShowBulkDeleteModal(true)}>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 text-left">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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

        {initialLoading && currentPageLogos.length === 0 && (
            <div className="space-y-4">
              {Array.from({length: itemsPerPage}, (_, i) => (
                  <LogoSkeleton key={i}/>
              ))}
            </div>
        )}

        {error && !initialLoading && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
        )}

        {!initialLoading && !error && currentPageLogos.length === 0 && !searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven't created any logos yet.</p>
              <Link href="/" className="btn btn-primary">
                Create Your First Logo
              </Link>
            </div>
        )}

        {!initialLoading && !error && currentPageLogos.length > 0 && (
            <div className="space-y-4">
              {currentPageLogos.map(({original, revisions}) => {
                const latest = getLatestRevision(revisions);
                const displayed = latest || original;
                const selected = selectedLogos.has(displayed.id);
                const catState = catalogStates[displayed.id];
                const cached = readCatalogCache()[displayed.id]; // light read; tiny map
                const cat = catState
                    ? catState
                    : cached
                        ? {isInCatalog: cached.isInCatalog, catalogLoading: false, catalogCode: cached.catalogCode}
                        : {isInCatalog: false, catalogLoading: false, catalogCode: null};

                return (
                    <div
                        key={original.id}
                        className={`relative border rounded-lg p-4 bg-white shadow-sm transition-all ${
                            selected ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                        }`}
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-shrink-0 relative">
                          {cat.isInCatalog && (
                              <div
                                  className="absolute -top-2 -left-2 z-10 select-none"
                                  title={cat.catalogCode ? `In Catalog • ${cat.catalogCode}` : 'In Catalog'}
                              >
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-purple-600 text-white shadow">
                          In Catalog{cat.catalogCode ? ` • ${cat.catalogCode}` : ''}
                        </span>
                              </div>
                          )}
                          <LazyLogoImage
                              logoId={displayed.id}
                              userEmail={userEmail}
                              alt={displayed.name || 'Logo'}
                              className="w-32 h-32"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 truncate flex items-center gap-2">
                                <span>{displayed.name}</span>
                                {cat.isInCatalog && (
                                    <span
                                        className="inline-flex items-center"
                                        aria-label={cat.catalogCode ? `In Catalog • ${cat.catalogCode}` : 'In Catalog'}
                                        title={cat.catalogCode ? `In Catalog • ${cat.catalogCode}` : 'In Catalog'}
                                    >
                              <span className="w-2 h-2 rounded-full bg-purple-600"/>
                            </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-500">Created: {formatDate(original.createdAt)}</p>
                              {revisions.length > 0 && (
                                  <p className="text-sm text-indigo-600 font-medium">
                                    Showing: Revision {latest?.revisionNumber}
                                    <span className="text-gray-500"> ({3 - revisions.length} remaining)</span>
                                  </p>
                              )}
                              {isSuperUser && cat.isInCatalog && (
                                  <p className="text-xs mt-1 px-2 py-0.5 inline-block rounded bg-gray-800 text-white">
                                    In Catalog{cat.catalogCode ? ` • ${cat.catalogCode}` : ''}
                                  </p>
                              )}
                            </div>

                            <div className="flex-shrink-0 pt-1">
                              <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => handleLogoSelect(displayed.id, e.target.checked)}
                                  className="absolute top-2 right-2 z-10 w-5 h-5 border-gray-300 rounded focus:ring-indigo-500 accent-indigo-600 bg-white"
                                  aria-label={`Select ${displayed.name}`}
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Company: {displayed.parameters.companyName}</p>
                            {displayed.parameters.slogan && (
                                <p className="text-sm text-gray-600">Slogan: "{displayed.parameters.slogan}"</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {displayed.parameters.overallStyle} • {displayed.parameters.colorScheme}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleViewLogo(displayed.id)}
                                className="btn-action btn-primary flex items-center justify-center gap-1"
                                disabled={loadingButton === `view-${displayed.id}`}
                            >
                              {loadingButton === `view-${displayed.id}` ? (
                                  <>
                                    <svg className="w-3 h-3 animate-spin mr-1" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                    </svg>
                                    Loading...
                                  </>
                              ) : revisions.length > 0 ? (
                                  'View All'
                              ) : (
                                  'View Logo'
                              )}
                            </button>

                            <button
                                onClick={() => handleEditLogo(displayed.id)}
                                className="btn-action btn-secondary flex items-center justify-center gap-1"
                                disabled={revisions.length >= 3 || loadingButton === `edit-${displayed.id}`}
                            >
                              {loadingButton === `edit-${displayed.id}` ? (
                                  <>
                                    <svg className="w-3 h-3 animate-spin mr-1" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                    </svg>
                                    Loading...
                                  </>
                              ) : revisions.length >= 3 ? (
                                  'Max Revisions'
                              ) : (
                                  'Create Revision'
                              )}
                            </button>

                            {/* REMOVED: Business Cards Button - moved to detailed view */}

                            {isSuperUser && (() => {
                              const catalogState = catalogStates[displayed.id] || {
                                isInCatalog: false,
                                catalogLoading: false,
                                catalogCode: null
                              };

                              return (
                                  <button
                                      onClick={() => addToCatalog(displayed)}
                                      disabled={catalogState.catalogLoading || catalogState.isInCatalog}
                                      className={`btn-action relative flex items-center space-x-1 text-xs ${
                                          catalogState.isInCatalog
                                              ? 'bg-gray-800 text-white cursor-not-allowed'
                                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                                      }`}
                                  >
                                    {catalogState.catalogLoading ? (
                                        <>
                                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor"
                                               viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                          </svg>
                                          <span>Adding...</span>
                                        </>
                                    ) : catalogState.isInCatalog ? (
                                        <>
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor"
                                               viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M5 13l4 4L19 7"/>
                                          </svg>
                                          {catalogState.catalogCode &&
                                              <span className="text-xs">({catalogState.catalogCode})</span>}
                                        </>
                                    ) : (
                                        <>
                                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor"
                                               viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 4v16m8-8H4"/>
                                          </svg>
                                          <span
                                              className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  Catalog
                                </span>
                                          <span className="opacity-0">Catalog</span>
                                        </>
                                    )}
                                  </button>
                              );
                            })()}

                            <button onClick={() => confirmDelete(displayed.id)} className="btn-action btn-danger">
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

        {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <PaginationControls/>
            </div>
        )}

        {loadingMore && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"/>
                <span className="text-sm text-gray-600">Loading page...</span>
              </div>
            </div>
        )}

        {selectedLogo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
                <p className="text-gray-600 mb-4">Delete this logo and all revisions? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={removeOne} className="btn-action btn-danger flex-1">
                    Delete
                  </button>
                  <button onClick={() => setSelectedLogo(null)} className="btn-action btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}

        {showBulkDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-semibold mb-2">Delete Selected Logos</h3>
                <p className="text-gray-600 mb-4">
                  Delete {selectedCount} selected logo{selectedCount !== 1 ? 's' : ''} and all their revisions? This
                  cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={bulkDelete} className="btn-action btn-danger flex-1" disabled={bulkActionLoading}>
                    {bulkActionLoading ? 'Deleting...' : 'Delete All'}
                  </button>
                  <button onClick={() => setShowBulkDeleteModal(false)} className="btn-action btn-secondary flex-1"
                          disabled={bulkActionLoading}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* REMOVED: Business Card Modal - no longer needed in HistoryView */}
      </>
  );
};

export default function HistoryView() {
  const {user} = useAuth();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    const run = async () => {
      try {
        setUserLoading(true);
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          const email = data.email;
          setUserEmail(email);

          await syncUserUsageWithDynamoDB(email, {
            logosCreated: data.logosCreated,
            logosLimit: data.logosLimit
          });

          setUsage({ used: data.logosCreated, limit: data.logosLimit });
        } else if (res.status === 401) {
          router.push('/login?redirect=/history');
          return;
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (e) {
        setError('Failed to load user data');
      } finally {
        setUserLoading(false);
      }
    };
    run();
  }, [router]);

  const clearFilters = () => {
    setSearchTerm('');
    setIndustryFilter('all');
  };

  return (
      <main className="container mx-auto px-4 pb-6 max-w-4xl history-page">
        <div className="mt-2 card">
          <h2 className="text-2xl text-indigo-600 font-semibold mb-4 text-center">Logo History</h2>

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
                  {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
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

            {(searchTerm.trim() || industryFilter !== 'all') && (
                <div className="flex justify-end">
                  <button onClick={clearFilters} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    Clear Filters
                  </button>
                </div>
            )}
          </div>

          {userLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading user data...</p>
              </div>
          )}

          {error && !userLoading && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
          )}

          {!userLoading && !error && userEmail && (
              <LogoGrid
                  userEmail={userEmail}
                  isSuperUser={!!user?.isSuperUser}
                  searchTerm={searchTerm}
                  industryFilter={industryFilter}
                  itemsPerPage={itemsPerPage}
              />
          )}
        </div>
      </main>
  );
}