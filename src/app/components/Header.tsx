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
    <header className="fixed-header">
      <div className="header-content">
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
            aria-current={isGeneratorActive ? 'page' : undefined}
          >
            <span>Generator</span>
          </Link>
          <Link 
            href="/history" 
            className={`text-center flex-1 tab-btn ${isHistoryActive ? 'active' : ''}`}
            aria-current={isHistoryActive ? 'page' : undefined}
          >
            <span>History</span>
          </Link>
        </div>
      </div>
    </header>
  );
}