// src/app/login/page.tsx - Fixed with authentication check and auto-redirect
'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

// Get registration URL safely
const getRegistrationUrl = () => {
  try {
    const { getAppManagerRegistrationUrl } = require('../../lib/appManagerUtils');
    return getAppManagerRegistrationUrl();
  } catch (error) {
    console.warn('Registration URL not configured:', error);
    return '/register'; // Fallback URL
  }
};

// Loading fallback for Suspense
function LoginLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 overflow-hidden">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
}

// Login form component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true); // NEW: Auth check loading state
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/';
  
  const { refreshAuth } = useAuth();
  
  // NEW: Check if user is already authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('Login page: Checking if user is already authenticated...');
        const response = await fetch('/api/user');
        
        if (response.ok) {
          // User is already authenticated, redirect them
          const userData = await response.json();
          console.log('Login page: User already authenticated:', userData.email, 'redirecting to:', redirectPath);
          router.replace(redirectPath);
          return;
        } else if (response.status === 401) {
          setCheckingAuth(false);
          return;
        } else {
          console.log('Login page: Unexpected status:', response.status);
        }
        
        // User is not authenticated (401), show login form
        setCheckingAuth(false);
      } catch (error: unknown) {
        // On error, show login form (safer fallback)
        console.error('Login page: Error checking authentication:', error);
        setCheckingAuth(false);
      }
    };
    
    // Always check authentication immediately
    checkAuthentication();
  }, []); // Remove router and redirectPath dependencies to prevent loops
  
  useEffect(() => {
    // Only run these effects if we're not checking auth
    if (checkingAuth) return;
    
    // Set page attribute and lock scrolling
    document.body.setAttribute('data-page', 'login');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Check for messages from URL params
    const message = searchParams?.get('message');
    if (message === 'account-deleted') {
      setMessage('Your account has been successfully deactivated.');
    }
    
    // Check for registration success message from app manager
    try {
      const registrationSuccess = sessionStorage.getItem('registrationSuccess');
      if (registrationSuccess) {
        const data = JSON.parse(registrationSuccess);
        setMessage(`Registration successful! Welcome ${data.email}. You can now log in with your credentials.`);
        sessionStorage.removeItem('registrationSuccess');
      }
    } catch (err) {
      // Ignore sessionStorage errors
    }
    
    return () => {
      // Cleanup: restore scrolling and remove attributes
      document.body.removeAttribute('data-page');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [searchParams, checkingAuth]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/dynamo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });
      
      if (response.ok) {
        await refreshAuth();
        router.push(redirectPath);
        return;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid credentials');
      }
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Show loading spinner while checking authentication
  if (checkingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 overflow-hidden">
      <div className="w-full max-w-md mx-auto p-6">
        <form 
          onSubmit={handleSubmit} 
          className="bg-white shadow-lg rounded-lg p-6"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}