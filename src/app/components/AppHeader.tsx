// src/app/components/AppHeader.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppHeader() {
  const pathname = usePathname();
  
  // If we're on login or signup pages, don't show this header
  if (pathname === '/login' || pathname === '/signup' || pathname === '/auth') {
    return null;
  }
  
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <nav className="flex -mb-px space-x-8">
            <Link 
              href="/" 
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                pathname === '/' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generator
            </Link>
            <Link 
              href="/history" 
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                pathname === '/history' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}