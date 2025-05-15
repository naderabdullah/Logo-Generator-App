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
      <div className="flex justify-center py-4">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          AI Logo Generator
        </Link>
        <div className="ml-4 w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex justify-center py-4">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          AI Logo Generator
        </Link>
      </div>
    );
  }
  
  return (
    <>
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile and desktop header with the same button for consistency */}
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              AI Logo Generator
            </Link>
            
            <button
              onClick={() => setMenuOpen(true)}
              className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 mobile-menu-button"
            >
              <div className="mr-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                <span className="font-medium">{user.logosCreated || 0}</span>/<span className="font-medium">{user.logosLimit || 0}</span>
              </div>
              {user.email.split('@')[0]}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Full-screen menu for both mobile and desktop */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
          {/* Menu with improved layout for tall phones */}
          <div className="bg-white flex flex-col h-full">
            {/* Header Section */}
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
              </div>
            </div>
            
            {/* User Info Section */}
            <div className="p-4 border-b">
              <p className="text-sm text-gray-500">Logged in as</p>
              <p className="font-medium">{user.email}</p>
            </div>
            
            {/* Logo Usage Section */}
            <div className="p-4 border-b">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-700">Logo Usage</p>
                <p className="text-xl font-bold text-indigo-800">
                  {user.logosCreated || 0} <span className="text-sm font-normal text-indigo-600">of</span> {user.logosLimit || 0}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, ((user.logosCreated || 0) / (user.logosLimit || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Spacer to push buttons to the bottom */}
            <div className="flex-grow"></div>
            
            {/* Navigation Buttons - At the bottom for better reachability */}
            <div className="divide-y">
              <button 
                onClick={handleAccountClick}
                className="w-full p-4 text-left flex items-center hover:bg-gray-50 active:bg-gray-100 mobile-menu-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Settings
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full p-4 text-left flex items-center text-red-600 hover:bg-gray-50 active:bg-gray-100 mobile-menu-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
            
            {/* Additional close button for easy access on tall phones */}
            <div className="p-4 border-t">
              <button 
                onClick={() => setMenuOpen(false)}
                className="w-full py-4 text-center bg-gray-100 rounded-lg text-gray-700 font-medium"
              >
                Close Menu
              </button>
            </div>
            
            {/* Safe area spacing for notched phones */}
            <div className="h-safe-bottom"></div>
          </div>
        </div>
      )}
    </>
  );
}