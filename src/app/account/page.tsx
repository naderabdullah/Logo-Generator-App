'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login?redirect=/account');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUserData(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);
  
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Redirect to login page
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your account information...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <Link 
              href="/login" 
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">My Account</h1>
          <p className="mt-2 text-gray-600">Manage your logo generator account</p>
        </div>
        
        {userData && (
          <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-indigo-800 mb-2">User Information</h2>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{userData.email}</span>
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Logo Usage</h2>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-600">Logos Created:</span>
                  <span className="font-medium">{userData.logosCreated}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Logo Limit:</span>
                  <span className="font-medium">{userData.logosLimit}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium">{userData.remainingLogos}</span>
                </p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (userData.logosCreated / userData.logosLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Link 
                href="/history" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-center hover:bg-indigo-700"
              >
                View My Logos
              </Link>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}