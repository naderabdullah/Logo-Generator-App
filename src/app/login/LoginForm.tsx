// src/app/login/LoginForm.tsx - FIXED
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getAppManagerRegistrationUrl } from '../../lib/appManagerUtils';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/';
  const message = searchParams?.get('message');
  
  // Get the refreshAuth function from the auth context
  const { refreshAuth } = useAuth();
  
  // Set body data attribute for styling
  useEffect(() => {
    document.body.setAttribute('data-page', 'login');
    
    // Check for messages
    if (message === 'account-deleted') {
      setSuccessMessage('Your account has been successfully deleted.');
    }
    
    // Check for registration success message from app manager
    try {
      const registrationSuccess = sessionStorage.getItem('registrationSuccess');
      if (registrationSuccess) {
        const data = JSON.parse(registrationSuccess);
        setSuccessMessage(`Registration successful! Welcome ${data.email}. You can now log in with your credentials.`);
        sessionStorage.removeItem('registrationSuccess');
      }
    } catch (err) {
      // Ignore sessionStorage errors
      console.log('SessionStorage error (ignored):', err);
    }
    
    // Clean up function to remove the attribute when component unmounts
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, [message]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct DynamoDB login endpoint
      const response = await fetch('/api/auth/dynamo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Refresh auth state to update the UI immediately
      await refreshAuth();
      
      // Redirect to the page they came from or home
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>

        {successMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">{successMessage}</div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* App Manager Registration Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need access?{' '}
              <button
                type="button"
                onClick={() => {
                  try {
                    const registrationUrl = getAppManagerRegistrationUrl();
                    window.open(registrationUrl, '_blank');
                  } catch (err) {
                    console.error('Error getting registration URL:', err);
                    alert('Registration is not available at the moment. Please contact support.');
                  }
                }}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Get App Manager Access
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}