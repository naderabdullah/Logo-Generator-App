//ImageDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Define the props interface
interface ImageDisplayProps {
  imageDataUri: string;
  logoName?: string;
}

// Format type
type Format = 'png' | 'jpeg' | 'svg';
type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';
type SVGConversionType = 'simple' | 'posterized' | 'detailed';

// Component
export default function ImageDisplay({ imageDataUri, logoName }: ImageDisplayProps) {
  const [selectedFormat, setSelectedFormat] = useState<Format>('png');
  const [svgType, setSvgType] = useState<SVGConversionType>('simple');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>('idle');
  const [canShare, setCanShare] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<string>('');

  // Check if Web Share API is available
  useEffect(() => {
    const checkShareCapability = async () => {
      if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        try {
          const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
          const canShareFiles = navigator.canShare({ files: [testFile] });
          setCanShare(canShareFiles);
        } catch {
          setCanShare(false);
        }
      }
    };
    checkShareCapability();
  }, []);

  // Check if the image is valid
  if (!imageDataUri || !imageDataUri.startsWith('data:image')) {
    return (
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          No valid image to display. Please try generating again.
        </p>
      </div>
    );
  }

  const createSafeFilename = (name: string | undefined, fallback: string = 'logo'): string => {
    if (!name || name.trim() === '' || name === 'Untitled') {
      return fallback;
    }
    
    // Remove special characters and replace spaces with hyphens
    return name
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .toLowerCase();
  };

  // Server-side SVG conversion
  const convertToSVGServerSide = async (): Promise<string> => {
    setConversionProgress('Preparing image...');
    
    // Convert data URI to blob
    const response = await fetch(imageDataUri);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    const file = new File([blob], 'logo.png', { type: blob.type });
    formData.append('image', file);
    
    // Set options based on selected type
    const options = {
      type: svgType,
      width: 1000,
      height: 1000,
      threshold: svgType === 'detailed' ? 200 : 128,
      steps: svgType === 'posterized' ? 4 : undefined,
      color: svgType === 'posterized' ? undefined : '#000000'
    };
    
    formData.append('options', JSON.stringify(options));
    
    setConversionProgress('Converting on server...');
    
    try {
      const serverResponse = await fetch('/api/convert-to-svg', {
        method: 'POST',
        body: formData
      });
      
      if (!serverResponse.ok) {
        const error = await serverResponse.json();
        throw new Error(error.error || 'Server conversion failed');
      }
      
      const result = await serverResponse.json();
      setConversionProgress('Conversion complete!');
      
      return result.svg;
    } catch (error: any) {
      console.error('Server conversion error:', error);
      throw error;
    }
  };

  // Convert the image to the selected format and download
  const handleDownload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      let dataUrl: string;
      let fileExtension: string;
      
      // UPDATED: Use logo name for filename
      const baseFileName = createSafeFilename(logoName, 'generated-logo');
      
      if (selectedFormat === 'svg') {
        try {
          setConversionStatus('converting');
          setConversionProgress('Starting conversion...');
          
          // Always use server-side conversion
          const convertedSvg = await convertToSVGServerSide();
          
          if (!convertedSvg || !convertedSvg.includes('<svg')) {
            throw new Error('Invalid SVG output');
          }
          
          setSvgContent(convertedSvg);
          setConversionStatus('success');
          dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(convertedSvg);
          fileExtension = 'svg';
        } catch (error: any) {
          console.error("SVG conversion error:", error);
          setConversionStatus('error');
          setConversionProgress('');
          return;
        }
      } else if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        if (selectedFormat === 'jpeg') {
          dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          fileExtension = 'jpg';
        } else {
          dataUrl = canvas.toDataURL('image/png');
          fileExtension = 'png';
        }
      } else {
        console.error("Canvas context not available");
        return;
      }
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${baseFileName}.${fileExtension}`; // UPDATED: Use logo name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Reset progress
      setConversionProgress('');
    };
    
    img.onerror = () => {
      console.error('Failed to load image for conversion');
    };
    
    img.src = imageDataUri;
  };

  // Share function
  const handleShare = async () => {
    if (!navigator.share) {
      return;
    }

    try {
      let file: File;

      const baseFileName = createSafeFilename(logoName, 'logo');
      
      if (selectedFormat === 'svg') {
        // Handle SVG sharing
        let svgToShare = svgContent;
        
        // If SVG content doesn't exist yet, convert it
        if (!svgToShare) {
          try {
            setConversionStatus('converting');
            setConversionProgress('Converting to SVG for sharing...');
            svgToShare = await convertToSVGServerSide();
            setSvgContent(svgToShare);
            setConversionStatus('success');
          } catch (error: any) {
            console.error('SVG conversion for sharing failed:', error);
            setConversionStatus('idle');
            setConversionProgress('');
            svgToShare = null; // Ensure it's null so we fall back to PNG
          }
        }
        
        // Create SVG file if conversion was successful, otherwise fall back to PNG
        if (svgToShare) {
          const svgBlob = new Blob([svgToShare], { type: 'image/svg+xml' });
          file = new File([svgBlob], `logo-${Date.now()}.svg`, { type: 'image/svg+xml' });
        } else {
          // Fall back to PNG sharing
          const response = await fetch(imageDataUri);
          const blob = await response.blob();
          file = new File([blob], `logo-${Date.now()}.png`, { type: 'image/png' });
        }
      } else if (selectedFormat === 'jpeg') {
        // Convert to JPEG for sharing
        file = await new Promise<File>((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(new File([blob], `logo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
                } else {
                  reject(new Error('Failed to create JPEG blob'));
                }
              }, 'image/jpeg', 0.9);
            } else {
              reject(new Error('Canvas context not available'));
            }
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imageDataUri;
        });
      } else {
        // Default to PNG (or if selectedFormat is 'png')
        const response = await fetch(imageDataUri);
        const blob = await response.blob();
        file = new File([blob], `${baseFileName}.png`, { type: 'image/png' }); 
      }
      
      // Reset conversion status and progress after successful conversion
      setConversionStatus('idle');
      setConversionProgress('');
      
      // Share the file
      await navigator.share({
        title: 'My Generated Logo',
        text: 'Check out this logo I made with the AI Logo Generator!',
        files: [file]
      });
    } catch (error) {
      console.error('Error sharing:', error);
      setConversionStatus('idle');
      setConversionProgress('');
    }
  };

  return (
    <div className="mt-4 sm:mt-8">
      <div className="card" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <h3 className="text-lg font-semibold mb-6 text-center text-gray-800">Your Generated Logo</h3>
        
        {/* Logo Display */}
        <div className="flex justify-center items-center p-4 mb-6 bg-white rounded-xl shadow-inner border-2 border-gray-100">
          <img
            src={imageDataUri}
            alt="Generated logo"
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxWidth: 'min(100%, 400px)' }} 
          />
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              Choose Format
            </span>
          </div>
          
          <div className="flex justify-center">
            <div className="inline-flex bg-white rounded-xl p-1 shadow-md border border-gray-200">
              {[
                { key: 'png' as Format, label: 'PNG', desc: 'Best quality' },
                { key: 'jpeg' as Format, label: 'JPEG', desc: 'Smaller size' },
                { key: 'svg' as Format, label: 'SVG', desc: 'Scalable' }
              ].map((format) => (
                <button
                  key={format.key}
                  onClick={() => {
                    setSelectedFormat(format.key);
                    setSvgContent(null);
                    setConversionStatus('idle');
                  }}
                  className={`relative px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 min-w-[80px] ${
                    selectedFormat === format.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{format.label}</div>
                  <div className={`text-xs mt-0.5 ${
                    selectedFormat === format.key ? 'text-indigo-100' : 'text-gray-400'
                  }`}>
                    {format.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleDownload}
            disabled={selectedFormat === 'svg' && conversionStatus === 'converting'}
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex-1 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              {selectedFormat === 'svg' && conversionStatus === 'converting' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Download {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </div>
          </button>
          
          {canShare && (
            <button
              onClick={handleShare}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex-1 min-w-[160px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.148-4.342m0 0a3 3 0 00-4.148 0m4.148 0a3 3 0 01-4.148 4.342M3 20h18" />
                </svg>
                <span>Share Logo</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}