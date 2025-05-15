// src/app/auth/page.tsx
'use client';

import Link from 'next/link';

export default function AuthLanding() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600">AI Logo Generator</h1>
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
          
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-indigo-500">
              Continue as guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}