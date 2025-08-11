// src/app/history/HistoryView.tsx - UPDATED with Add to Catalog functionality
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllLogosWithRevisions,
  deleteLogo,
  StoredLogo,
  getUserUsage,
  syncUserUsageWithDynamoDB
} from '@/app/utils/indexedDBUtils';
import Link from 'next/link';

// Add interface for catalog state
interface CatalogState {
  [logoId: string]: {
    isInCatalog: boolean;
    isAdding: boolean;
    catalogCode?: string;
    isChecking: boolean;
  };
}

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

  // NEW: Add catalog state
  const [catalogState, setCatalogState] = useState<CatalogState>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

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

          const allLogosWithRevisions = await getAllLogosWithRevisions(email);
          setLogosWithRevisions(allLogosWithRevisions);

          // NEW: Check catalog status for all logos
          await checkCatalogStatusForAllLogos(allLogosWithRevisions);
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

  // NEW: Function to check catalog status for all logos
  const checkCatalogStatusForAllLogos = async (logosWithRevisions: { original: StoredLogo; revisions: StoredLogo[]; }[]) => {
    const allLogos = logosWithRevisions.flatMap(logoGroup => [
      logoGroup.original,
      ...logoGroup.revisions
    ]);

    const initialCatalogState: CatalogState = {};

    // Initialize catalog state for all logos
    allLogos.forEach(logo => {
      initialCatalogState[logo.id] = {
        isInCatalog: false,
        isAdding: false,
        isChecking: true
      };
    });

    setCatalogState(initialCatalogState);

    // Check catalog status for each logo
    for (const logo of allLogos) {
      try {
        const response = await fetch('/api/catalog', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logoKeyId: logo.id }),
        });

        if (response.ok) {
          const { isInCatalog, catalogLogo } = await response.json();

          setCatalogState(prev => ({
            ...prev,
            [logo.id]: {
              ...prev[logo.id],
              isInCatalog,
              catalogCode: catalogLogo?.catalog_code,
              isChecking: false
            }
          }));
        } else {
          setCatalogState(prev => ({
            ...prev,
            [logo.id]: {
              ...prev[logo.id],
              isChecking: false
            }
          }));
        }
      } catch (error) {
        console.error(`Error checking catalog status for logo ${logo.id}:`, error);
        setCatalogState(prev => ({
          ...prev,
          [logo.id]: {
            ...prev[logo.id],
            isChecking: false
          }
        }));
      }
    }
  };

  // NEW: Function to add logo to catalog
  const addToCatalog = async (logo: StoredLogo) => {
    try {
      // Set loading state
      setCatalogState(prev => ({
        ...prev,
        [logo.id]: {
          ...prev[logo.id],
          isAdding: true
        }
      }));

      const response = await fetch('/api/catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoKeyId: logo.id,
          imageDataUri: logo.imageDataUri,
          parameters: logo.parameters,
          originalCompanyName: logo.parameters.companyName || logo.name
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - update state
        setCatalogState(prev => ({
          ...prev,
          [logo.id]: {
            ...prev[logo.id],
            isInCatalog: true,
            isAdding: false,
            catalogCode: data.catalogLogo.catalog_code
          }
        }));

        console.log(`Logo added to catalog with code: ${data.catalogLogo.catalog_code}`);
      } else {
        // Handle error
        if (response.status === 409) {
          // Already in catalog
          setCatalogState(prev => ({
            ...prev,
            [logo.id]: {
              ...prev[logo.id],
              isInCatalog: true,
              isAdding: false,
              catalogCode: data.catalogCode
            }
          }));
        } else {
          throw new Error(data.error || 'Failed to add to catalog');
        }
      }
    } catch (error) {
      console.error('Error adding to catalog:', error);
      // Reset adding state on error
      setCatalogState(prev => ({
        ...prev,
        [logo.id]: {
          ...prev[logo.id],
          isAdding: false
        }
      }));

      // Show error to user
      alert(`Failed to add to catalog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // NEW: Render catalog button for each logo
  const renderCatalogButton = (logo: StoredLogo) => {
    const state = catalogState[logo.id];

    if (!state) {
      return null;
    }

    if (state.isChecking) {
      return (
          <button
              disabled
              className="btn-action btn-secondary opacity-50 cursor-not-allowed text-xs"
          >
            Checking...
          </button>
      );
    }

    if (state.isInCatalog) {
      return (
          <button
              disabled
              className="btn-action bg-green-600 text-white opacity-75 cursor-default text-xs"
              title={`In catalog as ${state.catalogCode}`}
          >
            ✓ {state.catalogCode}
          </button>
      );
    }

    if (state.isAdding) {
      return (
          <button
              disabled
              className="btn-action btn-secondary opacity-50 cursor-not-allowed text-xs"
          >
            Adding...
          </button>
      );
    }

    return (
        <button
            onClick={() => addToCatalog(logo)}
            className="btn-action bg-purple-600 hover:bg-purple-700 text-white text-xs"
            title="Add this logo to the catalog"
        >
          + Catalog
        </button>
    );
  };

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

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
      await deleteLogo(selectedLogo, userEmail);

      const allLogosWithRevisions = await getAllLogosWithRevisions(userEmail);
      setLogosWithRevisions(allLogosWithRevisions);
      setSelectedLogo(null);

      // Adjust current page if needed after deletion
      const totalPages = Math.ceil((allLogosWithRevisions.length) / itemsPerPage);
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

  // Pagination calculations
  const totalLogos = logosWithRevisions.length;
  const totalPages = Math.ceil(totalLogos / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogos = logosWithRevisions.slice(startIndex, endIndex);

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

  return (
      <main className="container mx-auto px-4 pb-6 max-w-4xl history-page">
        <div className="mt-4 card">
          <h2 className="text-xl font-semibold mb-4 text-center">Logo History</h2>

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

          {!loading && !error && logosWithRevisions.length > 0 && (
              <>
                {/* Pagination Controls - Top */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
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

                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalLogos)} of {totalLogos} logos
                  </div>
                </div>

                {/* Logos Grid */}
                <div className="grid gap-6">
                  {currentLogos.map(({ original, revisions }) => {
                    // Determine which logo to display (latest revision or original)
                    const latestRevision = getLatestRevision(revisions);
                    const displayedLogo = latestRevision || original;
                    const hasRevisions = revisions.length > 0;

                    return (
                        <div key={original.id} className="border rounded-lg p-4 bg-white shadow-sm">
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
                                        <span className="text-gray-500"> (of {revisions.length})</span>
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

                              {/* Action Buttons - UPDATED with catalog button */}
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

                                {/* NEW: Add to Catalog button */}
                                {renderCatalogButton(displayedLogo)}

                                <button
                                    onClick={() => confirmDeleteLogo(displayedLogo.id)}
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                        ))}
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
      </main>
  );
}