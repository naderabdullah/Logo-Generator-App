// src/app/history/HistoryView.tsx - FIXED for user-specific IndexedDB
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
    } catch (err) {
      console.error('Error deleting logo:', err);
      setError('Failed to delete logo');
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  return (
    <main className="container mx-auto px-4 pb-6 max-w-4xl history-page">
      <div className="mt-4 card">
        <h2 className="text-xl font-semibold mb-4 text-center">Logo History</h2>
        
        {usage && (
          <div className="mb-6 p-3 bg-indigo-50 rounded-lg">
            <h3 className="font-medium text-indigo-900 mb-2">Logo Credits</h3>
            <div className="flex justify-between items-center">
              <span className="text-indigo-700">Used: {usage.used} / {usage.limit}</span>
              <div className="bg-white rounded-full h-2 flex-1 mx-4">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-indigo-700">{usage.limit - usage.used} remaining</span>
            </div>
          </div>
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
        
        {!loading && !error && logosWithRevisions.length > 0 && (
          <div className="grid gap-6">
            {logosWithRevisions.map(({ original, revisions }) => {
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
                          Style: {displayedLogo.parameters.overallStyle} • 
                          Colors: {displayedLogo.parameters.colorScheme}
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
                          {revisions.length >= 3 ? 'Max Revisions' : `Revise (${3 - revisions.length} left)`}
                        </button>
                        
                        <button
                          onClick={() => confirmDeleteLogo(original.id)}
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
      </div>
      
      <div className="footer-wrapper mt-6">
        <p className="text-center text-gray-500 text-sm">
          Logo Generation Tool • Smarty Apps • {new Date().getFullYear()}
        </p>
      </div>

      {selectedLogo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this logo? This will delete the original logo and all its revisions. This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedLogo(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleDeleteLogo}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}