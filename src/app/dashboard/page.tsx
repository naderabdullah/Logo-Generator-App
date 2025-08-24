// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const router = useRouter();
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login?redirect=/dashboard');
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

  const handleCopyCatalogLink = () => {
    const catalogUrl = `${window.location.origin}/public-catalog`;
    navigator.clipboard.writeText(catalogUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCatalogClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      const catalogUrl = `${window.location.origin}/public-catalog`;
      window.open(catalogUrl, '_blank');
    }
  };

  const generateShareableLink = () => {
    if (!userData) return;
    
    const shareableLink = `${window.location.origin}/certificate/${userData.id}`;
    navigator.clipboard.writeText(shareableLink);
    setCopiedLink(true);
    
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const handleGenerateCertificate = async () => {
    if (!userData) return;

    setGeneratingCertificate(true);
    try {
      const response = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userData.email,
        }),
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ownership-certificate-${userData.email.split('@')[0]}-${new Date().getFullYear()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSuccessMessage('Ownership certificate generated and downloaded successfully!');
      } else {
        throw new Error('Failed to generate certificate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userData?.email}</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{userData?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <p className="mt-1 text-sm text-gray-900">
                {userData?.isSuperUser ? 'Super User' : 'Regular User'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-sm text-gray-900">
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
          
          <div className="flex justify-between mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userData?.logosCreated || 0}</div>
              <div className="text-sm text-indigo-600">Logos Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{userData?.logosLimit || 0}</div>
              <div className="text-sm text-indigo-600">Total Credits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userData?.remainingLogos || 0}</div>
              <div className="text-sm text-green-600">Remaining</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(100, ((userData?.logosCreated || 0) / Math.max(1, userData?.logosLimit || 1)) * 100)}%` }}
            ></div>
          </div>
          
          {userData?.remainingLogos > 0 ? (
            <p className="text-sm text-indigo-600 mt-2 text-center">
              You have {userData.remainingLogos} logo{userData.remainingLogos !== 1 ? 's' : ''} remaining
            </p>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-sm text-red-600 mb-2">You've used all your logo credits</p>
              <Link 
                href="/purchase"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Purchase More Credits
              </Link>
            </div>
          )}
        </div>

        {/* Catalog Actions */}
        <div className="bg-blue-50 p-6 rounded-lg md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo Catalog</h3>
          <div className="flex gap-3">
            <Link
              href="/public-catalog"
              onClick={handleCatalogClick}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Catalog
            </Link>
            <button
              onClick={handleCopyCatalogLink}
              className="flex-1 px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              {copiedLink ? 'Link Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Certificate Generation */}
        <div className="bg-green-50 p-6 rounded-lg md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ownership Certificate</h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate a certificate proving your ownership of logos created with this account.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateCertificate}
              disabled={generatingCertificate}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generatingCertificate ? 'Generating...' : 'Generate Certificate'}
            </button>
            <button
              onClick={generateShareableLink}
              className="flex-1 px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors"
            >
              {copiedLink ? 'Link Copied!' : 'Share Certificate'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 p-6 rounded-lg md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-indigo-600 text-white text-center rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Logo
            </Link>
            <Link
              href="/history"
              className="px-4 py-2 bg-gray-600 text-white text-center rounded-md hover:bg-gray-700 transition-colors"
            >
              View History
            </Link>
            <Link
              href="/purchase"
              className="px-4 py-2 bg-green-600 text-white text-center rounded-md hover:bg-green-700 transition-colors"
            >
              Buy Credits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}