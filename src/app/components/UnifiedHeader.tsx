// src/app/components/UnifiedHeader.tsx - Updated for /catalog route
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useGeneration } from '../context/GenerationContext';

export default function UnifiedHeader() {
  const { user, loading, logout } = useAuth();
  const { isAnyGenerationActive } = useGeneration();
  const pathname = usePathname();
  const router = useRouter();
  
  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is privileged for bulk generation and catalog access
  const isPrivilegedUser = user?.isSuperUser || false;

  // Handle navigation click when generation is active
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (isAnyGenerationActive()) {
      e.preventDefault();
      return;
    }
  };

  // Handle logout from dropdown
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    // Use a small delay to avoid conflict with button click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Hide header on public catalog page - UPDATED TO CHECK FOR /catalog
  if (pathname === '/catalog') {
    return null;
  }

  // Show basic header on auth pages (including register pages) - NO LINK
  if (pathname === '/login' || pathname === '/signup' || pathname === '/auth' || pathname.startsWith('/register')) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ios-unified-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-16">
              {/* Static logo/text - NO LINK on auth pages */}
              <div className="flex items-center space-x-2 text-xl font-bold text-indigo-600">
                <Image
                    src="/logo.ico"
                    alt="AI Logo Generator Logo"
                    width={64}
                    height={64}
                    className="rounded"
                />
                <span>AI Logo Generator</span>
              </div>
            </div>
          </div>
        </header>
    );
  }

  if (loading) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ios-unified-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2 text-xl font-bold text-indigo-600">
                <Image
                    src="/logo.ico"
                    alt="AI Logo Generator Logo"
                    width={64}
                    height={64}
                    className="rounded"
                />
                <span className="hidden sm:inline">AI Logo Generator</span>
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </header>
    );
  }

  // Main header with navigation - only show for logged in users
  if (user) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ios-unified-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Desktop Layout */}
            <div className="hidden md:flex justify-between items-center h-16">
              {/* Logo and Logos Count - Left side */}
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-indigo-600">
                  <Image
                    src="/logo.ico"
                    alt="AI Logo Generator Logo"
                    width={64}
                    height={64}
                    className="rounded"
                  />
                  <span>AI Logo Generator</span>
                </Link>
              </div>

              {/* Desktop Navigation - Center */}
              <nav className={`flex items-center ${isPrivilegedUser ? 'space-x-6' : 'space-x-8'}`}>
                <Link
                    href="/"
                    className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                        pathname === '/'
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Generate
                </Link>
                {isPrivilegedUser && (
                    <Link
                        href="/bulk-generate"
                        className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                            pathname === '/bulk-generate'
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/bulk-generate')}
                        style={{
                          opacity: isAnyGenerationActive() ? 0.5 : 1,
                          cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                        }}
                    >
                      Bulk Generate
                    </Link>
                )}
                {isPrivilegedUser && (
                    <Link
                        href="/admin-catalog"
                        className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                            pathname === '/admin-catalog'
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/admin-catalog')}
                        style={{
                          opacity: isAnyGenerationActive() ? 0.5 : 1,
                          cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                        }}
                    >
                      Catalog
                    </Link>
                )}
                <Link
                    href="/history"
                    className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                        pathname === '/history'
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/history')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  History
                </Link>
                <Link
                    href="/dashboard"
                    className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                        pathname === '/dashboard'
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/dashboard')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Dashboard
                </Link>
                <Link
                    href="/purchase"
                    className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                        pathname === '/purchase'
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/purchase')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Purchase
                </Link>
              </nav>

              {/* Desktop User Dropdown - Right side */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="mr-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    <span className="font-medium">{user.logosLimit - user.logosCreated || 0}</span>
                  </div>
                  <span className="mr-1">{user.email.split('@')[0]}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Desktop Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      {user.email}
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="flex md:hidden justify-between items-center h-16">
              {/* Logo - Left */}
              <Link href="/" className="flex items-center text-indigo-600">
                <Image
                  src="/logo.ico"
                  alt="AI Logo Generator Logo"
                  width={40}
                  height={40}
                  className="rounded"
                />
              </Link>

              {/* Mobile Navigation - Center */}
              <nav className="flex items-center space-x-2">
                <Link
                    href="/"
                    className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                        pathname === '/'
                            ? 'text-white bg-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Generate
                </Link>
                {isPrivilegedUser && (
                    <Link
                        href="/bulk-generate"
                        className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                            pathname === '/bulk-generate'
                                ? 'text-white bg-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/bulk-generate')}
                        style={{
                          opacity: isAnyGenerationActive() ? 0.5 : 1,
                          cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                        }}
                    >
                      Bulk
                    </Link>
                )}
                {isPrivilegedUser && (
                    <Link
                        href="/admin-catalog"
                        className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                            pathname === '/admin-catalog'
                                ? 'text-white bg-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/admin-catalog')}
                        style={{
                          opacity: isAnyGenerationActive() ? 0.5 : 1,
                          cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                        }}
                    >
                      Catalog
                    </Link>
                )}
                <Link
                    href="/history"
                    className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                        pathname === '/history'
                            ? 'text-white bg-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/history')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  History
                </Link>
                <Link
                    href="/dashboard"
                    className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                        pathname === '/dashboard'
                            ? 'text-white bg-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/dashboard')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Account
                </Link>
              </nav>

              {/* User info - Right */}
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <span className="font-medium">{user.logosLimit - user.logosCreated || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </header>
    );
  }

  // Return null if no user (shouldn't happen but just in case)
  return null;
}