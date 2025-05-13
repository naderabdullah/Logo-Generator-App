'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUserUsage } from '@/app/utils/indexedDBUtils';

export default function Header() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [usage, setUsage] = useState<{ used: number, limit: number } | null>(null);
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
    
    // Get user usage information
    const fetchUsage = async () => {
      try {
        const usageData = await getUserUsage();
        if (usageData) {
          setUsage({
            used: usageData.logosCreated,
            limit: usageData.logosLimit
          });
        }
      } catch (error) {
        console.error('Error fetching usage:', error);
      }
    };
    
    fetchUsage();
    
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
              {usage && usage.used >= usage.limit && (
                <div className="text-xs text-yellow-600">
                  Logo limit reached
                </div>
              )}
            </div>
          </div>
          
          {/* Usage indicator */}
          {usage && (
            <div className="hidden sm:block text-right">
              <div className="text-xs text-gray-600">
                <span className="font-medium">{usage.used}</span> of <span className="font-medium">{usage.limit}</span> logos
              </div>
              <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
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