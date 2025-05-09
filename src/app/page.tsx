// src/app/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import GenerateForm from './components/GenerateForm';
import ImageDisplay from './components/ImageDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import InstallBanner from './components/InstallBanner';
import OfflineIndicator from './components/OfflineIndicator';

export default function Home() {
  // Using explicit types with default values for consistent hydration
  const [loading, setLoading] = useState<boolean>(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appReady, setAppReady] = useState(false);
  
  // Use useCallback for state setters to prevent unnecessary rerenders
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
    <main className={`container mx-auto px-4 py-6 max-w-4xl ${appReady ? 'app-loading' : 'opacity-0'}`}>
      <OfflineIndicator />
      {/* <InstallBanner /> */}
      
      <Header />

      <div className="mt-4 sm:mt-6">
      <GenerateForm
        key="generate-form"
        setLoading={handleSetLoading}
        setImageDataUri={handleSetImageDataUri}
        setError={handleSetError}
      />
      </div>

      {/* Conditionally render with stable logic */}
      {loading && <LoadingSpinner />}

      {/* Only show error when it exists and not loading */}
      {error && !loading && (
      <div className="mt-4 sm:mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
      )}

      {/* Only show image when it exists and not loading or errored */}
      {imageDataUri?.trim() && !loading && !error && (
      <ImageDisplay imageDataUri={imageDataUri} />
      )}

      <footer className="mt-8 sm:mt-12 text-center text-gray-500 text-sm pb-6">
      <p>Logo Generation Tool • Smarty Apps • {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}