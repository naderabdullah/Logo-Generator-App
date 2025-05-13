'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllLogosWithRevisions, 
  deleteLogo, 
  StoredLogo,
  getUserUsage
} from '@/app/utils/indexedDBUtils';
import Header from '@/app/components/Header';
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
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        setLoading(true);
        const allLogosWithRevisions = await getAllLogosWithRevisions();
        setLogosWithRevisions(allLogosWithRevisions);
        
        // Get usage information
        const usageData = await getUserUsage();
        if (usageData) {
          setUsage({
            used: usageData.logosCreated,
            limit: usageData.logosLimit
          });
        }
      } catch (err) {
        console.error('Error fetching logos:', err);
        setError('Failed to load logo history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogos();
  }, []);
  
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
    if (!selectedLogo) return;
    
    try {
      await deleteLogo(selectedLogo);
      // Refresh the list after deletion
      const allLogosWithRevisions = await getAllLogosWithRevisions();
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
    <>
      <Header />
      
      <main className="container mx-auto px-4 pb-6 max-w-4xl history-page">
        <div className="mt-4 card">
          <h2 className="text-xl font-semibold mb-4">Logo History</h2>
          
          {/* Usage information */}
          {usage && (
            <div className="mb-6 p-3 bg-indigo-50 rounded-lg">
              <h3 className="font-medium text-indigo-700">Your Logo Usage</h3>
              <p className="text-sm text-indigo-600">
                You have created {usage.used} of {usage.limit} available logos
                {usage.used >= usage.limit && (
                  <span className="ml-2">
                    <Link href="/upgrade" className="text-indigo-800 underline">Upgrade for more</Link>
                  </span>
                )}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="text-center my-8">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-600">Loading logo history...</p>
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
              <p className="text-gray-600 mb-4">You haven't generated any logos yet.</p>
              <Link href="/" className="btn-primary inline-block">
                Generate Your First Logo
              </Link>
            </div>
          )}
          
          {!loading && !error && logosWithRevisions.length > 0 && (
            <div className="space-y-6">
              {logosWithRevisions.map(({ original, revisions }) => (
                <div key={original.id} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-indigo-50 p-3 border-b">
                    <h3 className="font-medium text-indigo-800">
                      {original.parameters.companyName} Logo
                      <span className="text-xs text-indigo-600 ml-2">
                        ({revisions.length} revision{revisions.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Created on {formatDate(original.createdAt)}
                    </p>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-1/3 sm:w-1/4 h-32 flex-shrink-0 bg-gray-50 flex items-center justify-center p-2 rounded border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={original.imageDataUri}
                          alt={`${original.parameters.companyName} logo`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-800">Original Logo</h4>
                          <p className="text-xs text-gray-500">
                            Style: {original.parameters.overallStyle}, 
                            Colors: {original.parameters.colorScheme}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewLogo(original.id)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm"
                          >
                            View
                          </button>
                          
                          <button
                            onClick={() => handleEditLogo(original.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                            disabled={revisions.length >= 3}
                          >
                            {revisions.length >= 3 ? 'Max Revisions' : 'Revise'}
                          </button>
                          
                          <button
                            onClick={() => confirmDeleteLogo(original.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {revisions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-800 mb-3">Revisions</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {revisions.map((revision) => (
                            <div key={revision.id} className="border rounded p-2">
                              <div className="h-24 bg-gray-50 flex items-center justify-center mb-2 rounded border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={revision.imageDataUri}
                                  alt={`${revision.parameters.companyName} logo revision ${revision.revisionNumber}`}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <div className="text-xs text-gray-500 mb-1">
                                Revision #{revision.revisionNumber} - {formatDate(revision.createdAt)}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleViewLogo(revision.id)}
                                  className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-xs flex-1"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleEditLogo(revision.id)}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs flex-1"
                                  disabled={revisions.length >= 3}
                                >
                                  {revisions.length >= 3 ? 'Max' : 'Revise'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
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
    </>
  );
}