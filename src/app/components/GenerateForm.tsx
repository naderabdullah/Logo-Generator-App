'use client';

import { useState, useCallback, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  saveLogo, 
  getLogo, 
  LogoParameters, 
  canCreateOriginalLogo, 
  canCreateRevision,
  syncUserUsageWithDynamoDB
} from '@/app/utils/indexedDBUtils';

// Helper hook to get edit param
function useEditParam() {
  const searchParams = useSearchParams();
  return searchParams.get('edit');
}

// Simple hook to check authentication status
function useAuthCheck() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Function to check if user is logged in by trying to fetch user data
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/user');
        
        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setUserInfo(userData);
          
          // Sync DynamoDB usage with IndexedDB
          await syncUserUsageWithDynamoDB({
            logosCreated: userData.logosCreated,
            logosLimit: userData.logosLimit
          });
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  return { isLoggedIn, userInfo, loading };
}

// Modal component for showing limit reached message
function LimitReachedModal({ isOpen, onClose, isRevision }: { 
  isOpen: boolean; 
  onClose: () => void;
  isRevision: boolean;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-xl font-bold mt-2">
            {isRevision 
              ? "Maximum Revisions Reached" 
              : "Logo Limit Reached"}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          {isRevision 
            ? "You've reached the maximum of 3 revisions for this logo." 
            : "You've reached your logo creation limit. Please purchase more logos."}
        </p>
        
        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          
          <Link
            href="/account"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Account
          </Link>
        </div>
      </div>
    </div>
  );
}

interface GenerateFormProps {
  setLoading: (loading: boolean) => void;
  setImageDataUri: (dataUri: string | null) => void;
  setError: (error: string | null) => void;
}

export default function GenerateForm({ setLoading, setImageDataUri, setError }: GenerateFormProps) {
  // Get authentication status
  const { isLoggedIn, userInfo, loading: authLoading } = useAuthCheck();
  
  // Create unique IDs for form elements
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  
  // Get the edit param using the hook that uses useSearchParams
  const editLogoId = useEditParam();
  
  // State to track if we're editing an original logo or a revision
  const [isRevision, setIsRevision] = useState(false);
  const [originalLogoId, setOriginalLogoId] = useState<string | undefined>(undefined);
  
  // Required options state
  const [companyName, setCompanyName] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [overallStyle, setOverallStyle] = useState('');
  const [colorScheme, setColorScheme] = useState('');
  const [symbolFocus, setSymbolFocus] = useState('');
  const [brandPersonality, setBrandPersonality] = useState('');
  const [industry, setIndustry] = useState('');
  
  // Advanced options state
  const [typographyStyle, setTypographyStyle] = useState('');
  const [lineStyle, setLineStyle] = useState('');
  const [composition, setComposition] = useState('');
  const [shapeEmphasis, setShapeEmphasis] = useState('');
  const [texture, setTexture] = useState('');
  const [complexityLevel, setComplexityLevel] = useState('');
  const [applicationContext, setApplicationContext] = useState('');
  
  // Show advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Modal state
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Animation reference
  const advancedSectionRef = useRef<HTMLDivElement>(null);
  
  // Track loading state locally
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Track usage limits
  const [canCreateLogo, setCanCreateLogo] = useState(true);
  const [canRevise, setCanRevise] = useState(true);

  // Check usage limits when component loads
  useEffect(() => {
    const checkUsageLimits = async () => {
      try {
        // If not editing, check if user can create a new original logo
        if (!editLogoId) {
          const canCreate = await canCreateOriginalLogo();
          setCanCreateLogo(canCreate);
        }
      } catch (error) {
        console.error('Error checking usage limits:', error);
      }
    };
    
    checkUsageLimits();
  }, [editLogoId]);

  // Check for edit mode
  useEffect(() => {
    if (editLogoId) {
      const loadLogoData = async () => {
        try {
          setLoading(true);
          const logoData = await getLogo(editLogoId);
          
          if (logoData) {
            // Fill in the form with the logo parameters
            const params = logoData.parameters;
            setCompanyName(params.companyName || '');
            setOverallStyle(params.overallStyle || '');
            setColorScheme(params.colorScheme || '');
            setSymbolFocus(params.symbolFocus || '');
            setBrandPersonality(params.brandPersonality || '');
            setIndustry(params.industry || '');
            
            // Advanced options
            if (params.typographyStyle || params.lineStyle || params.composition || 
                params.shapeEmphasis || params.texture || params.complexityLevel || 
                params.applicationContext) {
              setShowAdvanced(true);
            }
            
            setTypographyStyle(params.typographyStyle || '');
            setLineStyle(params.lineStyle || '');
            setComposition(params.composition || '');
            setShapeEmphasis(params.shapeEmphasis || '');
            setTexture(params.texture || '');
            setComplexityLevel(params.complexityLevel || '');
            setApplicationContext(params.applicationContext || '');
            
            // Convert the data URI to a File object for reference
            if (logoData.imageDataUri) {
              setReferenceImagePreview(logoData.imageDataUri);
              
              // Convert the data URI to a blob and create a file
              try {
                const response = await fetch(logoData.imageDataUri);
                const blob = await response.blob();
                const file = new File([blob], 'reference-logo.png', { type: 'image/png' });
                setReferenceImage(file);
              } catch (err) {
                console.error('Error converting data URI to File:', err);
              }
            }
            
            // Determine if this is a revision or an original logo
            if (logoData.isRevision && logoData.originalLogoId) {
              // If editing a revision, the original is its originalLogoId
              setIsRevision(true);
              setOriginalLogoId(logoData.originalLogoId);
              
              // Check if can create more revisions for this original
              const canReviseMore = await canCreateRevision(logoData.originalLogoId);
              setCanRevise(canReviseMore);
            } else {
              // If editing an original logo, this becomes a revision of itself
              setIsRevision(true);
              setOriginalLogoId(logoData.id);
              
              // Check if can create more revisions for this original
              const canReviseMore = await canCreateRevision(logoData.id);
              setCanRevise(canReviseMore);
            }
          }
        } catch (err) {
          console.error('Error loading logo data for editing:', err);
          setError('Failed to load logo data for editing');
        } finally {
          setLoading(false);
        }
      };
      
      loadLogoData();
    }
  }, [editLogoId, setLoading, setError]);

  // Handle reference image upload
  const handleReferenceImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setReferenceImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReferenceImagePreview(null);
    }
  };

  // Required options data
  const overallStyleOptions = [
    'Modern', 'Contemporary', 'Abstract', 'Classical', 
    'Hi-Tech', 'Minimalist', 'Vintage', 'Geometric', 'Hand-Drawn'
  ];
  
  const colorSchemeOptions = [
    'Pastels', 'Primary Colors', 'Neon', 'Grey Tones', 
    'Monochrome', 'Metallics', 'Earthy Tones', 'Black & White', 'Gradient Blends'
  ];
  
  const symbolFocusOptions = [
    'Lettermark (Initial-based)', 'Wordmark (Company Name)', 
    'Pictorial (Image-based)', 'Mascot (Character-based)', 
    'Emblem (Badge-style)', 'Symbol Only (No Text)', 'Abstract Icon', 'Minimalist Icon', 
    'Geometric Icon', 'Nature-Inspired Icon'
  ];
  
  const brandPersonalityOptions = [
    'Professional', 'Playful', 'Elegant', 'Bold & Energetic', 
    'Trustworthy', 'Futuristic & Cutting-Edge', 'Luxury & Premium', 
    'Eco-Friendly', 'Tech & Innovation Focused'
  ];
  
  const industryOptions = [
    'Technology', 'Finance/Banking', 'Healthcare/Medical', 
    'Food/Restaurant', 'Retail/Shopping', 'Education', 
    'Arts/Entertainment', 'Sports/Fitness', 'Travel/Hospitality', 
    'Professional Services', 'Manufacturing/Industrial', 
    'Non-profit/Charity', 'Fashion/Beauty', 'Construction/Real Estate'
  ];
  
  // Advanced options data
  const typographyStyleOptions = [
    'Serif', 'Sans-serif', 'Script/Cursive', 'Display', 
    'Slab serif', 'Geometric', 'Handwritten', 'Monospace', 
    'Decorative/Ornamental', 'Classic/Traditional'
  ];
  
  const lineStyleOptions = [
    'Thick', 'Thin', 'Hand-Drawn', 'Sharp/Angular', 
    'Fluid/Wavy', 'Broken/Dotted', 'Continuous Smooth', 
    'Sketch-like', 'Calligraphy'
  ];
  
  const compositionOptions = [
    'Horizontal', 'Vertical', 'Circular/Radial', 'Diagonal', 
    'Stacked', 'Enclosed (symbol + text in container)', 
    'Symbol above text', 'Symbol beside text', 
    'Symbol integrated with text', 'Text only'
  ];
  
  const shapeEmphasisOptions = [
    'Circular', 'Square/Rectangular', 'Triangular', 'Hexagonal', 
    'Organic/Curved', 'Sharp/Angular', 'Shield/Emblem', 
    'Asymmetrical', 'Symmetrical', 'Negative space'
  ];
  
  const textureOptions = [
    'Flat Design', 'Glossy', 'Gradient', 'Rough/Grungy', 
    'Embossed', 'Metallic', 'Hand-Illustrated', '3D Depth', 'Shadowed'
  ];
  
  const complexityLevelOptions = [
    'Ultra-minimal (1-2 elements)', 'Simple (2-3 elements)', 
    'Moderate (3-5 elements)', 'Detailed (5+ elements)', 
    'Complex/Intricate', 'Balanced/Medium'
  ];
  
  const applicationContextOptions = [
    'Digital-first (websites, apps)', 'Print-first (business cards, letterheads)', 
    'Merchandise/Products', 'Signage/Large format', 'Social media profiles', 
    'Multi-purpose/Versatile', 'Mobile app icon', 'Favicon/Small display', 
    'Animation-ready', 'Brand system (multiple variations)'
  ];

  const toggleAdvancedOptions = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  // Function to build prompt from selections
  const buildPrompt = useCallback(() => {
    let prompt = `Create a logo with the following characteristics:\n`;
    
    // Add required options
    prompt += `Company Name: ${companyName}\n`;
    prompt += `Style: ${overallStyle}\n`;
    prompt += `Colors: ${colorScheme}\n`;
    prompt += `Symbol Type: ${symbolFocus}\n`;
    prompt += `Brand Personality: ${brandPersonality}\n`;
    prompt += `Industry: ${industry}\n`;
    
    // Add advanced options if they are set
    if (typographyStyle) prompt += `Typography: ${typographyStyle}\n`;
    if (lineStyle) prompt += `Line Style: ${lineStyle}\n`;
    if (composition) prompt += `Composition: ${composition}\n`;
    if (shapeEmphasis) prompt += `Shape Emphasis: ${shapeEmphasis}\n`;
    if (texture) prompt += `Texture: ${texture}\n`;
    if (complexityLevel) prompt += `Complexity: ${complexityLevel}\n`;
    if (applicationContext) prompt += `Application Context: ${applicationContext}\n`;
    
    // Add a final instruction 
    prompt += `Make it a high-quality, professional logo suitable for business use.`;
    
    return prompt;
  }, [
    companyName, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext
  ]);

  // Collect parameters for saving
  const collectParameters = useCallback((): LogoParameters => {
    return {
      companyName,
      overallStyle,
      colorScheme,
      symbolFocus,
      brandPersonality,
      industry,
      typographyStyle: typographyStyle || undefined,
      lineStyle: lineStyle || undefined,
      composition: composition || undefined,
      shapeEmphasis: shapeEmphasis || undefined,
      texture: texture || undefined,
      complexityLevel: complexityLevel || undefined,
      applicationContext: applicationContext || undefined
    };
  }, [
    companyName, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext
  ]);

  const areRequiredFieldsFilled = useCallback(() => {
    return companyName && overallStyle && colorScheme && symbolFocus && brandPersonality && industry;
  }, [companyName, overallStyle, colorScheme, symbolFocus, brandPersonality, industry]);

  const handleGenerateLogo = useCallback(async () => {
    // Redirect to login if not authenticated
    if (!isLoggedIn) {
      router.push('/login?redirect=/');
      return;
    }

    // If already generating or missing required fields, do nothing
    if (isGenerating || !areRequiredFieldsFilled()) {
      return;
    }
    
    // Check limit conditions and show modal if needed
    if (isRevision && !canRevise) {
      setShowLimitModal(true);
      return;
    }
    
    if (!isRevision && !canCreateLogo) {
      setShowLimitModal(true);
      return;
    }
    
    const prompt = buildPrompt();
    console.log('Starting logo generation with prompt:', prompt);

    // Update states to indicate generation is in progress
    setLoading(true);
    setError(null);
    setImageDataUri(null);
    setIsGenerating(true);

    try {
      // Create a FormData object to send the data
      const formData = new FormData();
      formData.append('prompt', prompt);
      
      // Add the reference image if one was uploaded
      if (referenceImage) {
        formData.append('referenceImage', referenceImage);
      }

      if (isRevision && originalLogoId) {
        formData.append('originalLogoId', originalLogoId);
      }

      // Send the request to server for logo generation and usage tracking
      const response = await fetch('/logos', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText.substring(0, 200));
        
        let errorMessage = `Error generating image (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the status code message
        }
        
        throw new Error(errorMessage);
      }

      // Parse response
      const data = await response.json();
      console.log('Response received from API');
      
      // Process the response data
      let imageDataUriString = '';
      if (data.image.type === 'base64') {
        imageDataUriString = `data:image/png;base64,${data.image.data}`;
      } else if (data.image.type === 'url') {
        imageDataUriString = data.image.data;
      } else {
        throw new Error('No image data received in the expected format');
      }
      
      // Save the logo to IndexedDB with revision tracking
      const parameters = collectParameters();
      const logoId = await saveLogo(
        imageDataUriString, 
        parameters,
        isRevision ? originalLogoId : undefined,
        companyName // Use company name for the logo name
      );
      
      // Show success message
      setImageDataUri(imageDataUriString);
      
      // Optionally navigate to the logo view page
      router.push(`/logos/${logoId}`);
      
    } catch (error) {
      console.error('Error generating logo:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [
    isLoggedIn, isGenerating, areRequiredFieldsFilled, buildPrompt, collectParameters,
    setLoading, setError, setImageDataUri, referenceImage, router,
    isRevision, originalLogoId, companyName, canRevise, canCreateLogo
  ]);

  // Function to create dropdown 
  const renderDropdown = useCallback((
    id: string,
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    options: string[],
    required: boolean = false
  ) => {
    return (
      <div className="mb-4">
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={id}
          className="form-input"
          value={value}
          onChange={onChange}
          required={required}
          disabled={isGenerating}
        >
          <option value="">-- Select {label} --</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }, [isGenerating]);

  return (
    <div className="card">
      {!isLoggedIn && !authLoading && (
        <div className="mb-4 p-3 bg-indigo-100 border border-indigo-300 text-indigo-700 rounded-lg">
          <p className="font-bold">Authentication Required</p>
          <p>Please log in to generate logos and track your usage.</p>
          <button
            onClick={() => router.push('/login?redirect=/')}
            className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Log In / Sign Up
          </button>
        </div>
      )}

      {authLoading && (
        <div className="text-center my-4">
          <div className="spinner inline-block"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      )}
      
      <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-2">
        <div className="mb-2 sm:mb-3">
          <h3 className="text-lg font-medium mb-2">
            {isRevision ? 'Revise Logo' : 'Create New Logo'}
          </h3>

          {/* Company Name Input */}
          <div className="mb-2">
            <label htmlFor="company-name" className="form-label">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              className="form-input"
              placeholder="Enter your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              disabled={isGenerating}
              autoComplete="off"
            />
          </div>

          {/* Reference Image Upload - Mobile-friendly version */}
          <div className="mb-2">
            <label htmlFor="reference-image" className="form-label">
              Reference Image {isRevision ? '(Current Logo)' : '(Optional)'}
            </label>
            <div className="relative">
              <label 
                className="w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-300 transition text-gray-500 hover:text-indigo-500"
                style={{ minHeight: '40px' }}
              >
                <span className="text-center">
                  {referenceImage ? referenceImage.name : 'Tap to upload an image'}
                </span>
                <input
                  id="reference-image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleReferenceImageChange}
                  disabled={isGenerating}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isRevision 
                ? 'The current logo is used as a reference for the revision'
                : 'Upload an image for inspiration'}
            </p>
            
            {referenceImagePreview && (
              <div className="mt-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={referenceImagePreview}
                  alt="Reference image preview"
                  className="image-preview"
                />
                <button
                  type="button"
                  className="mt-2 text-red-500 text-sm"
                  onClick={() => {
                    setReferenceImage(null);
                    setReferenceImagePreview(null);
                  }}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          {/* Required dropdowns - Made more mobile-friendly */}
          <div className="grid grid-cols-1 gap-4">
            {renderDropdown(
              "overall-style",
              'Overall Style',
              overallStyle,
              (e) => setOverallStyle(e.target.value),
              overallStyleOptions,
              true
            )}
            
            {renderDropdown(
              "color-scheme",
              'Color Scheme',
              colorScheme,
              (e) => setColorScheme(e.target.value),
              colorSchemeOptions,
              true
            )}
            
            {renderDropdown(
              "symbol-focus",
              'Symbol or Icon Focus',
              symbolFocus,
              (e) => setSymbolFocus(e.target.value),
              symbolFocusOptions,
              true
            )}
            
            {renderDropdown(
              "brand-personality",
              'Brand Personality',
              brandPersonality,
              (e) => setBrandPersonality(e.target.value),
              brandPersonalityOptions,
              true
            )}
            
            {renderDropdown(
              "industry",
              'Industry/Niche',
              industry,
              (e) => setIndustry(e.target.value),
              industryOptions,
              true
            )}
          </div>
        </div>

        {/* Advanced Options Toggle - Mobile friendly with larger touch target */}
        <div className="mb-2 sm:mb-3">
          <button
            type="button"
            onClick={toggleAdvancedOptions}
            className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center p-2 -ml-2 rounded-md transition"
            style={{ minHeight: '44px' }}
          >
            <span className="mr-2">{showAdvanced ? '−' : '+'}</span>
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {/* Advanced Options Section with Animation */}
        <div 
          className={`advanced-options-container ${showAdvanced ? 'expanded' : ''}`}
          ref={advancedSectionRef}
        >
          <div className="mb-2 sm:mb-3">
            <h3 className="text-lg font-medium mb-2">Advanced Options</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {renderDropdown(
                "typography",
                'Typography Style',
                typographyStyle,
                (e) => setTypographyStyle(e.target.value),
                typographyStyleOptions
              )}
              
              {renderDropdown(
                "line-style",
                'Line & Stroke Style',
                lineStyle,
                (e) => setLineStyle(e.target.value),
                lineStyleOptions
              )}
              
              {renderDropdown(
                "composition",
                'Composition/Layout',
                composition,
                (e) => setComposition(e.target.value),
                compositionOptions
              )}
              
              {renderDropdown(
                "shape",
                'Shape Emphasis',
                shapeEmphasis,
                (e) => setShapeEmphasis(e.target.value),
                shapeEmphasisOptions
              )}
              
              {renderDropdown(
                "texture",
                'Texture & Finish',
                texture,
                (e) => setTexture(e.target.value),
                textureOptions
              )}
              
              {renderDropdown(
                "complexity",
                'Complexity Level',
                complexityLevel,
                (e) => setComplexityLevel(e.target.value),
                complexityLevelOptions
              )}
              
              {renderDropdown(
                "application",
                'Application Context',
                applicationContext,
                (e) => setApplicationContext(e.target.value),
                applicationContextOptions
              )}
            </div>
          </div>
        </div>

        {/* Usage Limits Information - only show for standard informational purposes */}
        {isRevision && (
          <div className="text-sm text-gray-600 mb-4">
            <p>This will count as a revision of your original logo.</p>
            <p>You are allowed up to 3 free revisions per logo.</p>
          </div>
        )}

        {/* Generate Button - Mobile optimized size */}
        <button
          type="button"
          className="btn-primary w-full"
          disabled={
            isGenerating || 
            !areRequiredFieldsFilled() || 
            !isLoggedIn
          }
          onClick={handleGenerateLogo}
          style={{ minHeight: '48px' }}
        >
          {isGenerating ? 'Generating Logo...' : 
           !isLoggedIn ? 'Login to Generate' :
           isRevision ? 'Generate Revision' : 
           'Generate Logo'}
        </button>

        {/* Loading indicator text */}
        {isGenerating && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Logo generation can take 15-30 seconds. Please be patient...
          </p>
        )}
      </form>

      {/* The modal needs to be rendered at the document root level to ensure proper z-index and positioning */}
      <LimitReachedModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        isRevision={isRevision}
      />
    </div>
  );
}