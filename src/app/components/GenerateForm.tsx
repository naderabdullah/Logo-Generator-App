'use client';

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext'; // ADDED: Import useAuth
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
  const { isLoggedIn, loading: authLoading } = useAuthCheck();
  const { updateUser } = useAuth(); // ADDED: Get updateUser from context
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
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canCreateLogo, setCanCreateLogo] = useState(true);
  const [canRevise, setCanRevise] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Custom color state
  const [customColors, setCustomColors] = useState<string[]>(['#6366f1']);

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

  // Simple mobile check for other features
  useEffect(() => {
    const generatorPage = document.querySelector('.generator-page');
    if (generatorPage && !generatorPage.classList.contains('allow-scroll')) {
      generatorPage.classList.add('allow-scroll');
    }
  }, []);

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
            
            // Check if color scheme contains custom colors
            if (params.colorScheme && params.colorScheme.includes('Use these specific colors')) {
              setColorScheme('Custom Colors');
              // Extract colors from the saved prompt
              const colorMatch = params.colorScheme.match(/#[0-9A-F]{6}/gi);
              if (colorMatch) {
                setCustomColors(colorMatch);
              }
            }
            
            if (
              params.typographyStyle || 
              params.lineStyle || 
              params.composition || 
              params.shapeEmphasis || 
              params.texture || 
              params.complexityLevel || 
              params.applicationContext
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
    companyName, slogan, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext, customColors
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
      applicationContext: applicationContext || undefined
    };
  }, [
    companyName, slogan, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext, customColors
  ]);

  const areRequiredFieldsFilled = useCallback(() => {
    return (
      companyName &&
      overallStyle &&
      colorScheme &&
      symbolFocus &&
      brandPersonality &&
      industry
    );
  }, [
    companyName,
    overallStyle,
    colorScheme,
    symbolFocus,
    brandPersonality,
    industry
  ]);

  // FIXED: Updated handleGenerateLogo function
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

      // FIXED: Add isRevision flag for proper credit handling
      formData.append('isRevision', isRevision.toString());
      
      if (isRevision && originalLogoId) {
        formData.append('originalLogoId', originalLogoId);
      }

      // FIXED: Use /logos endpoint instead of /api/generate
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
      
      // FIXED: Handle the new response format from /logos endpoint
      let imageDataUriString = '';
      if (data?.image?.type === 'base64') {
        imageDataUriString = `data:image/png;base64,${data.image.data}`;
      } else if (data?.image?.type === 'url') {
        imageDataUriString = data.image.data;
      } else if (data?.data?.[0]?.b64_json) {
        // Fallback for old format
        imageDataUriString = `data:image/png;base64,${data.data[0].b64_json}`;
      } else if (data?.data?.[0]?.url) {
        // Fallback for old format
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
      
      // FIXED: Update user context with new usage data from API response
      if (data.usage && updateUser) {
        updateUser({
          logosCreated: data.usage.logosCreated,
          logosLimit: data.usage.logosLimit,
          remainingLogos: data.usage.remainingLogos
        });
      }
      
      router.push(`/logos/${logoId}`);
      
    } catch (error) {
      console.error('Error generating logo:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
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
    updateUser // Now properly imported from useAuth
  ]);

  // Rest of the component remains the same...
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
              {isRevision ? 'Revise Logo' : 'Create New Logo'}
            </h3>

            <div className="mb-sm">
              <label htmlFor="company-name" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
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
                style={{ margin: '0 auto', display: 'block' }}
              />
            </div>

            <div className="mb-sm">
              <label htmlFor="slogan" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
                Slogan/Subtitle (Optional)
              </label>
              <input
                id="slogan"
                type="text"
                className="form-input"
                placeholder="Enter your slogan or subtitle"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                disabled={isGenerating}
                autoComplete="off"
                style={{ margin: '0 auto', display: 'block' }}
              />
            </div>

            <div className="mb-sm">
              <label htmlFor="reference-image" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
                Reference Image {isRevision ? '(Current Logo)' : '(Optional)'}
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
              
              {referenceImagePreview && (
                <div className="text-center" style={{ marginTop: 'var(--space-sm)' }}>
                  <img
                    src={referenceImagePreview}
                    alt="Reference image preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '6rem',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                      margin: '0 auto'
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      color: 'var(--color-error)',
                      fontSize: 'var(--text-xs)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: 'var(--space-xs)'
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0', margin: '0 auto' }}>
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
              
              {/* Custom Color Picker - Only shown when Custom Colors is selected */}
              {colorScheme === 'Custom Colors' && (
                <div style={{ 
                  marginBottom: 'var(--space-sm)',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--color-gray-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-gray-200)'
                }}>
                  <label className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
                    Select Your Colors
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {customColors.map((color, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--space-xs)'
                      }}>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateCustomColor(index, e.target.value)}
                          disabled={isGenerating}
                          style={{
                            width: '50px',
                            height: '40px',
                            border: '1px solid var(--color-gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            if (/^#[0-9A-F]{6}$/i.test(newColor) || newColor.length < 7) {
                              updateCustomColor(index, newColor);
                            }
                          }}
                          placeholder="#000000"
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
              
              {renderDropdown(
                "industry",
                'Industry/Niche',
                industry,
                (e) => setIndustry(e.target.value),
                industryOptions,
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