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
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/user');
        
        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setUserInfo(userData);
          
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

interface GenerateFormProps {
  setLoading: (loading: boolean) => void;
  setImageDataUri: (dataUri: string | null) => void;
  setError: (error: string | null) => void;
}

export default function GenerateForm({ setLoading, setImageDataUri, setError }: GenerateFormProps) {
  const { isLoggedIn, userInfo, loading: authLoading } = useAuthCheck();
  const router = useRouter();
  const editLogoId = useEditParam();
  
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
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canCreateLogo, setCanCreateLogo] = useState(true);
  const [canRevise, setCanRevise] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Check usage limits when component loads
  useEffect(() => {
    const checkUsageLimits = async () => {
      try {
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

  useEffect(() => {
  // Add/remove classes to control scrolling on the main content
  const mainContent = document.querySelector('.main-content');
  const generatorPage = document.querySelector('.generator-page');
  
  if (mainContent && generatorPage) {
    if (showAdvanced) {
      // Allow scrolling when advanced options are shown
      generatorPage.classList.add('allow-scroll');
    } else {
      // Fixed layout when advanced options are hidden
      generatorPage.classList.remove('allow-scroll');
    }
  }
  
  return () => {
    // Cleanup - ensure scrolling is enabled when component unmounts
    if (generatorPage) {
      generatorPage.classList.add('allow-scroll');
    }
  };
}, [showAdvanced]);

  // Load logo data if editing
  useEffect(() => {
    if (editLogoId) {
      const loadLogoData = async () => {
        try {
          setLoading(true);
          const logoData = await getLogo(editLogoId);
          
          if (logoData) {
            const params = logoData.parameters;
            setCompanyName(params.companyName || '');
            setOverallStyle(params.overallStyle || '');
            setColorScheme(params.colorScheme || '');
            setSymbolFocus(params.symbolFocus || '');
            setBrandPersonality(params.brandPersonality || '');
            setIndustry(params.industry || '');
            
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
            
            if (logoData.imageDataUri) {
              setReferenceImagePreview(logoData.imageDataUri);
              
              try {
                const response = await fetch(logoData.imageDataUri);
                const blob = await response.blob();
                const file = new File([blob], 'reference-logo.png', { type: 'image/png' });
                setReferenceImage(file);
              } catch (err) {
                console.error('Error converting data URI to File:', err);
              }
            }
            
            if (logoData.isRevision && logoData.originalLogoId) {
              setIsRevision(true);
              setOriginalLogoId(logoData.originalLogoId);
              const canReviseMore = await canCreateRevision(logoData.originalLogoId);
              setCanRevise(canReviseMore);
            } else {
              setIsRevision(true);
              setOriginalLogoId(logoData.id);
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

  // Options data
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
  if (showAdvanced) {
    setIsAnimating(true);
    setTimeout(() => {
      setShowAdvanced(false);
      setIsAnimating(false);
    }, 300); // Match animation duration
  } else {
    setShowAdvanced(true);
  }
}, [showAdvanced]);

  const buildPrompt = useCallback(() => {
    let prompt = `Create a logo with the following characteristics:\n`;
    prompt += `Company Name: ${companyName}\n`;
    prompt += `Style: ${overallStyle}\n`;
    prompt += `Colors: ${colorScheme}\n`;
    prompt += `Symbol Type: ${symbolFocus}\n`;
    prompt += `Brand Personality: ${brandPersonality}\n`;
    prompt += `Industry: ${industry}\n`;
    
    if (typographyStyle) prompt += `Typography: ${typographyStyle}\n`;
    if (lineStyle) prompt += `Line Style: ${lineStyle}\n`;
    if (composition) prompt += `Composition: ${composition}\n`;
    if (shapeEmphasis) prompt += `Shape Emphasis: ${shapeEmphasis}\n`;
    if (texture) prompt += `Texture: ${texture}\n`;
    if (complexityLevel) prompt += `Complexity: ${complexityLevel}\n`;
    if (applicationContext) prompt += `Application Context: ${applicationContext}\n`;
    
    prompt += `Make it a high-quality, professional logo suitable for business use.`;
    
    return prompt;
  }, [
    companyName, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext
  ]);

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
    if (!isLoggedIn) {
      router.push('/login?redirect=/');
      return;
    }

    if (isGenerating || !areRequiredFieldsFilled()) {
      return;
    }
    
    if (isRevision && !canRevise) {
      setShowLimitModal(true);
      return;
    }
    
    if (!isRevision && !canCreateLogo) {
      setShowLimitModal(true);
      return;
    }
    
    const prompt = buildPrompt();
    
    setLoading(true);
    setError(null);
    setImageDataUri(null);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      
      if (referenceImage) {
        formData.append('referenceImage', referenceImage);
      }

      if (isRevision && originalLogoId) {
        formData.append('originalLogoId', originalLogoId);
      }

      const response = await fetch('/logos', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error generating image (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {}
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      let imageDataUriString = '';
      if (data.image.type === 'base64') {
        imageDataUriString = `data:image/png;base64,${data.image.data}`;
      } else if (data.image.type === 'url') {
        imageDataUriString = data.image.data;
      } else {
        throw new Error('No image data received in the expected format');
      }
      
      const parameters = collectParameters();
      const logoId = await saveLogo(
        imageDataUriString, 
        parameters,
        isRevision ? originalLogoId : undefined,
        companyName
      );
      
      setImageDataUri(imageDataUriString);
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

  const renderDropdown = useCallback((
    id: string,
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    options: string[],
    required: boolean = false
  ) => {
    return (
      <div className="mb-md">
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
        <select
          id={id}
          className="form-select"
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
    <div className="generator-form-container">
      <div className={`card generator-form ${showAdvanced ? '' : 'fixed'}`}></div>
      {authLoading && (
        <div className="text-center" style={{ padding: 'var(--space-lg)' }}>
          <div className="spinner inline-block"></div>
          <p className="mt-sm" style={{ color: 'var(--color-gray-600)' }}>Checking authentication...</p>
        </div>
      )}
      
      {!authLoading && (
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '500', marginBottom: 'var(--space-md)' }}>
            {isRevision ? 'Revise Logo' : 'Create New Logo'}
          </h3>

          <div className="mb-md">
            <label htmlFor="company-name" className="form-label">
              Company Name <span style={{ color: 'var(--color-error)' }}>*</span>
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

          <div className="mb-md">
            <label htmlFor="reference-image" className="form-label">
              Reference Image {isRevision ? '(Current Logo)' : '(Optional)'}
            </label>
            <label 
              className="block"
              style={{
                padding: 'var(--space-sm)',
                border: '2px dashed var(--color-gray-300)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                minHeight: 'var(--touch-target)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-gray-300)';
                e.currentTarget.style.color = 'inherit';
              }}
            >
              <span style={{ color: 'var(--color-gray-500)' }}>
                {referenceImage ? referenceImage.name : 'Tap to upload an image'}
              </span>
              <input
                id="reference-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReferenceImageChange}
                disabled={isGenerating}
                style={{ display: 'none' }}
              />
            </label>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-xs)' }}>
              {isRevision 
                ? 'The current logo is used as a reference for the revision'
                : 'Upload an image for inspiration'}
            </p>
            
            {referenceImagePreview && (
              <div className="text-center mt-md">
                <img
                  src={referenceImagePreview}
                  alt="Reference image preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '10rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)',
                    margin: '0 auto'
                  }}
                />
                <button
                  type="button"
                  className="mt-sm"
                  style={{
                    color: 'var(--color-error)',
                    fontSize: 'var(--text-sm)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-xs)' }}>
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

          <div className="mb-md">
            <button
              type="button"
              onClick={toggleAdvancedOptions}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: '500',
                cursor: 'pointer',
                padding: 'var(--space-sm)',
                marginLeft: '-var(--space-sm)',
                borderRadius: 'var(--radius-md)',
                minHeight: 'var(--touch-target)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}
            >
              <span>{showAdvanced ? '−' : '+'}</span>
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </button>
          </div>

          {showAdvanced && (
            <div className={`advanced-options ${isAnimating ? 'hiding' : ''}`}>
              <h3 style={{ 
                fontSize: 'var(--text-lg)', 
                fontWeight: '500', 
                marginBottom: 'var(--space-md)' 
              }}>
                Advanced Options
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-xs)' }}>
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
          )}

          {isRevision && (
            <div style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--color-gray-600)', 
              marginBottom: 'var(--space-md)' 
            }}>
              <p>This will count as a revision of your original logo.</p>
              <p>You are allowed up to 3 free revisions per logo.</p>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={
              isGenerating || 
              !areRequiredFieldsFilled() || 
              !isLoggedIn
            }
            onClick={handleGenerateLogo}
          >
            {isGenerating ? 'Generating Logo...' : 
             !isLoggedIn ? 'Login to Generate' :
             isRevision ? 'Generate Revision' : 
             'Generate Logo'}
          </button>

          {isGenerating && (
            <p className="text-center mt-sm" style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--color-gray-500)' 
            }}>
              Logo generation can take 15-30 seconds. Please be patient...
            </p>
          )}
        </div>
      )}

      {showLimitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 'var(--space-md)'
        }}>
          <div className="card" style={{
            maxWidth: '28rem',
            width: '100%',
            padding: 'var(--space-lg)'
          }}>
            <div className="text-center mb-md">
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '3rem', height: '3rem', margin: '0 auto', color: '#eab308' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '600', marginTop: 'var(--space-sm)' }}>
                {isRevision 
                  ? "Maximum Revisions Reached" 
                  : "Logo Limit Reached"}
              </h3>
            </div>
            
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-lg)' }}>
              {isRevision 
                ? "You've reached the maximum of 3 revisions for this logo." 
                : "You've reached your logo creation limit. Please purchase more logos."}
            </p>
            
            <div className="flex gap-sm" style={{ justifyContent: 'center' }}>
              <button
                onClick={() => setShowLimitModal(false)}
                className="btn"
                style={{
                  backgroundColor: 'white',
                  color: 'var(--color-gray-700)',
                  border: '1px solid var(--color-gray-300)'
                }}
              >
                Close
              </button>
              
              <Link
                href="/account"
                className="btn btn-primary"
              >
                Go to Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}