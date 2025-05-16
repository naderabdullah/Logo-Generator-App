'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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

  // Function to handle Stripe checkout
  const handlePurchase = async (quantity: number, price: number) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          priceUsd: price,
          email: userData?.email
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to initiate checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for payment success query param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('payment');
    const quantity = urlParams.get('quantity');
    
    if (success === 'success' && quantity) {
      setSuccessMessage(`Successfully purchased ${quantity} logo credit${Number(quantity) > 1 ? 's' : ''}!`);
      
      // Clear URL parameters after 5 seconds
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setSuccessMessage(null);
        
        // Refresh user data to show updated limits
        fetchUserData();
      }, 5000);
    }
    
    async function fetchUserData() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    }
  }, []);
  
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
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">My Account</h1>
          <p className="mt-2 text-gray-600">Manage your logo generator account</p>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 p-4 rounded-lg mb-6 text-center">
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}
        
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
            
            {/* Pricing Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Purchase Logo Credits</h2>
                <p className="text-sm text-gray-600 mt-1">Unlock more logo generations with our flexible pricing</p>
              </div>
              
              <div className="divide-y">
                {/* 1 Logo Option */}
                <div className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">1 Logo Credit</h3>
                      <p className="text-sm text-gray-500">Generate one professional logo</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-indigo-600">$4.95</p>
                      <button
                        onClick={() => handlePurchase(1, 4.95)}
                        disabled={isProcessing}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 3 Logo Option */}
                <div className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">3 Logo Credits</h3>
                      <p className="text-sm text-gray-500">Generate three professional logos</p>
                      <p className="text-xs text-green-600 mt-1">Save $4.90</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-indigo-600">$9.95</p>
                      <button
                        onClick={() => handlePurchase(3, 9.95)}
                        disabled={isProcessing}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 6 Logo Option */}
                <div className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">6 Logo Credits</h3>
                      <p className="text-sm text-gray-500">Generate six professional logos</p>
                      <p className="text-xs text-green-600 mt-1">Save $14.75</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-indigo-600">$14.95</p>
                      <button
                        onClick={() => handlePurchase(6, 14.95)}
                        disabled={isProcessing}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 9 Logo Option - Best Value */}
                <div className="p-4 bg-indigo-50 hover:bg-indigo-100 transition relative">
                  <div className="absolute -top-1 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-b">
                    Best Value
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">9 Logo Credits</h3>
                      <p className="text-sm text-gray-600">Generate nine professional logos</p>
                      <p className="text-xs text-green-600 mt-1">Save $24.60</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-indigo-600">$19.95</p>
                      <button
                        onClick={() => handlePurchase(9, 19.95)}
                        disabled={isProcessing}
                        className="mt-2 px-4 py-2 bg-indigo-700 text-white text-sm rounded hover:bg-indigo-800 transition disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 text-xs text-gray-500 bg-gray-50 rounded-b-lg">
                Secure payment processing by Stripe. Your logo credits will be immediately available after purchase.
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