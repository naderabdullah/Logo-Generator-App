// src/app/page.tsx (FIXED - Keep original structure but redirect to login)
'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import GenerateForm from './components/GenerateForm';
import OfflineIndicator from './components/OfflineIndicator';
import { redirectToAppManagerRegistration, isAppManagerRegistrationUrl } from '../lib/appManagerUtils';

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
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if current path is a public route that shouldn't require authentication
  const isPublicRoute = () => {
    const publicRoutes = [
      '/login',
      '/signup', 
      '/auth'
    ];
    
    // Also check if it's an App Manager registration URL
    return publicRoutes.some(route => pathname.startsWith(route)) || 
           isAppManagerRegistrationUrl(pathname);
  };
  
  // Check auth status and redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      
      // Skip auth check for public routes
      if (isPublicRoute()) {
        console.log("Public route detected, skipping auth check:", pathname);
        setIsCheckingAuth(false);
        setIsAuthenticated(true); // Allow access to public routes
        return;
      }
      
      try {
        // Try different API endpoints to see which one works
        let response = null;
        const endpointsToTry = ['/api/user'];
        
        for (const endpoint of endpointsToTry) {
          try {
            const tempResponse = await fetch(endpoint);
            
            // If we get a non-404 response, use it
            if (tempResponse.status !== 404) {
              response = tempResponse;
              break;
            }
          } catch (err) {
            console.error(`Error with user endpoint ${endpoint}:`, err);
          }
        }
        
        if (!response || response.status === 401) {
          // User is not authenticated, redirect to login instead of App Manager
          console.log("User not authenticated, redirecting to login");
          setIsAuthenticated(false);
          router.push('/login');
        } else if (response.ok) {
          // User is authenticated
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        // If there's an error, redirect to login
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router, pathname]);
  
  // Initialize app
  useEffect(() => {
    // Mark app as ready with a slight delay for smoother animation
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // If still checking auth, show loading
  if (isCheckingAuth) {
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
    // FIXED: Keep original classes and structure
    <div className={`generator-page ${appReady ? 'app-loading' : 'opacity-0'}`}>
      <OfflineIndicator />
      
      <Suspense fallback={<div className="text-center p-4">Loading form...</div>}>
        <GenerateFormWithParams />
      </Suspense>
    </div>
  );
}