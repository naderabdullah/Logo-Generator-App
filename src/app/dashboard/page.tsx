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
  
  const router = useRouter();
  
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
    e.preventDefault();
    const catalogUrl = `${window.location.origin}/public-catalog`;
    window.open(catalogUrl, '_blank');
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
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate certificate');
      }
    } catch (err) {
      console.error('Certificate generation failed:', err);
      setError('Failed to generate certificate. Please try again.');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 pb-6 max-w-2xl">
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/login"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 pb-6 max-w-2xl">
      <div className="mt-1 card">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-indigo-600">Dashboard</h1>
          <p className="text-gray-600 mt-0.5">Overview of your logo creation system</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        {userData && (
          <div className="space-y-6">        
            {/* Usage Statistics - Using design with progress bar */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4">Logo Usage</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{userData.logosCreated || 0}</div>
                  <div className="text-sm text-indigo-600">Logos Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{userData.logosLimit || 0}</div>
                  <div className="text-sm text-indigo-600">Total Credits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userData.remainingLogos || 0}</div>
                  <div className="text-sm text-green-600">Remaining</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, ((userData.logosCreated || 0) / Math.max(1, userData.logosLimit || 1)) * 100)}%` }}
                ></div>
              </div>
              
              {userData.remainingLogos > 0 ? (
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
            <div className="bg-green-50 p-6 rounded-lg">
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
            <div className="bg-gray-50 p-6 rounded-lg">
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
        )}
      </div>
    </main>
  );
}