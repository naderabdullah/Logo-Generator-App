// src/app/login/page.tsx - Fixed with locked scrolling and centered component
'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getAppManagerRegistrationUrl } from '../../lib/appManagerUtils';

// Loading fallback for Suspense
function LoginLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 overflow-hidden">
      <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
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
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/';
  
  const { refreshAuth } = useAuth();
  
  useEffect(() => {
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
  }, [searchParams]);
  
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
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 overflow-hidden">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>

          {message && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="text-sm text-green-800">{message}</div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper to fix the Vercel error
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}