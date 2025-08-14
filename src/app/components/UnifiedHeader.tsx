// src/app/components/UnifiedHeader.tsx - UPDATED with generation state handling
'use client';

import { useState } from 'react';
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

  // Check if user is privileged for bulk generation and catalog access
  const isPrivilegedUser = user?.isSuperUser || false;

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

  // Handle navigation click when generation is active
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (isAnyGenerationActive()) {
      e.preventDefault();
      return;
    }
    // Allow normal navigation if not generating
  };

  // Create disabled link component that prevents navigation during generation
  const NavigationLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => {
    const isDisabled = isAnyGenerationActive();
    
    if (isDisabled) {
      return (
        <span className={`${className} cursor-not-allowed opacity-50`}>
          {children}
        </span>
      );
    }
    
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  };

  return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ios-unified-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand - Left side */}
            <NavigationLink 
              href="/" 
              className="flex items-center space-x-2 text-xl font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Image
                  src="/logo.ico"
                  alt="AI Logo Generator Logo"
                  width={64}
                  height={64}
                  className="rounded"
              />
              <span>AI Logo Generator</span>
            </NavigationLink>

            {/* Navigation - Center */}
            <nav className="hidden md:flex space-x-8">
              <NavigationLink
                  href="/"
                  className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                      pathname === '/'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Generate
              </NavigationLink>
              {isPrivilegedUser && (
                  <NavigationLink
                      href="/bulk-generate"
                      className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                          pathname === '/bulk-generate'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Bulk Generate
                  </NavigationLink>
              )}
              <NavigationLink
                  href="/history"
                  className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                      pathname === '/history'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                History
              </NavigationLink>
              {isPrivilegedUser && (
                  <NavigationLink
                      href="/catalog"
                      className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                          pathname === '/catalog'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Catalog
                  </NavigationLink>
              )}
              <div className="flex space-x-8">
                <NavigationLink
                    href="/account"
                    className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                        pathname === '/account'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Account
                </NavigationLink>
                <NavigationLink
                    href="/purchase"
                    className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                        pathname === '/purchase'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Purchase
                </NavigationLink>
              </div>
            </nav>

            {/* User Info - Right side */}
            <div className="flex items-center text-sm font-medium text-gray-700">
              <div className="mr-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                <span className="font-medium">{user.logosCreated || 0}</span>/<span className="font-medium">{user.logosLimit || 0}</span>
              </div>
              <span>{user.email.split('@')[0]}</span>
            </div>
          </div>
        </div>
      </header>
  );
}