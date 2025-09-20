// src/app/components/UnifiedHeader.tsx - Updated with Business Card Admin tab
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
      console.log('🚪 Logging out user');
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('❌ Logout failed:', err);
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
  }, []);

  if (loading) {
    return (
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="animate-pulse bg-gray-300 h-8 w-32 rounded"></div>
              </div>
            </div>
          </div>
        </header>
    );
  }

  return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16">
            {/* Logo and Primary Navigation */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <Image
                    src="/smallLogo.ico"
                    alt="Logo"
                    width={32}
                    height={32}
                    priority
                    className="h-8 w-8"
                />
                <span className="ml-2 text-xl font-bold text-gray-900">Logo Generator</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:ml-8 md:flex md:space-x-1">
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

                {/* UPDATED: Admin Business Cards tab for privileged users */}
                {isPrivilegedUser && (
                    <Link
                        href="/admin-business-cards"
                        className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                            pathname === '/admin-business-cards'
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/admin-business-cards')}
                        style={{
                          opacity: isAnyGenerationActive() ? 0.5 : 1,
                          cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                        }}
                        title="View business card layout catalog"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                      </svg>
                      Business Cards
                    </Link>
                )}

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

                {/* Template Parser - Currently disabled */}
                {(isPrivilegedUser && false) && (
                    <Link
                        href="/admin-template-parser"
                        className={`py-4 px-3 border-b-4 text-sm font-medium inline-flex items-center transition-all duration-200 ${
                            pathname === '/admin-template-parser'
                                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={(e) => handleNavClick(e, '/admin-template-parser')}
                        style={{
                          opacity: isAnyGenerationActive() ? 0.5 : 1,
                          cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                        }}
                    >
                      Parser
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
            </div>

            {/* User Account Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md px-3 py-2"
                    >
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                      </div>
                      <span className="hidden sm:block">{user.email}</span>
                      {user.isSuperUser && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Admin
                    </span>
                      )}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                          <div className="py-1">
                            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                              <div className="font-medium">Signed in as</div>
                              <div className="text-gray-900">{user.email}</div>
                              {user.isSuperUser && (
                                  <div className="mt-1">
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              Administrator
                            </span>
                                  </div>
                              )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                    )}
                  </div>
              ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                        href="/login"
                        className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Sign Up
                    </Link>
                  </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation - Compact Version */}
          {user && (
              <div className="md:hidden border-t border-gray-200 px-4 py-2">
                <div className="flex flex-wrap gap-2">
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

                  {/* UPDATED: Mobile Business Cards link for admin users */}
                  {isPrivilegedUser && (
                      <Link
                          href="/admin-business-cards"
                          className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                              pathname === '/admin-business-cards'
                                  ? 'text-white bg-indigo-600 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={(e) => handleNavClick(e, '/admin-business-cards')}
                          style={{
                            opacity: isAnyGenerationActive() ? 0.5 : 1,
                            cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                          }}
                      >
                        Cards
                      </Link>
                  )}

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

                  {/* Template Parser - Currently disabled */}
                  {(isPrivilegedUser && false) && (
                      <Link
                          href="/admin-template-parser"
                          className={`py-1 px-2 text-xs font-medium rounded transition-all duration-200 ${
                              pathname === '/admin-template-parser'
                                  ? 'text-white bg-indigo-600 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={(e) => handleNavClick(e, '/admin-template-parser')}
                          style={{
                            opacity: isAnyGenerationActive() ? 0.5 : 1,
                            cursor: isAnyGenerationActive() ? 'not-allowed' : 'pointer'
                          }}
                      >
                        Parser
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
                    Dashboard
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
              </div>
          )}
        </div>
      </header>
  );
}