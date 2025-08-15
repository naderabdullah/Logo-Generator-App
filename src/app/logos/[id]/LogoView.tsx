// src/app/logos/[id]/LogoView.tsx - COMPLETE with catalog functionality added
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getLogo,
  getOriginalLogo,
  getRevisionsForLogo,
  updateLogoName,
  StoredLogo,
  canCreateOriginalLogo,
  isLogoNameTaken
} from '@/app/utils/indexedDBUtils';
import { useAuth } from '@/app/context/AuthContext';
import ImageDisplay from '@/app/components/ImageDisplay';

interface LogoViewProps {
  logoId: string;
}

export default function LogoView({ logoId }: LogoViewProps) {
  const [logo, setLogo] = useState<StoredLogo | null>(null);
  const [originalLogo, setOriginalLogo] = useState<StoredLogo | null>(null);
  const [revisions, setRevisions] = useState<StoredLogo[]>([]);
  const [activeLogoId, setActiveLogoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [logoName, setLogoName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // NEW: Catalog functionality state
  const [isInCatalog, setIsInCatalog] = useState<boolean>(false);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [catalogCode, setCatalogCode] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const loadLogo = async () => {
      if (!user?.email) {
        setError('Please log in to view logos');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const logoData = await getLogo(logoId, user.email);
        if (!logoData) {
          setError('Logo not found');
          return;
        }

        setLogo(logoData);
        setLogoName(logoData.name);
        setActiveLogoId(logoData.id);

        // If this is a revision, get the original logo and all revisions
        if (logoData.isRevision && logoData.originalLogoId) {
          const original = await getOriginalLogo(logoData.originalLogoId, user.email);
          const allRevisions = await getRevisionsForLogo(logoData.originalLogoId, user.email);

          setOriginalLogo(original);
          setRevisions(allRevisions);
        }
        // If this is an original logo, get its revisions
        else {
          const allRevisions = await getRevisionsForLogo(logoData.id, user.email);
          setRevisions(allRevisions);
        }

      } catch (err) {
        console.error('Error loading logo:', err);
        setError('Failed to load logo');
      } finally {
        setLoading(false);
      }
    };

    loadLogo();
  }, [logoId, user?.email]);

  // NEW: Check catalog status when component loads
  useEffect(() => {
    const checkCatalogStatus = async () => {
      if (!logo?.id) return;

      try {
        const response = await fetch('/api/catalog', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logoKeyId: logo.id
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsInCatalog(data.isInCatalog);
          if (data.catalogLogo) {
            setCatalogCode(data.catalogLogo.catalog_code);
          }
        }
      } catch (error) {
        console.error('Error checking catalog status:', error);
      }
    };

    checkCatalogStatus();
  }, [logo?.id]);

  const switchLogoVersion = async (targetLogoId: string) => {
    if (!user?.email) return;

    try {
      const targetLogo = await getLogo(targetLogoId, user.email);
      if (targetLogo) {
        setLogo(targetLogo);
        setLogoName(targetLogo.name);
        setActiveLogoId(targetLogo.id);
      }
    } catch (err) {
      console.error('Error switching logo version:', err);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  };

  const handleNameUpdate = async () => {
    if (!logo || !user?.email) return;

    const trimmedName = logoName.trim();
    
    // Clear any previous error
    setNameError(null);
    
    // If name hasn't changed, just exit edit mode
    if (trimmedName === logo.name) {
      setIsEditingName(false);
      return;
    }
    
    // Check if name is empty
    if (!trimmedName) {
      setNameError('Logo name cannot be empty');
      return;
    }

    try {
      // Check if the new name is already taken
      const isTaken = await isLogoNameTaken(user.email, trimmedName, logo.id);
      
      if (isTaken) {
        setNameError('This name is already taken. Please choose a different name.');
        return;
      }

      // Name is valid, proceed with update
      await updateLogoName(logo.id, trimmedName, user.email);
      setLogo(prev => prev ? { ...prev, name: trimmedName } : null);
      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating logo name:', err);
      setNameError('Failed to update name. Please try again.');
      // Revert to original name
      setLogoName(logo.name || 'Untitled');
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      setLogoName(logo?.name || 'Untitled');
      setNameError(null);
      setIsEditingName(false);
    }
  };

  const handleEdit = () => {
    if (!logo) return;
    router.push(`/?edit=${logo.id}`);
  };

  const handleCreateSimilarLogo = async () => {
    if (!user?.email) {
      router.push('/login');
      return;
    }

    try {
      const canCreate = await canCreateOriginalLogo(user.email);
      if (!canCreate) {
        setShowLimitModal(true);
        return;
      }

      if (logo) {
        router.push(`/?reference=${logo.id}`);
      }
    } catch (error) {
      console.error('Error checking logo creation limit:', error);
      setShowLimitModal(true);
    }
  };

  // NEW: Handle adding to catalog
  const handleAddToCatalog = async () => {
    if (!logo || isInCatalog) return;

    setCatalogLoading(true);

    try {
      const response = await fetch('/api/catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoKeyId: logo.id,
          imageDataUri: logo.imageDataUri,
          parameters: logo.parameters,
          originalCompanyName: logo.parameters.companyName || 'Unknown Company'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsInCatalog(true);
        setCatalogCode(data.catalogLogo.catalog_code);
      } else if (response.status === 409) {
        // Logo already in catalog
        const data = await response.json();
        setIsInCatalog(true);
        setCatalogCode(data.catalogCode);
      } else {
        const errorData = await response.json();
      }
    } catch (error) {
      console.error('Error adding to catalog:', error);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleCreateFromScratch = async () => {
    if (!user?.email) {
      router.push('/login');
      return;
    }

    try {
      const canCreate = await canCreateOriginalLogo(user.email);
      if (!canCreate) {
        setShowLimitModal(true);
        return;
      }

      router.push('/');
    } catch (error) {
      console.error('Error checking logo creation limit:', error);
      setShowLimitModal(true);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
        <main className="container mx-auto px-4 pb-6 max-w-4xl">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading logo...</p>
            </div>
          </div>
        </main>
    );
  }

  if (error || !logo) {
    return (
        <main className="container mx-auto px-4 pb-6 max-w-4xl">
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {error || 'Logo not found'}
            </h2>
            <p className="text-gray-500 mb-6">
              The logo you're looking for doesn't exist or has been removed.
            </p>
            <Link
                href="/history"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              View All Logos
            </Link>
          </div>
        </main>
    );
  }

  return (
      <main className="container mx-auto px-4 pb-6 max-w-4xl logo-view-page">
        <div className="mt-4 card">
          <div className="mb-6">
            {/* Header with editable name */}
            <div className="flex items-center justify-between mb-2">
              {isEditingName ? (
                <div className="flex-1">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={logoName}
                    onChange={handleNameChange}
                    onBlur={handleNameUpdate}
                    onKeyDown={handleNameKeyDown}
                    className={`form-input text-xl font-semibold w-full py-1 ${
                      nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                    placeholder="Untitled"
                    autoFocus
                  />
                  {nameError && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {nameError}
                    </p>
                  )}
                </div>
              ) : (
                <h2
                  className="text-xl font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition flex-1"
                  onClick={() => {
                    setIsEditingName(true);
                    setNameError(null);
                    setTimeout(() => nameInputRef.current?.focus(), 0);
                  }}
                >
                  {logoName || 'Untitled'}
                </h2>
              )}
              {!isEditingName && (
                  <button
                      onClick={() => {
                        setIsEditingName(true);
                        setTimeout(() => nameInputRef.current?.focus(), 0);
                      }}
                      className="ml-2 text-gray-500 hover:text-indigo-600 p-1"
                      aria-label="Edit logo name"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {logo.parameters.companyName} • Generated on {formatDate(logo.createdAt)}
            </p>

            {/* Beautiful Revision Switching Buttons */}
            {(originalLogo || revisions.length > 0) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Logo Versions
                    </h3>
                    <span className="text-xs text-gray-500">
                  {3 - revisions.length} revision{3 - revisions.length > 1 ? 's' : ''} remaining
                </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {/* Original Logo Button */}
                      {originalLogo && (
                          <button
                              onClick={() => switchLogoVersion(originalLogo.id)}
                              className={`relative px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all duration-200 ${
                                  activeLogoId === originalLogo.id
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                      : 'bg-white text-gray-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 3l14 9-14 9V3z"
                                />
                              </svg>
                              <span>Original</span>
                            </div>
                            {activeLogoId === originalLogo.id && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                            )}
                          </button>
                      )}

                      {/* Revision Buttons */}
                      {revisions.map((revision) => (
                          <button
                              key={revision.id}
                              onClick={() => switchLogoVersion(revision.id)}
                              className={`relative px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all duration-200 ${
                                  activeLogoId === revision.id
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                      : 'bg-white text-gray-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              <span>Revision {revisions.indexOf(revision) + 1}</span>
                            </div>
                            {activeLogoId === revision.id && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                            )}
                          </button>
                      ))}
                    </div>
                  </div>
                </div>
            )}

            {/* Logo Display */}
            <div className="text-center mb-6">
              <ImageDisplay
                  imageDataUri={logo.imageDataUri}
                  logoName={logoName}
              />
            </div>

            {/* Action Buttons - UPDATED: Now includes catalog button */}
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {/* Edit button - Only show if revisions < 3 */}
              {revisions.length < 3 && (
                  <button
                      onClick={handleEdit}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Logo</span>
                  </button>
              )}

              {/* NEW: Add to Catalog button */}
              <button
                  onClick={handleAddToCatalog}
                  disabled={catalogLoading || isInCatalog}
                  className={`font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                      isInCatalog
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
              >
                {catalogLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Adding...</span>
                    </>
                ) : isInCatalog ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>In Catalog ({catalogCode})</span>
                    </>
                ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Add to Catalog</span>
                    </>
                )}
              </button>

              <button
                  onClick={handleCreateSimilarLogo}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Create Similar</span>
              </button>
            </div>

            {/* Toggle Details Button */}
            <div className="text-center">
              <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-600 hover:text-gray-800 underline text-sm flex items-center justify-center mx-auto space-x-1"
              >
                <svg
                    className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Details Section */}
        {showDetails && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-indigo-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Logo Details
                </h3>
              </div>

              <div className="p-6">
                {/* Core Information */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <div className="w-8 h-0.5 bg-indigo-500 mr-2"></div>
                    Core Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">Company</h5>
                          <p className="text-gray-700 mt-1">{logo.parameters.companyName}</p>
                        </div>
                      </div>
                    </div>

                    {logo.parameters.slogan && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 text-sm">Slogan</h5>
                              <p className="text-gray-700 mt-1">"{logo.parameters.slogan}"</p>
                            </div>
                          </div>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H8a2 2 0 00-2-2V6" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">Industry</h5>
                          <p className="text-gray-700 mt-1">{logo.parameters.industry}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">Color Scheme</h5>
                          <p className="text-gray-700 mt-1">{logo.parameters.colorScheme}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">Symbol Focus</h5>
                          <p className="text-gray-700 mt-1">{logo.parameters.symbolFocus}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">Brand Personality</h5>
                          <p className="text-gray-700 mt-1">{logo.parameters.brandPersonality}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Details - Only show if any advanced parameters exist */}
                {(logo.parameters.typographyStyle || logo.parameters.lineStyle ||
                    logo.parameters.composition || logo.parameters.shapeEmphasis || logo.parameters.texture ||
                    logo.parameters.complexityLevel || logo.parameters.applicationContext) && (
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                        <div className="w-8 h-0.5 bg-green-500 mr-2"></div>
                        Advanced Parameters
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {logo.parameters.typographyStyle && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">Typography</h5>
                                  <p className="text-gray-700 mt-1">{logo.parameters.typographyStyle}</p>
                                </div>
                              </div>
                            </div>
                        )}

                        {logo.parameters.lineStyle && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">Line Style</h5>
                                  <p className="text-gray-700 mt-1">{logo.parameters.lineStyle}</p>
                                </div>
                              </div>
                            </div>
                        )}

                        {logo.parameters.composition && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">Composition</h5>
                                  <p className="text-gray-700 mt-1">{logo.parameters.composition}</p>
                                </div>
                              </div>
                            </div>
                        )}

                        {logo.parameters.shapeEmphasis && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">Shape</h5>
                                  <p className="text-gray-700 mt-1">{logo.parameters.shapeEmphasis}</p>
                                </div>
                              </div>
                            </div>
                        )}

                        {logo.parameters.texture && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">Texture</h5>
                                  <p className="text-gray-700 mt-1">{logo.parameters.texture}</p>
                                </div>
                              </div>
                            </div>
                        )}

                        {logo.parameters.complexityLevel && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">Complexity</h5>
                                  <p className="text-gray-700 mt-1">{logo.parameters.complexityLevel}</p>
                                </div>
                              </div>
                            </div>
                        )}

                        {logo.parameters.applicationContext && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm">Application</h5>
                                  <p className="text-gray-700 mt-1">{logo.parameters.applicationContext}</p>
                                </div>
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                )}

                {/* Special Instructions - If exists */}
                {logo.parameters.specialInstructions && (
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                        <div className="w-8 h-0.5 bg-amber-500 mr-2"></div>
                        Special Instructions
                      </h4>
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-amber-800 font-medium text-sm">{logo.parameters.specialInstructions}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>
            </div>
        )}

        {/* Limit Modal */}
        {showLimitModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <div className="text-center">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Logo Limit Reached</h3>
                  <p className="text-gray-600 mb-6">
                    You've reached your logo creation limit. Purchase more credits to continue creating logos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => setShowLimitModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <Link
                        href="/purchase"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Purchase Credits
                    </Link>
                  </div>
                </div>
              </div>
            </div>
        )}
      </main>
  );
}