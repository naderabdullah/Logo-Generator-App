// src/app/purchase/PurchaseView.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PurchaseView() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingQuantity, setProcessingQuantity] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login?redirect=/purchase');
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

  // Function to handle Stripe checkout
  const handlePurchase = async (quantity: number, price: number) => {
    try {
      setProcessingQuantity(quantity);
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
      setProcessingQuantity(null);
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
          <p className="mt-4 text-gray-700">Loading pricing information...</p>
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
              href="/" 
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Generator
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Logo Credits</h1>
          <p className="mt-2 text-lg text-gray-600">Unlock more logo generations with our flexible pricing</p>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 p-4 rounded-lg mb-6 text-center max-w-md mx-auto">
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}
        
        {userData && (
          <div className="mb-8">
            {/* Current Usage Card */}
            <div className="bg-indigo-50 p-6 rounded-lg text-center max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-indigo-800 mb-2">Your Current Usage</h2>
              <div className="text-3xl font-bold text-indigo-600">
                {userData.logosCreated || 0} / {userData.logosLimit || 0}
              </div>
              <p className="text-sm text-indigo-600 mt-1">logos created</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, ((userData.logosCreated || 0) / Math.max(1, userData.logosLimit || 1)) * 100)}%` }}
                ></div>
              </div>
              {userData.remainingLogos > 0 ? (
                <p className="text-sm text-indigo-700 mt-2">
                  You have {userData.remainingLogos} logo{userData.remainingLogos > 1 ? 's' : ''} remaining
                </p>
              ) : (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  You've used all your logo credits
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Pricing Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 1 Logo Option */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$4.95</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">1 Logo Credit</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">3 Free Revisions</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">High-quality AI generation</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase(1, 4.95)}
                disabled={processingQuantity !== null}
                className="mt-8 w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {processingQuantity === 1 ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          </div>
          
          {/* 3 Logo Option */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Professional</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$9.95</span>
                <span className="text-sm text-green-600 ml-2">Save $4.90</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">3 Logo Credits</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">9 Free Revisions Total</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">$3.32 per logo</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase(3, 9.95)}
                disabled={processingQuantity !== null}
                className="mt-8 w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {processingQuantity === 3 ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          </div>
          
          {/* 6 Logo Option */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Business</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$14.95</span>
                <span className="text-sm text-green-600 ml-2">Save $14.75</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">6 Logo Credits</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">18 Free Revisions Total</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">$2.49 per logo</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase(6, 14.95)}
                disabled={processingQuantity !== null}
                className="mt-8 w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {processingQuantity === 6 ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          </div>
          
          {/* 9 Logo Option - Best Value */}
          <div className="bg-white border-2 border-indigo-500 rounded-lg shadow-md hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white text-sm px-4 py-1 rounded-full">
              Best Value
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$19.95</span>
                <span className="text-sm text-green-600 ml-2">Save $24.60</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">9 Logo Credits</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">27 Free Revisions Total</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-gray-700">$2.22 per logo</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase(9, 19.95)}
                disabled={processingQuantity !== null}
                className="mt-8 w-full py-3 px-4 bg-indigo-700 text-white font-medium rounded-lg hover:bg-indigo-800 transition disabled:opacity-50"
              >
                {processingQuantity === 9 ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>💳 Secure payment processing by Stripe</p>
          <p>⚡ Logo credits available immediately after purchase</p>
          <p>♻️ Credits never expire - use them anytime</p>
        </div>
      </div>
    </div>
  );
}