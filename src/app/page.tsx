// src/app/page.tsx - FIXED: Working version with proper auth handling
'use client';

import { Suspense, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
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
      {/* Error Display - Shows above the form */}
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

  // Simple auth redirect - only run once after loading is complete
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Show loading while AuthContext is checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if no user (will redirect to login)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, show the main app
  return (
    <div className="generator-page">
      <OfflineIndicator />
      
      <Suspense fallback={<div className="text-center p-4">Loading form...</div>}>
        <GenerateFormWithParams />
      </Suspense>
    </div>
  );
}