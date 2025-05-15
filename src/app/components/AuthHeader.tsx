// src/app/components/AuthHeader.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthHeader() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        // Try different API endpoints to see which one works
        let response = null;
        const endpointsToTry = ['/user', '/api/user', '/auth/user'];
        let foundEndpoint = '';
        
        for (const endpoint of endpointsToTry) {
          try {
            console.log(`AuthHeader trying user endpoint: ${endpoint}`);
            const tempResponse = await fetch(endpoint);
            
            // If we get a non-404 response, use it
            if (tempResponse.status !== 404) {
              response = tempResponse;
              foundEndpoint = endpoint;
              break;
            }
          } catch (err) {
            console.error(`Error with user endpoint ${endpoint}:`, err);
          }
        }
        
        console.log(`AuthHeader using endpoint: ${foundEndpoint} with status: ${response?.status}`);
        
        if (!response || response.status === 401) {
          console.log("AuthHeader: User not authenticated");
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          console.log("AuthHeader: User authenticated");
          const userData = await response.json();
          setUser(userData);
        } else {
          console.log("AuthHeader: User response not OK:", response.status);
          setUser(null);
        }
      } catch (err) {
        console.error('AuthHeader: Error checking auth status:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleLogout = async () => {
    try {
      // Try different API endpoints for logout
      const endpointsToTry = ['/auth/logout', '/api/auth/logout', '/logout'];
      let logoutSuccessful = false;
      let foundEndpoint = '';
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`Trying logout endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'POST',
          });
          
          // If we get a successful response, mark logout as successful
          if (response.ok) {
            logoutSuccessful = true;
            foundEndpoint = endpoint;
            break;
          }
        } catch (err) {
          console.error(`Error with logout endpoint ${endpoint}:`, err);
        }
      }
      
      console.log(`Using logout endpoint: ${foundEndpoint}, success: ${logoutSuccessful}`);
      
      // Even if API call fails, we can still clear user state and redirect
      setUser(null);
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still clear user state and redirect even if error
      setUser(null);
      router.push('/auth');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          AI Logo Generator
        </Link>
        <div className="ml-4 w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex justify-center py-4">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          AI Logo Generator
        </Link>
      </div>
    );
  }
  
  return (
    <header className="bg-white shadow-sm py-4 mobile-auth-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* For mobile: Centered layout with stack */}
        <div className="flex flex-col items-center sm:hidden">
          <Link href="/" className="text-xl font-bold text-indigo-600 mb-2">
            AI Logo Generator
          </Link>
          
          <div className="flex items-center space-x-4 relative" ref={menuRef}>
            <div className="text-sm text-gray-500 logo-count-badge">
              <span className="font-medium">{user.logosCreated || 0}</span> / <span className="font-medium">{user.logosLimit || 0}</span> logos
            </div>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {user.email.split('@')[0]}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {menuOpen && (
              <div className="absolute header-user-menu w-48 bg-white rounded-md shadow-lg py-1 z-10 top-full">
                <Link 
                  href="/account" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* For desktop: Regular side-by-side layout */}
        <div className="hidden sm:flex sm:justify-between sm:items-center">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            AI Logo Generator
          </Link>
          
          <div className="flex items-center">
            <div className="flex items-center space-x-4 relative" ref={menuRef}>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{user.logosCreated || 0}</span> / <span className="font-medium">{user.logosLimit || 0}</span> logos
              </div>
              
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {user.email.split('@')[0]}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 top-full">
                  <Link 
                    href="/account" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}