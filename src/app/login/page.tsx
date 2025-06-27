// src/app/login/page.tsx (Updated with App Manager Registration Link)
'use client';

export const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { appManagerApiService } from '../../lib/apiService';
import { APP_ID } from '../../lib/appManagerConfig';
import { getAppManagerRegistrationUrl } from '../../lib/appManagerUtils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  
  // Get refreshAuth from auth context
  const { refreshAuth } = useAuth();
  
  // Set body data attribute for styling
  useEffect(() => {
    document.body.setAttribute('data-page', 'login');
    
    // Check for registration success message from app manager
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
      const data = JSON.parse(registrationSuccess);
      setMessage(`Registration successful! Welcome ${data.email}. You can now log in with your credentials.`);
      sessionStorage.removeItem('registrationSuccess');
    }
    
    // Clean up function to remove the attribute when component unmounts
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First try the existing login API
      let response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        console.log('Login successful with existing API');
        
        // Refresh auth context to get user data
        await refreshAuth();
        
        // Redirect to the desired page
        router.push(redirectPath);
        return;
      }
      
      // If existing API fails, try App Manager login
      if (response.status === 401 || response.status === 404) {
        console.log('Trying App Manager login...');
        
        try {
          const appManagerResponse = await appManagerApiService.login(APP_ID, email, password);
          
          if (appManagerResponse.token) {
            console.log('App Manager login successful');
            
            // Send the app manager data to our backend for processing
            const localResponse = await fetch('/api/auth/app-manager-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                appManagerToken: appManagerResponse.token,
                appManagerData: appManagerResponse
              }),
            });
            
            if (localResponse.ok) {
              console.log('Local auth processing successful');
              
              // Refresh auth context to get user data
              await refreshAuth();
              
              // Redirect to the desired page
              router.push(redirectPath);
              return;
            } else {
              const localData = await localResponse.json();
              throw new Error(localData.error || 'Authentication processing failed');
            }
          }
        } catch (appManagerError: any) {
          console.error('App Manager login failed:', appManagerError);
          throw new Error(appManagerError.message || 'Login failed');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
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
        </div>
        
        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            </div>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
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
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href={getAppManagerRegistrationUrl()}
                className="text-blue-500 hover:text-blue-700 underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}