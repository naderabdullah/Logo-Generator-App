// src/app/page.tsx (UPDATED - Redirect to App Manager Registration)
'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import GenerateForm from './components/GenerateForm';
import LoadingSpinner from './components/LoadingSpinner';
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
      <GenerateForm
        key="generate-form"
        setLoading={handleSetLoading}
        setImageDataUri={handleSetImageDataUri}
        setError={handleSetError}
      />
      
      {/* Remove the spinner */}
      {/* {loading && <LoadingSpinner />} */}

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
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Function to redirect to App Manager registration
  const handleRedirectToRegistration = () => {
    redirectToAppManagerRegistration(router);
  };
  
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
  
  // Check auth status and redirect to auth page if not authenticated
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
            console.log(`Trying user endpoint: ${endpoint}`);
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
          // User is not authenticated, redirect to App Manager registration
          console.log("User not authenticated, redirecting to App Manager registration");
          setIsAuthenticated(false);
          handleRedirectToRegistration();
        } else if (response.ok) {
          // User is authenticated
          console.log("User is authenticated");
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        // If there's an error, redirect to App Manager registration
        setIsAuthenticated(false);
        handleRedirectToRegistration();
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router, pathname]); // Added pathname as dependency
  
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

  // If still checking auth, show loading
  if (isCheckingAuth) {
    return (
      <div className="container mx-auto px-4 pt-6 pb-0 max-w-4xl">
        <div className="text-center my-8">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 pt-0 pb-0 max-w-4xl generator-page ${appReady ? 'app-loading' : 'opacity-0'}`}>
      <OfflineIndicator />
      {/* <InstallBanner /> */}
      
      <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
        <GenerateFormWithParams />
      </Suspense>
    </div>
  );
}