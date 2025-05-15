'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthHeader() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        
        if (response.status === 401) {
          setUser(null);
          return;
        }
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
                Logo Generator
              </Link>
            </div>
            <nav className="ml-6 flex space-x-4 sm:space-x-8">
              <Link 
                href="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/' 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Generator
              </Link>
              <Link 
                href="/history" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/history' 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                History
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{user.logosCreated}</span> / <span className="font-medium">{user.logosLimit}</span> logos
                </div>
                
                <Link
                  href="/account"
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                    pathname === '/account' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {user.email.split('@')[0]}
                </Link>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}