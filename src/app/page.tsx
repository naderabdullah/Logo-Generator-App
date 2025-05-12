'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import GenerateForm from './components/GenerateForm';
import LoadingSpinner from './components/LoadingSpinner';
import InstallBanner from './components/InstallBanner';
import OfflineIndicator from './components/OfflineIndicator';

// Separate component that uses searchParams
function GenerateFormWithParams() {
  const [loading, setLoading] = useState<boolean>(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSetLoading = useCallback((value: boolean) => {
    console.log('Setting loading state:', value);
    setLoading(value);
  }, []);
  
  const handleSetImageDataUri = useCallback((value: string | null) => {
    console.log('Setting image data URI:', value ? `${value.substring(0, 30)}...` : 'null');
    setImageDataUri(value);
  }, []);
  
  const handleSetError = useCallback((value: string | null) => {
    console.log('Setting error state:', value);
    setError(value);
  }, []);

  return (
    <>
      <GenerateForm
        key="generate-form"
        setLoading={handleSetLoading}
        setImageDataUri={handleSetImageDataUri}
        setError={handleSetError}
      />
      
      {loading && <LoadingSpinner />}

      {error && !loading && (
        <div className="mt-4 sm:mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const [appReady, setAppReady] = useState(false);
  
  // Initialize PWA functionality
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }

    // Mark app as ready with a slight delay for smoother animation
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Header />
      
      <main className={`container mx-auto px-4 pt-28 pb-6 max-w-4xl ${appReady ? 'app-loading' : 'opacity-0'}`}>
        <OfflineIndicator />
        {/* <InstallBanner /> */}
        
        <div className="mt-2">
          <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
            <GenerateFormWithParams />
          </Suspense>
        </div>

        <footer className="mt-8 sm:mt-12 text-center text-gray-500 text-sm pb-6">
          <p>Logo Generation Tool • Smarty Apps • {new Date().getFullYear()}</p>
        </footer>
      </main>
    </>
  );
}