'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getLogo, getRevisionsForLogo, StoredLogo, renameLogo } from '@/app/utils/indexedDBUtils';
import Header from '@/app/components/AppHeader';
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

            {/* Revision switching buttons */}
            {(originalLogo || revisions.length > 0) && (
              <div className="revision-switcher">
                {originalLogo && (
                  <button
                    onClick={() => switchLogoVersion(originalLogo.id)}
                    className={`logo-revision-btn ${
                      activeLogoId === originalLogo.id ? 'active' : ''
                    }`}
                  >
                    Original
                  </button>
                )}
                
                {revisions.map((revision) => (
                  <button
                    key={revision.id}
                    onClick={() => switchLogoVersion(revision.id)}
                    className={`logo-revision-btn ${
                      activeLogoId === revision.id ? 'active' : ''
                    }`}
                  >
                    Revision {revision.revisionNumber}
                  </button>
                ))}
                
                {originalLogo && revisions.length < 3 && (
                  <div className="flex items-center ml-auto">
                    <span className="text-sm text-gray-600 font-medium">
                      {revisions.length}/3 revisions used
                    </span>
                  </div>
                )}
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