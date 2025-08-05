// src/app/page.tsx - Simplified to use the corrected AuthContext
'use client';

import { Suspense, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import GenerateForm from './components/GenerateForm';
import OfflineIndicator from './components/OfflineIndicator';

function GenerateFormWithParams() {
  const [loading, setLoading] = useState<boolean>(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSetLoading = useCallback((value: boolean) => {
    setLoading(value);
  }, []);

  const handleSetImageDataUri = useCallback((value: string | null) => {
    setImageDataUri(value);
  }, []);

  const handleSetError = useCallback((value: string | null) => {
    setError(value);
  }, []);

  return (
    <>
      {/* Error Display - Now shows ABOVE the form */}
      {error && !loading && (
        <div className="mt-md p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center mb-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <GenerateForm
        key="generate-form"
        setLoading={handleSetLoading}
        setImageDataUri={handleSetImageDataUri}
        setError={handleSetError}
      />
    </>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-md text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`generator-page ${appReady ? 'app-loading' : 'opacity-0'}`}>
      <OfflineIndicator />
      
      <Suspense fallback={<div className="text-center p-4">Loading form...</div>}>
        <GenerateFormWithParams />
      </Suspense>
    </div>
  );
}