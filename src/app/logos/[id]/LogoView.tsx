// src/app/logos/[id]/LogoView.tsx - ONLY the details section changed to be cleaner
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLogo, getRevisionsForLogo, StoredLogo, renameLogo, canCreateOriginalLogo } from '@/app/utils/indexedDBUtils';
import ImageDisplay from '@/app/components/ImageDisplay';

interface LogoViewClientProps {
  logoId: string;
}

export default function LogoViewClient({ logoId }: LogoViewClientProps) {
  const [logo, setLogo] = useState<StoredLogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalLogo, setOriginalLogo] = useState<StoredLogo | null>(null);
  const [revisions, setRevisions] = useState<StoredLogo[]>([]);
  const [activeLogoId, setActiveLogoId] = useState<string>(logoId);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // State for name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [logoName, setLogoName] = useState('Untitled');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setLoading(true);
        
        // Get user info first
        const userResponse = await fetch('/api/user');
        if (userResponse.status === 401) {
          router.push('/login');
          return;
        }
        
        if (!userResponse.ok) {
          setError('Failed to authenticate user');
          return;
        }
        
        const userData = await userResponse.json();
        const email = userData.email;
        setUserEmail(email);
        
        // Get logo data
        const logoData = await getLogo(logoId, email);
        
        if (!logoData) {
          setError('Logo not found');
          return;
        }
        
        // Set the active logo to the requested logo
        setLogo(logoData);
        setActiveLogoId(logoId);
        setLogoName(logoData.name || 'Untitled');
        
        // Determine if this is an original logo or a revision
        let originalId = logoData.originalLogoId || logoData.id;
        
        // If this logo has an originalLogoId, fetch the original
        if (logoData.originalLogoId) {
          const originalLogoData = await getLogo(logoData.originalLogoId, email);
          if (originalLogoData) {
            setOriginalLogo(originalLogoData);
            originalId = originalLogoData.id;
          }
        } else {
          // This is the original logo
          setOriginalLogo(logoData);
        }
        
        // Fetch all revisions for the original logo
        const revisionsData = await getRevisionsForLogo(originalId, email);
        setRevisions(revisionsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching logo:', err);
        setError('Failed to load logo');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogo();
  }, [logoId, router]);
  
  const switchLogoVersion = async (id: string) => {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      const logoData = await getLogo(id, userEmail);
      
      if (logoData) {
        setLogo(logoData);
        setActiveLogoId(id);
        setLogoName(logoData.name || 'Untitled');
        
        // Update the URL without triggering a page reload
        window.history.pushState({}, '', `/logos/${id}`);
      }
    } catch (err) {
      console.error('Error switching logo version:', err);
      setError('Failed to switch logo version');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logo name update
  const handleNameUpdate = async () => {
    if (!logo || !userEmail) return;
    
    try {
      // Make sure the name is not empty
      const trimmedName = logoName.trim();
      if (!trimmedName) {
        setLogoName(logo.name || 'Untitled');
        setIsEditingName(false);
        return;
      }
      
      // Rename the logo
      await renameLogo(logo.id, trimmedName, userEmail);
      
      // Update the local state
      setLogo(prev => prev ? { ...prev, name: trimmedName } : null);
      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating logo name:', err);
      // Revert to original name
      setLogoName(logo.name || 'Untitled');
      setIsEditingName(false);
    }
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      setLogoName(logo?.name || 'Untitled');
      setIsEditingName(false);
    }
  };
  
  const handleEdit = () => {
    if (!logo) return;
    router.push(`/?edit=${logo.id}`);
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
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 mx-auto mb-4"></div>
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
                  onChange={(e) => setLogoName(e.target.value)}
                  onBlur={handleNameUpdate}
                  onKeyDown={handleNameKeyDown}
                  className="form-input text-xl font-semibold w-full py-1"
                  placeholder="Untitled"
                  autoFocus
                />
              </div>
            ) : (
              <h2 
                className="text-xl font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition flex-1"
                onClick={() => {
                  setIsEditingName(true);
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
                  {revisions.length + 1} version{revisions.length + 1 > 1 ? 's' : ''}
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
                        <span>Revision {revision.revisionNumber}</span>
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
            <ImageDisplay imageDataUri={logo.imageDataUri} />
          </div>
          
          {/* Action Buttons - ORIGINAL STYLING PRESERVED */}
          <div className="flex flex-wrap gap-3 justify-center mb-4">
            <button
              onClick={handleEdit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>
                {revisions.length >= 3 ? 'Create New Logo' : 'Edit Logo'}
              </span>
            </button>
            
            <Link
              href={`/?reference=${logo.id}`}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Create New Similar Logo</span>
            </Link>
            
            <Link
              href="/"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create from Scratch</span>
            </Link>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ONLY THIS DETAILS SECTION IS NEW - Clean Grid Layout */}
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
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">Slogan</h5>
                        <p className="text-gray-700 mt-1 italic">"{logo.parameters.slogan}"</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H10a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">Industry</h5>
                      <p className="text-gray-700 mt-1">{logo.parameters.industry}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Design & Style */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <div className="w-8 h-0.5 bg-pink-500 mr-2"></div>
                Design & Style
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">Style</h5>
                      <p className="text-gray-700 mt-1">{logo.parameters.overallStyle}</p>
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
                      <h5 className="font-medium text-gray-900 text-sm">Colors</h5>
                      <p className="text-gray-700 mt-1">{logo.parameters.colorScheme}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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

                {logo.parameters.typographyStyle && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">Typography</h5>
                        <p className="text-gray-700 mt-1">{logo.parameters.typographyStyle}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Parameters */}
            {(logo.parameters.lineStyle || logo.parameters.composition || logo.parameters.shapeEmphasis || logo.parameters.texture || logo.parameters.complexityLevel || logo.parameters.applicationContext) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                  <div className="w-8 h-0.5 bg-emerald-500 mr-2"></div>
                  Advanced Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logo.parameters.lineStyle && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
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
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">Shape Emphasis</h5>
                          <p className="text-gray-700 mt-1">{logo.parameters.shapeEmphasis}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {logo.parameters.texture && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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

            {/* Special Instructions */}
            {logo.parameters.specialInstructions && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                  <div className="w-8 h-0.5 bg-purple-500 mr-2"></div>
                  Special Instructions
                </h4>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">Special Instructions</h5>
                      <p className="text-gray-700 mt-1 leading-relaxed">{logo.parameters.specialInstructions}</p>
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
            <h3 className="text-lg font-semibold mb-4">Logo Limit Reached</h3>
            <p className="mb-6">
              You have reached your logo generation limit. Please purchase more credits or upgrade your plan to continue creating logos.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowLimitModal(false)}
              >
                Close
              </button>
              <Link
                href="/account"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buy Credits
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}