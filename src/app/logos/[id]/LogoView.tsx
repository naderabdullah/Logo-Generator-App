'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getLogo, getRevisionsForLogo, StoredLogo, renameLogo } from '@/app/utils/indexedDBUtils';
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
  
  // New state for name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [logoName, setLogoName] = useState('Untitled');
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setLoading(true);
        const logoData = await getLogo(logoId);
        
        if (!logoData) {
          setError('Logo not found');
          return;
        }
        
        // Set the active logo to the requested logo
        setLogo(logoData);
        setActiveLogoId(logoId);
        // Set the logo name
        setLogoName(logoData.name || 'Untitled');
        
        // Determine if this is an original or a revision
        if (logoData.isRevision && logoData.originalLogoId) {
          // If it's a revision, get the original
          const originalData = await getLogo(logoData.originalLogoId);
          if (originalData) {
            setOriginalLogo(originalData);
            // Get all revisions of the original
            const allRevisions = await getRevisionsForLogo(logoData.originalLogoId);
            setRevisions(allRevisions);
          }
        } else {
          // If it's an original, set it as the original and get its revisions
          setOriginalLogo(logoData);
          const allRevisions = await getRevisionsForLogo(logoData.id);
          setRevisions(allRevisions);
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
        setError('Failed to load logo');
      } finally {
        setLoading(false);
      }
    };
    
    if (logoId) {
      fetchLogo();
    } else {
      setError('Invalid logo ID');
      setLoading(false);
    }
  }, [logoId]);
  
  // Handle switching to a different logo version
  const switchLogoVersion = async (id: string) => {
    try {
      // If we're already displaying this logo, do nothing
      if (id === activeLogoId) return;
      
      setLoading(true);
      const logoData = await getLogo(id);
      
      if (!logoData) {
        setError('Logo version not found');
      } else {
        setLogo(logoData);
        setActiveLogoId(id);
        // Update the logo name
        setLogoName(logoData.name || 'Untitled');
        // Update the URL without reloading the page
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
    if (!logo) return;
    
    try {
      // Make sure there's a name, or use "Untitled"
      const newName = logoName.trim() || 'Untitled';
      setLogoName(newName);
      
      // Update the logo name in the database
      await renameLogo(logo.id, newName);
      
      // Update the logo object with the new name
      setLogo({
        ...logo,
        name: newName
      });
      
      // Exit editing mode
      setIsEditingName(false);
    } catch (err) {
      console.error('Error renaming logo:', err);
      setError('Failed to rename logo');
    }
  };
  
  // Handle keyboard events in the name input
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Reset to the original name and exit editing mode
      setLogoName(logo?.name || 'Untitled');
      setIsEditingName(false);
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const handleEdit = () => {
    router.push(`/?edit=${activeLogoId}`);
  };
  
  return (
    <main className="container mx-auto px-4 pb-6 max-w-4xl">
      {loading && (
        <div className="text-center my-8">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading logo...</p>
        </div>
      )}
      
      {error && !loading && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-4 btn-primary inline-block"
          >
            Return to Generator
          </button>
        </div>
      )}
      
      {logo && !loading && !error && (
        <div className="mt-4">
          <div className="card mb-4">
            {/* Editable logo name */}
            <div className="flex items-center mb-2">
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
                  className="text-xl font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
                  onClick={() => {
                    setIsEditingName(true);
                    // Focus input after state update
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
                    // Focus input after state update
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
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Logo Versions
                  </h3>
                  {originalLogo && revisions.length < 3 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-gray-600 font-medium">
                          {revisions.length}/3 revisions
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Revision Buttons */}
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {/* Original Button */}
                    {originalLogo && (
                      <button
                        onClick={() => switchLogoVersion(originalLogo.id)}
                        className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
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
                              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
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
                    {revisions.map((revision, index) => (
                      <button
                        key={revision.id}
                        onClick={() => switchLogoVersion(revision.id)}
                        className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
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
                          <span>Rev {revision.revisionNumber}</span>
                        </div>
                        {activeLogoId === revision.id && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                      </button>
                    ))}
                    
                    {/* Add Revision Hint (when not at limit) */}
                    {originalLogo && revisions.length < 3 && (
                      <div className="flex items-center px-3 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs font-medium">Create revision</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Current Version Info */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-800">
                      Currently viewing: {' '}
                      {activeLogoId === originalLogo?.id 
                        ? 'Original Logo' 
                        : `Revision ${revisions.find(r => r.id === activeLogoId)?.revisionNumber}`
                      }
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Generated on {formatDate(logo.createdAt)}
                  </p>
                </div>
              </div>
            )}

            <ImageDisplay imageDataUri={logo.imageDataUri} />
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={handleEdit}
                className="btn-revise-logo"
              >
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {revisions.length >= 3 ? 'Create New Logo' : 'Revise This Logo'}
              </button>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Logo Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Company Name</h4>
                <p>{logo.parameters.companyName}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Style</h4>
                <p>{logo.parameters.overallStyle}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Color Scheme</h4>
                <p>{logo.parameters.colorScheme}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Symbol Focus</h4>
                <p>{logo.parameters.symbolFocus}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Brand Personality</h4>
                <p>{logo.parameters.brandPersonality}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Industry</h4>
                <p>{logo.parameters.industry}</p>
              </div>
              
              {logo.parameters.typographyStyle && (
                <div>
                  <h4 className="font-medium text-gray-700">Typography</h4>
                  <p>{logo.parameters.typographyStyle}</p>
                </div>
              )}
              
              {logo.parameters.lineStyle && (
                <div>
                  <h4 className="font-medium text-gray-700">Line Style</h4>
                  <p>{logo.parameters.lineStyle}</p>
                </div>
              )}
              
              {logo.parameters.composition && (
                <div>
                  <h4 className="font-medium text-gray-700">Composition</h4>
                  <p>{logo.parameters.composition}</p>
                </div>
              )}
              
              {logo.parameters.shapeEmphasis && (
                <div>
                  <h4 className="font-medium text-gray-700">Shape Emphasis</h4>
                  <p>{logo.parameters.shapeEmphasis}</p>
                </div>
              )}
              
              {logo.parameters.texture && (
                <div>
                  <h4 className="font-medium text-gray-700">Texture</h4>
                  <p>{logo.parameters.texture}</p>
                </div>
              )}
              
              {logo.parameters.complexityLevel && (
                <div>
                  <h4 className="font-medium text-gray-700">Complexity</h4>
                  <p>{logo.parameters.complexityLevel}</p>
                </div>
              )}
              
              {logo.parameters.applicationContext && (
                <div>
                  <h4 className="font-medium text-gray-700">Application Context</h4>
                  <p>{logo.parameters.applicationContext}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}