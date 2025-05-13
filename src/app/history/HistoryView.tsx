'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllLogos, deleteLogo, StoredLogo } from '@/app/utils/indexedDBUtils';
import Header from '@/app/components/Header';
import Link from 'next/link';

export default function HistoryView() {
  const [logos, setLogos] = useState<StoredLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        setLoading(true);
        const allLogos = await getAllLogos();
        setLogos(allLogos);
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
      setLogos(logos.filter(logo => logo.id !== selectedLogo));
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
          
          {!loading && !error && logos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven't generated any logos yet.</p>
              <Link href="/" className="btn-primary inline-block">
                Generate Your First Logo
              </Link>
            </div>
          )}
          
          {!loading && !error && logos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {logos.map(logo => (
                <div key={logo.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-2 h-48 flex items-center justify-center bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo.imageDataUri}
                      alt={`${logo.parameters.companyName} logo`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-medium truncate" title={logo.parameters.companyName}>
                      {logo.parameters.companyName}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatDate(logo.createdAt)}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 text-sm">
                      <button
                        onClick={() => handleViewLogo(logo.id)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors flex-1"
                      >
                        View
                      </button>
                      
                      <button
                        onClick={() => handleEditLogo(logo.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex-1"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => confirmDeleteLogo(logo.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex-1"
                      >
                        Delete
                      </button>
                    </div>
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
              <p className="mb-6">Are you sure you want to delete this logo? This action cannot be undone.</p>
              
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