// src/app/components/AuthHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function AuthHeader() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  
  const handleLogout = async () => {
    console.log("Logout button clicked");
    
    try {
      // Use the logout function from AuthContext
      await logout();
      
      // Close the menu before navigating
      setMenuOpen(false);
      
      // Navigate to auth page
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still redirect even if error
      router.push('/auth');
    }
  };
  
  // Handle navigation to account page
  const handleAccountClick = () => {
    setMenuOpen(false);
    router.push('/account');
  };
  
  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm py-4 border-b border-gray-200">
        <div className="flex justify-center">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            AI Logo Generator
          </Link>
          <div className="ml-4 w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm py-4 border-b border-gray-200">
        <div className="flex justify-center">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            AI Logo Generator
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ios-auth-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile and desktop header with the same button for consistency */}
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              AI Logo Generator
            </Link>
            
            <div className="inline-flex items-center text-sm font-medium text-gray-700">
              <div className="mr-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                <span className="font-medium">{user.logosCreated || 0}</span>/<span className="font-medium">{user.logosLimit || 0}</span>
              </div>
              {user.email.split('@')[0]}
            </div>
          </div>
        </div>
      </header>
      
      {/* Full-screen menu removed since there's no button to open it anymore */}
    </>
  );
}