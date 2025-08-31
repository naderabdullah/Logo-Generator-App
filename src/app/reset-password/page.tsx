// src/app/reset-password/page.tsx
'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  useEffect(() => {
    // Verify token validity when page loads
    const verifyToken = async () => {
      if (!token || !email) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        setTokenValid(response.ok);
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token, email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to login with success message
        router.push('/login?message=password-reset-success');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking token
  if (tokenValid === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-auto p-6">
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link 
              href="/forgot-password" 
              className="inline-block bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new password"
                required
                disabled={loading}
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirm new password"
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
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center pt-2">
              <Link 
                href="/login" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}