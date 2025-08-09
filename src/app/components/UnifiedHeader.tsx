// src/app/components/UnifiedHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function UnifiedHeader() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
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
              <span>AI Logo Generator!!!</span>
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
                src="/favicon.ico" 
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
                src="/icons/smartyapps.png" 
                alt="Smarty Apps Logo" 
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout - Stacked */}
        <div className="md:hidden">
          {/* Top row - Logo and User Info */}
          <div className="flex items-center justify-between h-12 pt-2">
            <Link href="/" className="flex items-center space-x-2 text-lg font-bold text-indigo-600">
              <Image 
                src="/logo.ico" 
                alt="AI Logo Generator Logo" 
                width={48} 
                height={48}
                className="rounded"
              />
              <span>AI Logo Generator</span>
            </Link>
            <div className="flex items-center text-xs font-medium text-gray-700">
              <div className="mr-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                <span className="font-medium">{user.logosCreated || 0}</span>/<span className="font-medium">{user.logosLimit || 0}</span>
              </div>
              <span className="hidden xs:inline">{user.email.split('@')[0]}</span>
            </div>
          </div>
          
          {/* Bottom row - Navigation */}
          <nav className="flex justify-center pb-2">
            <div className="flex space-x-6">
              <Link 
                href="/history" 
                className={`py-1 text-sm font-medium ${
                  pathname === '/history' 
                    ? 'text-indigo-600' 
                    : 'text-gray-500'
                }`}
              >
                History
              </Link>
              <Link 
                href="/" 
                className={`py-1 text-sm font-medium ${
                  pathname === '/' 
                    ? 'text-indigo-600' 
                    : 'text-gray-500'
                }`}
              >
                Generator
              </Link>
              <Link 
                href="/account" 
                className={`py-1 text-sm font-medium ${
                  pathname === '/account' 
                    ? 'text-indigo-600' 
                    : 'text-gray-500'
                }`}
              >
                Account
              </Link>
              <Link 
                href="/purchase" 
                className={`py-1 text-sm font-medium ${
                  pathname === '/purchase' 
                    ? 'text-indigo-600' 
                    : 'text-gray-500'
                }`}
              >
                Purchase
              </Link>
            </div>
          </nav>
        </div>
        
        {/* Desktop Layout - Original */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo - Left side */}
          <div className="flex-shrink-0">
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
          
          {/* Navigation - Center */}
          <nav className="flex absolute left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-8">
              <Link 
                href="/history" 
                className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                  pathname === '/history' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History
              </Link>
              <Link 
                href="/" 
                className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                  pathname === '/' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Generator
              </Link>
              <Link 
                href="/account" 
                className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                  pathname === '/account' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account
              </Link>
              <Link 
                href="/purchase" 
                className={`py-4 px-1 border-b-2 text-sm font-medium inline-flex items-center ${
                  pathname === '/purchase' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Purchase
              </Link>
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