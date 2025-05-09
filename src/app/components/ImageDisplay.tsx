// src/app/components/ImageDisplay.tsx
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
  }, [imageDataUri]);

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
    <div className="mt-4 sm:mt-8 card">
      <h3 className="text-lg font-semibold mb-4 text-center">Your Generated Logo</h3>
      <div className="flex justify-center items-center p-2 sm:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageDataUri}
          alt="Generated logo"
          className="result-image max-w-full h-auto rounded-lg shadow-md block"
          style={{ maxWidth: 'min(100%, 512px)' }} 
        />
      </div>

      <div className="text-center mt-4 pb-2 sm:pb-4">
        <div className="flex flex-col items-center space-y-4 mb-4">
          <div className="flex flex-col items-center w-full sm:w-auto">
            <span className="text-gray-700 mb-2">Format:</span>
            <div className="flex rounded-md overflow-hidden border border-gray-300 w-full sm:w-auto">
              <button
                onClick={() => setSelectedFormat('png')}
                className={`px-4 py-2 text-sm transition flex-1 sm:flex-none ${
                  selectedFormat === 'png' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                PNG
              </button>
              <button
                onClick={() => setSelectedFormat('jpeg')}
                className={`px-4 py-2 text-sm transition flex-1 sm:flex-none ${
                  selectedFormat === 'jpeg' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                JPEG
              </button>
              <button
                onClick={() => setSelectedFormat('svg')}
                className={`px-4 py-2 text-sm transition flex-1 sm:flex-none ${
                  selectedFormat === 'svg' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                SVG
              </button>
            </div>
          </div>
          
          {/* SVG Quality options - Only show when SVG is selected */}
          {selectedFormat === 'svg' && (
            <div className="flex flex-col items-center w-full sm:w-auto">
              <span className="text-gray-700 mb-2">SVG Quality:</span>
              <div className="flex rounded-md overflow-hidden border border-gray-300 w-full sm:w-auto">
                <button
                  onClick={() => handleSvgQualityChange('icon')}
                  className={`px-3 py-2 text-sm transition flex-1 sm:flex-none ${
                    svgQuality === 'icon' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => handleSvgQualityChange('logo')}
                  className={`px-3 py-2 text-sm transition flex-1 sm:flex-none ${
                    svgQuality === 'logo' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => handleSvgQualityChange('highQuality')}
                  className={`px-3 py-2 text-sm transition flex-1 sm:flex-none ${
                    svgQuality === 'highQuality' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <button 
            onClick={handleDownload}
            className="btn-primary w-full sm:w-auto"
            disabled={selectedFormat === 'svg' && conversionStatus === 'converting'}
            style={{ minHeight: '48px' }}
          >
            {selectedFormat === 'svg' && conversionStatus === 'converting' 
              ? 'Converting to SVG...' 
              : `Download as ${selectedFormat.toUpperCase()}`}
          </button>
          
          {/* Mobile Share button - only visible on devices that support Web Share API */}
          {canShare && (
            <button
              onClick={handleShare}
              className="btn-primary bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              style={{ minHeight: '48px' }}
            >
              Share Logo
            </button>
          )}
        </div>
        
        {selectedFormat === 'svg' && (
          <div className="mt-2 text-sm text-gray-600">
            {conversionStatus === 'converting' && (
              <p>Converting image to SVG, please wait...</p>
            )}
            {conversionStatus === 'error' && (
              <p className="text-red-500">Failed to convert to SVG. Try a different quality setting or format.</p>
            )}
            {conversionStatus !== 'error' && (
              <p>
                SVG conversion creates vector graphics that can be scaled to any size without losing quality.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}