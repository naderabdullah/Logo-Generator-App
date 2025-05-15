// Update src/app/auth/page.tsx

'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AuthLanding() {
  // Set the data-page attribute on the body for targeting with CSS
  useEffect(() => {
    document.body.setAttribute('data-page', 'auth');
    
    // Clean up function to remove the attribute when component unmounts
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  return (
    <div className="auth-page-container">
      <div className="auth-content">
        <div className="text-center">
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Get Started</h2>
          <p className="mt-2 text-gray-600">Create professional logos with AI</p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link 
            href="/login" 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            Log in to your account
          </Link>
          
          <Link 
            href="/signup" 
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
}