// src/app/components/ImageDisplay.tsx - BEAUTIFUL VERSION
'use client';

import { useEffect, useState } from 'react';
import { PRESET_OPTIONS, imageTraceToSVG } from '../utils/svgPolyfill';

// Define the props interface for ImageDisplay
interface ImageDisplayProps {
  imageDataUri: string | null;
}

// Export the component with proper TypeScript props
export default function ImageDisplay({ imageDataUri }: ImageDisplayProps) {
  // State for the selected format
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  
  // State for SVG quality
  const [svgQuality, setSvgQuality] = useState<keyof typeof PRESET_OPTIONS>('logo');
  
  // State for SVG conversion status
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  
  // State for converted SVG
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  // State for share option
  const [canShare, setCanShare] = useState(false);
  
  // Check if share API is available
  useEffect(() => {
    setCanShare(!!navigator.share);
  }, []);
  
  // Debug logging to help troubleshoot
  useEffect(() => {
    if (imageDataUri) {
      console.log("ImageDisplay received data URI starting with:", 
        imageDataUri.substring(0, 30) + "...");
      console.log("Data URI length:", imageDataUri.length);
    } else {
      console.log("ImageDisplay: No image data URI received");
    }
  }, []);

  // If no URI is provided, render nothing
  if (!imageDataUri) {
    return null;
  }

  // Check if the data URI format is valid
  const isValidDataUri = imageDataUri.startsWith('data:image/') || 
                        imageDataUri.startsWith('http://') || 
                        imageDataUri.startsWith('https://');
  
  if (!isValidDataUri) {
    console.error("Invalid image data URI format:", 
      imageDataUri.substring(0, 30) + "...");
    return (
      <div className="mt-4 sm:mt-8 card">
        <h3 className="text-lg font-semibold mb-4 text-center">Logo Display Error</h3>
        <p className="text-center text-red-500">
          Invalid image format received. Please try generating again.
        </p>
      </div>
    );
  }

  // Convert the image to the selected format and download
  const handleDownload = async () => {
    // Create a temporary canvas to convert the image if needed
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Variables for file data
      let dataUrl;
      let fileExtension;
      let mimeType;
      let fileName = `generated-logo-${Date.now()}`;
      
      // Process based on selected format
      if (selectedFormat === 'svg') {
        try {
          setConversionStatus('converting');
          
          // If we have already converted to SVG with this quality setting, use that
          if (svgContent && conversionStatus === 'success') {
            dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
          } else {
            // Convert to SVG using our custom function
            const convertedSvg = await imageTraceToSVG(imageDataUri, PRESET_OPTIONS[svgQuality]);
            setSvgContent(convertedSvg);
            setConversionStatus('success');
            dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(convertedSvg);
          }
          
          fileExtension = 'svg';
          mimeType = 'image/svg+xml';
        } catch (error) {
          console.error("SVG conversion error:", error);
          setConversionStatus('error');
          return;
        }
      } else if (ctx) {
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Get the data URL in the selected raster format
        if (selectedFormat === 'jpeg') {
          dataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality for JPEG
          fileExtension = 'jpg';
          mimeType = 'image/jpeg';
        } else {
          dataUrl = canvas.toDataURL('image/png'); // PNG is lossless
          fileExtension = 'png';
          mimeType = 'image/png';
        }
      } else {
        console.error("Canvas context not available");
        return;
      }
      
      // Create the download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${fileName}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    // Set the source of the image
    img.src = imageDataUri;
  };

  // Handle SVG quality change
  const handleSvgQualityChange = (quality: keyof typeof PRESET_OPTIONS) => {
    setSvgQuality(quality);
    // Reset conversion status to trigger a new conversion
    if (quality !== svgQuality) {
      setConversionStatus('idle');
      setSvgContent(null);
    }
  };

  // Function to share the image
  const handleShare = async () => {
    if (!navigator.share) {
      return;
    }

    try {
      // Convert the data URI to a Blob
      const response = await fetch(imageDataUri);
      const blob = await response.blob();
      
      // Create a File from the Blob
      const file = new File([blob], `logo-${Date.now()}.png`, { type: 'image/png' });
      
      // Share the file
      await navigator.share({
        title: 'My Generated Logo',
        text: 'Check out this logo I made with the AI Logo Generator!',
        files: [file]
      });
    } catch (error) {
      console.error('Error sharing:', error);
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

        {/* Format Selection - Redesigned */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              Choose Format
            </span>
          </div>
          
          <div className="flex justify-center">
            <div className="inline-flex bg-white rounded-xl p-1 shadow-md border border-gray-200">
              {[
                { key: 'png', label: 'PNG', desc: 'Best quality' },
                { key: 'jpeg', label: 'JPEG', desc: 'Smaller size' },
                { key: 'svg', label: 'SVG', desc: 'Scalable' }
              ].map((format) => (
                <button
                  key={format.key}
                  onClick={() => setSelectedFormat(format.key as 'png' | 'jpeg' | 'svg')}
                  className={`relative px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 min-w-[80px] ${
                    selectedFormat === format.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-bold">{format.label}</div>
                  <div className="text-xs opacity-80">{format.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* SVG Quality options - Only show when SVG is selected */}
        {selectedFormat === 'svg' && (
          <div className="mb-6 animate-fadeIn">
            <div className="text-center mb-3">
              <span className="text-xs font-medium text-gray-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                SVG Quality
              </span>
            </div>
            <div className="flex justify-center">
              <div className="inline-flex bg-purple-50 rounded-lg p-1 border border-purple-200">
                {[
                  { key: 'icon', label: 'Simple' },
                  { key: 'logo', label: 'Standard' },
                  { key: 'highQuality', label: 'Detailed' }
                ].map((quality) => (
                  <button
                    key={quality.key}
                    onClick={() => handleSvgQualityChange(quality.key as keyof typeof PRESET_OPTIONS)}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                      svgQuality === quality.key
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {quality.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Download and Share Buttons - Completely Redesigned */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          {/* Download Button */}
          <button 
            onClick={handleDownload}
            disabled={selectedFormat === 'svg' && conversionStatus === 'converting'}
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex-1 min-w-[160px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              {selectedFormat === 'svg' && conversionStatus === 'converting' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          
          {/* Share Button - Only show on supported devices */}
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
        
        {/* Status Messages */}
        {selectedFormat === 'svg' && (
          <div className="mt-4 text-center">
            {conversionStatus === 'converting' && (
              <p className="text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg inline-block">
                🔄 Converting image to SVG, please wait...
              </p>
            )}
            {conversionStatus === 'error' && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg inline-block">
                ❌ Failed to convert to SVG. Try a different quality setting or format.
              </p>
            )}
            {conversionStatus === 'success' && (
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block">
                ✅ SVG ready for download!
              </p>
            )}
            {conversionStatus === 'idle' && (
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg inline-block">
                💡 SVG creates scalable vector graphics perfect for any size
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}