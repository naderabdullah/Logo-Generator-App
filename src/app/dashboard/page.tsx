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
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo Catalog</h3>
              <div className="flex gap-3">
                <Link
                  href="/public-catalog"
                  target="_blank"
                  onClick={handleCatalogClick}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Catalog
                </Link>
                <button
                  onClick={handleCopyCatalogLink}
                  className="flex-1 px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  {copiedLink ? 'Link Copied!' : 'Copy Catalog Link'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">Share the public catalog with others</p>
            </div>

            {/* Ownership Certificate Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Digital Ownership Certificate</h3>
                  <p className="text-gray-600 mb-4">
                    Generate a professional PDF certificate that legally establishes your full ownership rights
                    over all logos created with the SMARTY LOGOS™ AI LOGO GENERATOR PLATFORM. This certificate includes comprehensive ownership
                    language and serves as proof of your intellectual property rights.
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-indigo-100 mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Certificate includes:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Full ownership rights (create, edit, sell, transfer, display)</li>
                      <li>• Complete copyright ownership</li>
                      <li>• Commercial usage permissions</li>
                      <li>• Digital signature and verification</li>
                      <li>• Account verification details</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleGenerateCertificate}
                    disabled={generatingCertificate}
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700
                      disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                      flex items-center justify-center space-x-2"
                  >
                    {generatingCertificate ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating Certificate...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Generate Ownership Certificate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Create New Logo
              </Link>
              
              <Link
                href="/history"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                View Logo History
              </Link>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}