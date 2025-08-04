'use client';

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { 
  saveLogo, 
  getLogo, 
  LogoParameters, 
  canCreateOriginalLogo, 
  canCreateRevision,
  syncUserUsageWithDynamoDB
} from '@/app/utils/indexedDBUtils';

function useEditParam() {
  const searchParams = useSearchParams();
  return searchParams.get('edit');
}

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
  const { isLoggedIn, loading: authLoading } = useAuthCheck();
  const { updateUser } = useAuth();
  const router = useRouter();
  const editLogoId = useEditParam();
  
  const [isRevision, setIsRevision] = useState(false);
  const [originalLogoId, setOriginalLogoId] = useState<string | undefined>(undefined);
  
  const [companyName, setCompanyName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [overallStyle, setOverallStyle] = useState('');
  const [colorScheme, setColorScheme] = useState('');
  const [symbolFocus, setSymbolFocus] = useState('');
  const [brandPersonality, setBrandPersonality] = useState('');
  const [industry, setIndustry] = useState('');
  
  const [typographyStyle, setTypographyStyle] = useState('');
  const [lineStyle, setLineStyle] = useState('');
  const [composition, setComposition] = useState('');
  const [shapeEmphasis, setShapeEmphasis] = useState('');
  const [texture, setTexture] = useState('');
  const [complexityLevel, setComplexityLevel] = useState('');
  const [applicationContext, setApplicationContext] = useState('');
  
  // Add special instructions state
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canCreateLogo, setCanCreateLogo] = useState(true);
  const [canRevise, setCanRevise] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Custom color state
  const [customColors, setCustomColors] = useState<string[]>(['#6366f1']);

  const useReferenceParam = () => {
    const searchParams = useSearchParams();
    return searchParams?.get('reference') || null;
  };
  
  const referenceLogoId = useReferenceParam();

  // Check if user can perform actions
  useEffect(() => {
    const checkLimits = async () => {
      if (isLoggedIn) {
        const canCreate = await canCreateOriginalLogo();
        setCanCreateLogo(canCreate);
        
        if (originalLogoId) {
          const canCreateRevision_ = await canCreateRevision(originalLogoId);
          setCanRevise(canCreateRevision_);
        }
      }
    };
    
    checkLimits();
  }, [isLoggedIn, originalLogoId]);

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
            setSlogan(params.slogan || '');
            setOverallStyle(params.overallStyle || '');
            setColorScheme(params.colorScheme || '');
            setSymbolFocus(params.symbolFocus || '');
            setBrandPersonality(params.brandPersonality || '');
            setIndustry(params.industry || '');
            
            // Check if we need to show advanced options
            if (
              params.typographyStyle || 
              params.lineStyle || 
              params.composition || 
              params.shapeEmphasis || 
              params.texture || 
              params.complexityLevel || 
              params.applicationContext ||
              params.specialInstructions
            ) {
              setShowAdvanced(true);
            }
            
            setTypographyStyle(params.typographyStyle || '');
            setLineStyle(params.lineStyle || '');
            setComposition(params.composition || '');
            setShapeEmphasis(params.shapeEmphasis || '');
            setTexture(params.texture || '');
            setComplexityLevel(params.complexityLevel || '');
            setApplicationContext(params.applicationContext || '');
            setSpecialInstructions(params.specialInstructions || ''); // Add this line
            
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
          setError('Failed to load logo data for editing');
        } finally {
          setLoading(false);
        }
      };
      
      loadLogoData();
    }
  }, [editLogoId, setLoading, setError]);

  useEffect(() => {
    if (referenceLogoId && !editLogoId) {
      const loadReferenceLogoData = async () => {
        try {
          setLoading(true);
          const logoData = await getLogo(referenceLogoId);
          
          if (logoData) {
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
            
            setIsRevision(false);
            setOriginalLogoId(undefined);
          }
        } catch (err) {
          setError('Failed to load reference logo data');
        } finally {
          setLoading(false);
        }
      };
      
      loadReferenceLogoData();
    }
  }, [referenceLogoId, editLogoId, setLoading, setError]);

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

  const overallStyleOptions = [
    'Modern', 'Contemporary', 'Abstract', 'Classical', 
    'Hi-Tech', 'Minimalist', 'Vintage', 'Geometric', 'Hand-Drawn'
  ];
  
  const colorSchemeOptions = [
    'Pastels', 'Primary Colors', 'Neon', 'Grey Tones', 
    'Monochrome', 'Metallics', 'Earthy Tones', 'Black & White', 'Gradient Blends',
    'Custom Colors'
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
      }, 300);
    } else {
      setShowAdvanced(true);
    }
  }, [showAdvanced]);

  const addCustomColor = useCallback(() => {
    if (customColors.length < 3) {
      setCustomColors([...customColors, '#000000']);
    }
  }, [customColors]);

  const removeCustomColor = useCallback((index: number) => {
    setCustomColors(customColors.filter((_, i) => i !== index));
  }, [customColors]);

  const updateCustomColor = useCallback((index: number, color: string) => {
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
  }, [customColors]);

  // Updated buildPrompt function to include special instructions alongside other parameters
  const buildPrompt = useCallback(() => {
    let prompt = `Create a logo with the following characteristics:\n`;
    prompt += `Company Name: ${companyName}\n`;
    if (slogan) {
      prompt += `Slogan/Subtitle: ${slogan}\n`;
    }
    prompt += `Style: ${overallStyle}\n`;
    
    // Handle custom colors
    if (colorScheme === 'Custom Colors' && customColors.length > 0) {
      prompt += `Colors: Use these specific colors - ${customColors.join(', ')}\n`;
    } else {
      prompt += `Colors: ${colorScheme}\n`;
    }
    
    prompt += `Symbol Type: ${symbolFocus}\n`;
    prompt += `Brand Personality: ${brandPersonality}\n`;
    
    if (industry) prompt += `Industry: ${industry}\n`;
    if (typographyStyle) prompt += `Typography: ${typographyStyle}\n`;
    if (lineStyle) prompt += `Line Style: ${lineStyle}\n`;
    if (composition) prompt += `Composition: ${composition}\n`;
    if (shapeEmphasis) prompt += `Shape Emphasis: ${shapeEmphasis}\n`;
    if (texture) prompt += `Texture: ${texture}\n`;
    if (complexityLevel) prompt += `Complexity: ${complexityLevel}\n`;
    if (applicationContext) prompt += `Application Context: ${applicationContext}\n`;
    
    // Add special instructions as additional requirements if provided
    if (specialInstructions && specialInstructions.trim()) {
      prompt += `\nAdditional Requirements (these should take precedence over previous options): ${specialInstructions.trim()}\n`;
    }
    
    prompt += `\nMake it a high-quality, professional logo suitable for business use.`;
    
    return prompt;
  }, [
    companyName, slogan, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext, customColors, specialInstructions
  ]);

  const collectParameters = useCallback((): LogoParameters => {
    return {
      companyName,
      slogan: slogan || undefined,
      overallStyle,
      colorScheme: colorScheme === 'Custom Colors' && customColors.length > 0 
        ? `Use these specific colors - ${customColors.join(', ')}`
        : colorScheme,
      symbolFocus,
      brandPersonality,
      industry,
      typographyStyle: typographyStyle || undefined,
      lineStyle: lineStyle || undefined,
      composition: composition || undefined,
      shapeEmphasis: shapeEmphasis || undefined,
      texture: texture || undefined,
      complexityLevel: complexityLevel || undefined,
      applicationContext: applicationContext || undefined,
      specialInstructions: specialInstructions || undefined // Add this line
    };
  }, [
    companyName, slogan, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext, customColors, specialInstructions // Add this dependency
  ]);

  const areRequiredFieldsFilled = useCallback(() => {
    return (
      companyName &&
      overallStyle &&
      colorScheme &&
      symbolFocus &&
      brandPersonality
    );
  }, [
    companyName,
    overallStyle,
    colorScheme,
    symbolFocus,
    brandPersonality
  ]);

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

      formData.append('isRevision', isRevision.toString());
      
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
        } catch {}
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      let imageDataUriString = '';
      if (data?.image?.type === 'base64') {
        imageDataUriString = `data:image/png;base64,${data.image.data}`;
      } else if (data?.image?.type === 'url') {
        imageDataUriString = data.image.data;
      } else if (data?.data?.[0]?.b64_json) {
        imageDataUriString = `data:image/png;base64,${data.data[0].b64_json}`;
      } else if (data?.data?.[0]?.url) {
        imageDataUriString = data.data[0].url;
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
      
      if (data.usage && updateUser) {
        updateUser({
          logosCreated: data.usage.logosCreated,
          logosLimit: data.usage.logosLimit,
          remainingLogos: data.usage.remainingLogos
        });
      }
      
      router.push(`/logos/${logoId}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      if (errorMessage.includes('reached your logo generation limit') || 
          errorMessage.includes('Logo Limit Reached') ||
          errorMessage.includes('Maximum logo limit reached')) {
        setShowLimitModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [
    isLoggedIn,
    isGenerating,
    areRequiredFieldsFilled,
    buildPrompt,
    collectParameters,
    setLoading,
    setError,
    setImageDataUri,
    referenceImage,
    router,
    isRevision,
    originalLogoId,
    companyName,
    canRevise,
    canCreateLogo,
    updateUser
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
      <div style={{ marginBottom: 'var(--space-sm)' }}>
        <label htmlFor={id} className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
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
      <div className={`card generator-form text-center ${showAdvanced || referenceImagePreview || colorScheme === 'Custom Colors' ? '' : 'fixed'}`}>
        {authLoading && (
          <div className="text-center" style={{ padding: 'var(--space-md)' }}>
            <div className="spinner inline-block"></div>
            <p className="mt-sm" style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)' }}>
              Checking authentication...
            </p>
          </div>
        )}
        
        {!authLoading && (
          <div>
            <h3 style={{ 
              fontSize: 'var(--text-lg)', 
              fontWeight: '500', 
              marginBottom: 'var(--space-sm)',
              marginTop: '0'
            }}>
              {isRevision ? 'Revise Logo' : referenceLogoId ? 'Create New Logo' : 'Generate Logo'}
            </h3>

            {/* Company Name Field */}
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <label htmlFor="company-name" className="form-label">
                Company Name <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                id="company-name"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                required
                disabled={isGenerating}
              />
            </div>

            {/* Slogan Field */}
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <label htmlFor="slogan" className="form-label">
                Slogan/Subtitle (Optional)
              </label>
              <input
                type="text"
                id="slogan"
                className="form-input"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Enter your slogan (optional)"
                disabled={isGenerating}
              />
            </div>

            {/* Reference Image Upload */}
            {referenceImagePreview && (
              <div className="reference-image-container">
                <img
                  src={referenceImagePreview}
                  alt="Reference"
                  className="reference-image-preview"
                />
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <label htmlFor="reference-image" className="form-label">
                Reference Image {
                  editLogoId ? '(Current Logo)' : 
                  referenceLogoId ? '(Using Selected Logo)' : 
                  '(Optional)'
                }
              </label>
              <label 
                className="block"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 'var(--space-xs)',
                  border: '2px dashed var(--color-gray-300)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  width: '100%',
                  height: '2rem',
                  margin: '0 auto',
                  fontSize: 'var(--text-sm)'
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
                  {referenceImage ? 'Change reference image' : 'Upload reference image'}
                </span>
                <input
                  type="file"
                  id="reference-image"
                  onChange={handleReferenceImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={isGenerating}
                />
              </label>
            </div>

            {/* Required Basic Options */}
            {renderDropdown(
              "overall-style",
              'Overall Style',
              overallStyle,
              (e) => setOverallStyle(e.target.value),
              overallStyleOptions,
              true
            )}

            {/* Color Scheme with Custom Colors */}
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <label htmlFor="color-scheme" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
                Color Scheme <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="color-scheme"
                className="form-select"
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
                required
                disabled={isGenerating}
              >
                <option value="">-- Select Color Scheme --</option>
                {colorSchemeOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              
              {colorScheme === 'Custom Colors' && (
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <p style={{ 
                    fontSize: 'var(--text-sm)', 
                    fontWeight: '500', 
                    marginBottom: 'var(--space-xs)',
                    color: 'var(--color-gray-700)'
                  }}>
                    Custom Colors
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {customColors.map((color, index) => (
                      <div key={index} style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateCustomColor(index, e.target.value)}
                          disabled={isGenerating}
                          style={{
                            width: '40px',
                            height: '30px',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => updateCustomColor(index, e.target.value)}
                          disabled={isGenerating}
                          style={{
                            flex: 1,
                            padding: 'var(--space-xs) var(--space-sm)',
                            border: '1px solid var(--color-gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'monospace'
                          }}
                        />
                        {customColors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomColor(index)}
                            disabled={isGenerating}
                            style={{
                              padding: 'var(--space-xs)',
                              color: 'var(--color-error)',
                              backgroundColor: 'white',
                              border: '1px solid var(--color-gray-300)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: 'var(--text-sm)',
                              minWidth: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {customColors.length < 3 && (
                      <button
                        type="button"
                        onClick={addCustomColor}
                        disabled={isGenerating}
                        style={{
                          marginTop: 'var(--space-xs)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          color: 'var(--color-primary)',
                          backgroundColor: 'white',
                          border: '1px dashed var(--color-primary)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontSize: 'var(--text-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'var(--space-xs)'
                        }}
                      >
                        <span style={{ fontSize: '1.2em' }}>+</span> Add Color ({customColors.length}/3)
                      </button>
                    )}
                  </div>
                  
                  <p style={{ 
                    fontSize: 'var(--text-xs)', 
                    color: 'var(--color-gray-600)', 
                    marginTop: 'var(--space-xs)',
                    marginBottom: 0
                  }}>
                    Select up to 3 colors for your logo design
                  </p>
                </div>
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
            </div>

            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <button
                type="button"
                onClick={toggleAdvancedOptions}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: 'var(--space-xs)',
                  borderRadius: 'var(--radius-md)',
                  minHeight: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  fontSize: 'var(--text-sm)'
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
                  marginBottom: 'var(--space-sm)' 
                }}>
                  Advanced Options
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0', margin: '0 auto' }}>
                  
                  {renderDropdown(
                    "industry",
                    'Industry/Niche',
                    industry,
                    (e) => setIndustry(e.target.value),
                    industryOptions
                  )}

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

                  {/* Special Instructions Field */}
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label 
                      htmlFor="special-instructions" 
                      style={{ 
                        display: 'block', 
                        marginBottom: 'var(--space-xs)', 
                        fontWeight: '500',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-gray-700)'
                      }}
                    >
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      id="special-instructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Enter any additional specific details or requirements for your logo design..."
                      rows={3}
                      disabled={isGenerating}
                      style={{
                        width: '100%',
                        padding: 'var(--space-sm)',
                        border: '1px solid var(--color-gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        minHeight: '80px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {isRevision && (
              <div style={{ 
                fontSize: 'var(--text-xs)', 
                color: 'var(--color-gray-600)', 
                marginBottom: 'var(--space-sm)',
                lineHeight: '1.3'
              }}>
                <p>This will count as a revision of your original logo.</p>
                <p>You are allowed up to 3 free revisions per logo.</p>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{ 
                width: '100%',
                marginBottom: '0'
              }}
              disabled={
                isGenerating || 
                !areRequiredFieldsFilled() || 
                !isLoggedIn
              }
              onClick={handleGenerateLogo}
            >
              {isGenerating 
                ? 'Generating Logo...' 
                : !isLoggedIn 
                  ? 'Login to Generate' 
                  : isRevision 
                    ? 'Generate Revision' 
                    : 'Generate Logo'}
            </button>

            {isGenerating && (
              <p className="text-center" style={{ 
                fontSize: 'var(--text-xs)', 
                color: 'var(--color-gray-500)',
                marginTop: 'var(--space-xs)',
                marginBottom: '0'
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
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            padding: 'var(--space-md)'
          }}>
            <div className="card text-center" style={{
              maxWidth: '28rem',
              width: '100%',
              padding: 'var(--space-lg)'
            }}>
              <div className="text-center mb-md">
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '3rem', height: '3rem', margin: '0 auto', color: '#eab308' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '600', marginTop: 'var(--space-sm)' }}>
                  {isRevision ? "Maximum Revisions Reached" : "Logo Limit Reached"}
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
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: 'white',
                    color: 'var(--color-gray-700)',
                    border: '1px solid var(--color-gray-300)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  Close
                </button>
                
                <Link
                  href="/purchase"
                  className="btn btn-primary"
                >
                  Purchase Logos
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}