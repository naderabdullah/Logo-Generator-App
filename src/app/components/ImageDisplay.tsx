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

      <div className="logo-view-buttons">
        <div className="format-selector">
          <span className="format-selector-label">Format:</span>
          <div className="format-button-group">
            <button
              onClick={() => setSelectedFormat('png')}
              className={`format-button ${selectedFormat === 'png' ? 'active' : ''}`}
            >
              PNG
            </button>
            <button
              onClick={() => setSelectedFormat('jpeg')}
              className={`format-button ${selectedFormat === 'jpeg' ? 'active' : ''}`}
            >
              JPEG
            </button>
            <button
              onClick={() => setSelectedFormat('svg')}
              className={`format-button ${selectedFormat === 'svg' ? 'active' : ''}`}
            >
              SVG
            </button>
          </div>
        </div>
        
        {/* SVG Quality options - Only show when SVG is selected */}
        {selectedFormat === 'svg' && (
          <div className="svg-quality-selector">
            <span className="format-selector-label">SVG Quality:</span>
            <div className="svg-quality-button-group">
              <button
                onClick={() => handleSvgQualityChange('icon')}
                className={`svg-quality-button ${svgQuality === 'icon' ? 'active' : ''}`}
              >
                Simple
              </button>
              <button
                onClick={() => handleSvgQualityChange('logo')}
                className={`svg-quality-button ${svgQuality === 'logo' ? 'active' : ''}`}
              >
                Standard
              </button>
              <button
                onClick={() => handleSvgQualityChange('highQuality')}
                className={`svg-quality-button ${svgQuality === 'highQuality' ? 'active' : ''}`}
              >
                Detailed
              </button>
            </div>
          </div>
        )}
        
        <div className="btn-group">
          <button 
            onClick={handleDownload}
            className="btn-download"
            disabled={selectedFormat === 'svg' && conversionStatus === 'converting'}
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            {selectedFormat === 'svg' && conversionStatus === 'converting' 
              ? 'Converting...' 
              : `Download ${selectedFormat.toUpperCase()}`}
          </button>
          
          {/* Mobile Share button - only visible on devices that support Web Share API */}
          {canShare && (
            <button
              onClick={handleShare}
              className="btn-share"
            >
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.148-4.342m0 0a3 3 0 00-4.148 0m4.148 0a3 3 0 01-4.148 4.342M3 20h18" />
              </svg>
              Share Logo
            </button>
          )}
        </div>
        
        {selectedFormat === 'svg' && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            {conversionStatus === 'converting' && (
              <p>Converting image to SVG, please wait...</p>
            )}
            {conversionStatus === 'error' && (
              <p className="text-red-500">Failed to convert to SVG. Try a different quality setting or format.</p>
            )}
            {conversionStatus !== 'error' && conversionStatus !== 'converting' && (
              <p>SVG creates scalable vector graphics perfect for any size.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}