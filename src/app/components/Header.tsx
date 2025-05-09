'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Header() {
  const [isInstalled, setIsInstalled] = useState(false);
  
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
    <header className="text-center mb-4 sm:mb-8 pt-4">
      <div className="relative mx-auto w-16 h-16 mb-3">
        <Image 
          src="/icons/smartyapps.png" 
          alt="Smarty Apps Logo" 
          width={64} 
          height={64}
          className="rounded-lg shadow-sm"
        />
      </div>
      <h1 className="text-2xl sm:text-4xl font-bold text-indigo-500 mb-2">
        AI Logo Generator
      </h1>
      <p className="text-gray-600 text-sm sm:text-base px-4">
        Create professional logos by selecting style options
      </p>
      {isInstalled && (
        <div className="text-xs text-indigo-600 mt-1">
          ✓ App installed on your device
        </div>
      )}
    </header>
  );
}