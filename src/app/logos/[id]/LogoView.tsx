'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLogo, StoredLogo } from '@/app/utils/indexedDBUtils';
import Header from '@/app/components/Header';
import ImageDisplay from '@/app/components/ImageDisplay';
import Link from 'next/link';

interface LogoViewClientProps {
  logoId: string;
}

export default function LogoViewClient({ logoId }: LogoViewClientProps) {
  const [logo, setLogo] = useState<StoredLogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setLoading(true);
        const logoData = await getLogo(logoId);
        
        if (!logoData) {
          setError('Logo not found');
        } else {
          setLogo(logoData);
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
        setError('Failed to load logo');
      } finally {
        setLoading(false);
      }
    };
    
    if (logoId) {
      fetchLogo();
    } else {
      setError('Invalid logo ID');
      setLoading(false);
    }
  }, [logoId]);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const handleEdit = () => {
    router.push(`/?edit=${logoId}`);
  };
  
  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      <Header />
      
      <div className="mb-4 flex justify-between items-center">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Generator
        </Link>
        
        <Link href="/history" className="text-indigo-600 hover:text-indigo-800">
          View History
        </Link>
      </div>
      
      {loading && (
        <div className="text-center my-8">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading logo...</p>
        </div>
      )}
      
      {error && !loading && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <Link href="/" className="mt-4 btn-primary inline-block">
            Return to Generator
          </Link>
        </div>
      )}
      
      {logo && !loading && !error && (
        <div>
          <div className="card mb-4">
            <h2 className="text-xl font-semibold mb-2">{logo.parameters.companyName} Logo</h2>
            <p className="text-sm text-gray-500 mb-4">Generated on {formatDate(logo.createdAt)}</p>
            
            <ImageDisplay imageDataUri={logo.imageDataUri} />
            
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <button 
                onClick={handleEdit}
                className="btn-primary w-full sm:w-auto"
              >
                Edit This Logo
              </button>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Logo Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Company Name</h4>
                <p>{logo.parameters.companyName}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Style</h4>
                <p>{logo.parameters.overallStyle}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Color Scheme</h4>
                <p>{logo.parameters.colorScheme}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Symbol Focus</h4>
                <p>{logo.parameters.symbolFocus}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Brand Personality</h4>
                <p>{logo.parameters.brandPersonality}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Industry</h4>
                <p>{logo.parameters.industry}</p>
              </div>
              
              {logo.parameters.typographyStyle && (
                <div>
                  <h4 className="font-medium text-gray-700">Typography</h4>
                  <p>{logo.parameters.typographyStyle}</p>
                </div>
              )}
              
              {logo.parameters.lineStyle && (
                <div>
                  <h4 className="font-medium text-gray-700">Line Style</h4>
                  <p>{logo.parameters.lineStyle}</p>
                </div>
              )}
              
              {logo.parameters.composition && (
                <div>
                  <h4 className="font-medium text-gray-700">Composition</h4>
                  <p>{logo.parameters.composition}</p>
                </div>
              )}
              
              {logo.parameters.shapeEmphasis && (
                <div>
                  <h4 className="font-medium text-gray-700">Shape Emphasis</h4>
                  <p>{logo.parameters.shapeEmphasis}</p>
                </div>
              )}
              
              {logo.parameters.texture && (
                <div>
                  <h4 className="font-medium text-gray-700">Texture</h4>
                  <p>{logo.parameters.texture}</p>
                </div>
              )}
              
              {logo.parameters.complexityLevel && (
                <div>
                  <h4 className="font-medium text-gray-700">Complexity</h4>
                  <p>{logo.parameters.complexityLevel}</p>
                </div>
              )}
              
              {logo.parameters.applicationContext && (
                <div>
                  <h4 className="font-medium text-gray-700">Application Context</h4>
                  <p>{logo.parameters.applicationContext}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}