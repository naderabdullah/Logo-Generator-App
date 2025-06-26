// src/app/login/page.tsx (Updated)
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { appManagerApiService } from '../../lib/apiService';
import { APP_ID } from '../../lib/appManagerConfig';

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
      
      // If existing API fails, try app manager API
      console.log('Existing API failed, trying app manager API');
      
      try {
        if (!APP_ID) {
          throw new Error('App ID not configured');
        }
        
        const appManagerResponse = await appManagerApiService.login(APP_ID, email, password);
        
        if (appManagerResponse.token) {
          console.log('Login successful with app manager API');
          
          // Store the token (you might need to create a cookie or integrate with your existing auth)
          // For now, we'll try to create a session similar to your existing system
          
          // Create a login request to your existing system using the app manager token
          // This might require creating a new API endpoint that accepts app manager tokens
          const integrationResponse = await fetch('/api/auth/app-manager-login', {
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
          
          if (integrationResponse.ok) {
            // Refresh auth context to get user data
            await refreshAuth();
            
            // Redirect to the desired page
            router.push(redirectPath);
            return;
          } else {
            throw new Error('Failed to integrate app manager login with existing system');
          }
        }
      } catch (appManagerError) {
        console.error('App manager login failed:', appManagerError);
        // Fall through to show login error
      }
      
      // If both methods fail, show error
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Invalid email or password');
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Sign In
        </h1>

        {/* Success message from registration */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}