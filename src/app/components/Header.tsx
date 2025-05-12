'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isInstalled, setIsInstalled] = useState(false);
  const pathname = usePathname();
  
  // Determine active tab based on pathname
  const isGeneratorActive = pathname === '/' || pathname === '/generator';
  const isHistoryActive = pathname === '/history';
  
  useEffect(() => {
    // Check if the app is running in standalone mode (installed)
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true);
                  
    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 pt-3">
        <div className="flex items-center justify-between mb-2">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="relative w-10 h-10">
              <Image 
                src="/icons/smartyapps.png" 
                alt="Smarty Apps Logo" 
                width={40} 
                height={40}
                className="rounded-lg shadow-sm"
              />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-indigo-500 leading-tight">
                AI Logo Generator
              </h1>
              {isInstalled && (
                <div className="text-xs text-indigo-600">
                  ✓ App installed
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <Link 
            href="/" 
            className={`text-center flex-1 tab-btn ${isGeneratorActive ? 'active' : ''}`}
          >
            Generator
          </Link>
          <Link 
            href="/history" 
            className={`text-center flex-1 tab-btn ${isHistoryActive ? 'active' : ''}`}
          >
            History
          </Link>
        </div>
      </div>
    </header>
  );
}