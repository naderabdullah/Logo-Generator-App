'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingQuantity, setProcessingQuantity] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Clear local storage and IndexedDB if needed
        localStorage.clear();
        
        // Redirect to login page with a message
        router.push('/login?message=account-deleted');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Delete account failed:', err);
      setError('Failed to delete account');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
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
                    style={{ width: `${Math.min(100, (userData.logosCreated / Math.max(1, userData.logosLimit)) * 100)}%` }}
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
              
              <Link 
                href="/purchase" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-center hover:bg-indigo-700"
              >
                Purchase Logos
              </Link>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Log Out
              </button>
              
              <div className="border-t pt-3 mt-3">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-gray-200 text-red-600 rounded-md hover:bg-red-100 w-full font-medium"
                >
                  Delete Account
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Account</h3>
              <p className="mb-4 text-gray-700">
                Are you sure you want to delete your account? This action is permanent and cannot be undone.
              </p>
              <p className="mb-6 text-sm text-gray-600">
                • All your account data will be permanently deleted<br/>
                • Your logo creation history will be removed<br/>
                • Any remaining logo credits will be lost<br/>
                • You will not be able to recover your account
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}