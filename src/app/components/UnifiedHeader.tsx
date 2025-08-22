// src/app/components/UnifiedHeader.tsx - Added username dropdown with logout
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (pathname === '/public-catalog') {
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
                <span>AI Logo Generator</span>
              </div>
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
            </div>
          </div>
        </header>
    );
  }

  if (!user) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ios-unified-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-16">
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

  return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ios-unified-header">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Mobile Layout - Stacked */}
          <div className="md:hidden">
            {/* Top row - Logo and User Info */}
            <div className="flex items-center justify-between h-12 pt-2">
              <Link 
                href="/" 
                className="flex items-center space-x-1 text-base font-bold text-indigo-600"
                onClick={(e) => handleNavClick(e, '/')}
                style={{
                  opacity: isAnyGenerationActive() ? 0.5 : 1,
                  cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                }}
              >
                <Image
                    src="/logo.ico"
                    alt="AI Logo Generator Logo"
                    width={32}
                    height={32}
                    className="rounded"
                />
                <span className="text-sm">AI Logo Generator</span>
              </Link>
              
              {/* Mobile User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="mr-1 text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-[10px]">
                    <span className="font-medium">{user.logosCreated || 0}</span>/<span className="font-medium">{user.logosLimit || 0}</span>
                  </div>
                  <span className="text-xs hidden xs:inline mr-1">{user.email.split('@')[0]}</span>
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Mobile Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {user.email}
                    </div>
                    <Link
                      href="/account"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom row - Navigation - FIXED: Better mobile layout */}
            <nav className="flex justify-center pb-1 px-1">
              <div className="flex flex-wrap justify-center gap-1 max-w-full">
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
                        href="/bulk"
                        className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                            pathname === '/bulk'
                                ? 'text-white bg-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/bulk')}
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
                        href="/catalog"
                        className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                            pathname === '/catalog'
                                ? 'text-white bg-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/catalog')}
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
                    href="/account"
                    className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                        pathname === '/account'
                            ? 'text-white bg-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/account')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Account
                </Link>
                <Link
                    href="/purchase"
                    className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                        pathname === '/purchase'
                            ? 'text-white bg-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/purchase')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Purchase
                </Link>
              </div>
            </nav>
          </div>

          {/* Desktop Layout - Single row */}
          <div className="hidden md:flex items-center justify-between h-16">
            {/* Logo - Left side */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-xl font-bold text-indigo-600"
              onClick={(e) => handleNavClick(e, '/')}
              style={{
                opacity: isAnyGenerationActive() ? 0.5 : 1,
                cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
              }}
            >
              <Image
                  src="/logo.ico"
                  alt="AI Logo Generator Logo"
                  width={64}
                  height={64}
                  className="rounded"
              />
              <span>AI Logo Generator</span>
            </Link>

            {/* Navigation - Center */}
            <nav className="flex-1 flex justify-center">
              <div className={`flex ${isPrivilegedUser ? 'space-x-6' : 'space-x-8'}`}>
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
                        href="/bulk"
                        className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                            pathname === '/bulk'
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/bulk')}
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
                        href="/catalog"
                        className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                            pathname === '/catalog'
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/catalog')}
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
                    href="/account"
                    className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                        pathname === '/account'
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleNavClick(e, '/account')}
                    style={{
                      opacity: isAnyGenerationActive() ? 0.5 : 1,
                      cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                    }}
                >
                  Account
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
              </div>
            </nav>

            {/* Desktop User Dropdown - Right side */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="mr-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <span className="font-medium">{user.logosCreated || 0}</span>/<span className="font-medium">{user.logosLimit || 0}</span>
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
        </div>
      </header>
  );
}