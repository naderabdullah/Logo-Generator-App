// src/app/components/GenerateForm.tsx - FIXED with transparent background field and reference image fixes
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

interface GenerateFormProps {
  setLoading: (loading: boolean) => void;
  setImageDataUri: (dataUri: string | null) => void;
  setError: (error: string | null) => void;
}

export default function GenerateForm({ setLoading, setImageDataUri, setError }: GenerateFormProps) {
  // FIXED: Use AuthContext instead of duplicate auth checking
  const { user, updateUser } = useAuth();
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
  const [size, setSize] = useState('1024x1024'); 
  
  // ADD: Transparent background field - defaults to true
  const [transparentBackground, setTransparentBackground] = useState(true);

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
  const [error, setLocalError] = useState<string | null>(null); // Add local error state
  
  // Custom color state
  const [customColors, setCustomColors] = useState<string[]>(['#6366f1']);

  const useReferenceParam = () => {
    const searchParams = useSearchParams();
    return searchParams?.get('reference') || null;
  };

  const sizeOptions = [
    { value: '1024x1024', label: 'Square - 1024×1024 - 1:1' },
    { value: '1024x1536', label: 'Portrait - 1024×1536 - 2:3' },
    { value: '1536x1024', label: 'Landscape - 1536×1024 - 3:2' }
  ];
  
  const referenceLogoId = useReferenceParam();

  // Check if user can perform actions
  useEffect(() => {
    const checkLimits = async () => {
      // FIXED: Use user from AuthContext
      if (user?.email) {
        try {
          // FIXED: Pass userId to canCreateOriginalLogo
          const canCreate = await canCreateOriginalLogo(user.email);
          setCanCreateLogo(canCreate);
          
          if (originalLogoId) {
            // FIXED: Pass userId to canCreateRevision
            const canCreateRevision_ = await canCreateRevision(originalLogoId, user.email);
            setCanRevise(canCreateRevision_);
          }
        } catch (error) {
          console.error('Error checking user limits:', error);
        }
      }
    };
    
    checkLimits();
  }, [user?.email, originalLogoId]);

  // Load logo for editing if editLogoId is provided
  useEffect(() => {
    const loadLogoForEdit = async () => {
      if (editLogoId && user?.email) {
        try {
          // FIXED: Pass userId to getLogo for user verification
          const logoData = await getLogo(editLogoId, user.email);
          if (logoData) {
            // Populate form fields with logo data
            setCompanyName(logoData.parameters.companyName || '');
            setSlogan(logoData.parameters.slogan || '');
            setSize(logoData.parameters.size || '1024x1024'); 
            setOverallStyle(logoData.parameters.overallStyle || '');
            setColorScheme(logoData.parameters.colorScheme || '');
            setSymbolFocus(logoData.parameters.symbolFocus || '');
            setBrandPersonality(logoData.parameters.brandPersonality || '');
            setIndustry(logoData.parameters.industry || '');
            setTypographyStyle(logoData.parameters.typographyStyle || '');
            setLineStyle(logoData.parameters.lineStyle || '');
            setComposition(logoData.parameters.composition || '');
            setShapeEmphasis(logoData.parameters.shapeEmphasis || '');
            setTexture(logoData.parameters.texture || '');
            setComplexityLevel(logoData.parameters.complexityLevel || '');
            setApplicationContext(logoData.parameters.applicationContext || '');
            setSpecialInstructions(logoData.parameters.specialInstructions || '');
            setTransparentBackground(logoData.parameters.transparentBackground === 'false' ? false : true); // ADD: Load transparent background
            
            // FIXED: Set the logo image as reference image for revision
            setReferenceImagePreview(logoData.imageDataUri);
            
            // Convert the image data to a File object for reference
            try {
              const response = await fetch(logoData.imageDataUri);
              const blob = await response.blob();
              const file = new File([blob], 'reference-logo.png', { type: 'image/png' });
              setReferenceImage(file);
            } catch (err) {
              console.error('Error converting logo to reference file:', err);
            }
            
            // Set as revision if this logo has an originalLogoId
            if (logoData.originalLogoId) {
              setIsRevision(true);
              setOriginalLogoId(logoData.originalLogoId);
            } else {
              // This is an original logo, set it up for creating revisions
              setIsRevision(true);
              setOriginalLogoId(editLogoId);
            }
          }
        } catch (error) {
          console.error('Error loading logo for edit:', error);
          setLocalError('Failed to load logo for editing');
        }
      }
    };

    loadLogoForEdit();
  }, [editLogoId, user?.email]);

  // Load reference logo data if referenceLogoId is provided
  useEffect(() => {
    const loadReferenceData = async () => {
      if (referenceLogoId && user?.email) {
        try {
          // FIXED: Pass userId to getLogo for user verification
          const referenceData = await getLogo(referenceLogoId, user.email);
          if (referenceData) {
            // Pre-populate form with reference data but don't set as revision
            setCompanyName(referenceData.parameters.companyName || '');
            setSlogan(referenceData.parameters.slogan || '');
            setSize(referenceData.parameters.size || '1024x1024');
            setOverallStyle(referenceData.parameters.overallStyle || '');
            setColorScheme(referenceData.parameters.colorScheme || '');
            setSymbolFocus(referenceData.parameters.symbolFocus || '');
            setBrandPersonality(referenceData.parameters.brandPersonality || '');
            setIndustry(referenceData.parameters.industry || '');
            setTypographyStyle(referenceData.parameters.typographyStyle || '');
            setLineStyle(referenceData.parameters.lineStyle || '');
            setComposition(referenceData.parameters.composition || '');
            setShapeEmphasis(referenceData.parameters.shapeEmphasis || '');
            setTexture(referenceData.parameters.texture || '');
            setComplexityLevel(referenceData.parameters.complexityLevel || '');
            setApplicationContext(referenceData.parameters.applicationContext || '');
            setSpecialInstructions(referenceData.parameters.specialInstructions || '');
            setTransparentBackground(referenceData.parameters.transparentBackground === 'false' ? false : true); // ADD: Load transparent background
            
            // FIXED: Set the logo image as reference image for similar logo
            setReferenceImagePreview(referenceData.imageDataUri);
            
            // Convert the image data to a File object for reference
            try {
              const response = await fetch(referenceData.imageDataUri);
              const blob = await response.blob();
              const file = new File([blob], 'reference-logo.png', { type: 'image/png' });
              setReferenceImage(file);
            } catch (err) {
              console.error('Error converting logo to reference file:', err);
            }
          }
        } catch (error) {
          console.error('Error loading reference logo:', error);
        }
      }
    };

    loadReferenceData();
  }, [referenceLogoId, user?.email]);

  // Original styling preserved - toggle advanced options function
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

  // Original styling preserved - custom color functions
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

  // Updated buildPrompt function to include transparent background and special instructions
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
    
    prompt += `Symbol Focus: ${symbolFocus}\n`;
    prompt += `Brand Personality: ${brandPersonality}\n`;
    
    // ADD: Include transparent background requirement
    if (transparentBackground) {
      prompt += `Background: Transparent background (no background color or elements)\n`;
    } else {
      prompt += `Background: Include background color or design elements\n`;
    }
    
    // Add advanced parameters if specified
    if (industry) prompt += `Industry: ${industry}\n`;
    if (typographyStyle) prompt += `Typography: ${typographyStyle}\n`;
    if (lineStyle) prompt += `Line Style: ${lineStyle}\n`;
    if (composition) prompt += `Composition: ${composition}\n`;
    if (shapeEmphasis) prompt += `Shape Emphasis: ${shapeEmphasis}\n`;
    if (texture) prompt += `Texture: ${texture}\n`;
    if (complexityLevel) prompt += `Complexity: ${complexityLevel}\n`;
    if (applicationContext) prompt += `Application: ${applicationContext}\n`;
    if (specialInstructions) prompt += `Special Instructions: ${specialInstructions}\n`;
    
    prompt += `\nThe logo should be professional, memorable, and suitable for various applications. Ensure it's scalable and works well in both color and monochrome.`;
    
    return prompt;
  }, [
    companyName, slogan, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, size, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext, customColors, specialInstructions, transparentBackground // ADD: transparentBackground dependency
  ]);

  const collectParameters = useCallback((): LogoParameters => {
    return {
      companyName,
      slogan: slogan || undefined,
      overallStyle,
      colorScheme: colorScheme === 'Custom Colors' 
        ? `Use these specific colors - ${customColors.join(', ')}`
        : colorScheme,
      symbolFocus,
      brandPersonality,
      industry,
      size,
      typographyStyle: typographyStyle || undefined,
      lineStyle: lineStyle || undefined,
      composition: composition || undefined,
      shapeEmphasis: shapeEmphasis || undefined,
      texture: texture || undefined,
      complexityLevel: complexityLevel || undefined,
      applicationContext: applicationContext || undefined,
      specialInstructions: specialInstructions || undefined,
      transparentBackground: transparentBackground ? 'true' : 'false' // ADD: Include transparent background parameter
    };
  }, [
    companyName, slogan, overallStyle, colorScheme, symbolFocus, 
    brandPersonality, industry, size, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel, 
    applicationContext, customColors, specialInstructions, transparentBackground // ADD: transparentBackground dependency
  ]);

  const areRequiredFieldsFilled = useCallback(() => {
    return (
      companyName &&
      overallStyle &&
      colorScheme &&
      symbolFocus &&
      brandPersonality &&
      (referenceImagePreview || size)
    );
  }, [
    companyName,
    overallStyle,
    colorScheme,
    symbolFocus,
    brandPersonality,
    referenceImagePreview,
    size
  ]);

  const handleGenerateLogo = useCallback(async () => {
    if (!user?.email) {
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
    setLocalError(null); // Clear local error
    setImageDataUri(null);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('size', size);
      formData.append('transparentBackground', transparentBackground.toString()); // ADD: Include transparent background
      
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
      
      // FIXED: Pass userId as first parameter to saveLogo
      const logoId = await saveLogo(
        user.email, // userId first
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
        setLocalError(errorMessage); // Use local error state
        setError(errorMessage); // Still set parent error for any other handling
      }
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [
    user?.email,
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
    size,
    canRevise,
    canCreateLogo,
    updateUser,
    transparentBackground // Keep this since it's used in buildPrompt and collectParameters
  ]);

  // Original renderDropdown function preserved
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

  // Handle reference image upload - preserved original styling
  const handleReferenceImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setLocalError('Reference image must be smaller than 10MB');
        return;
      }
      
      setReferenceImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // FIXED: Remove reference image function - only allow in new logo form, not revision form
  const removeReferenceImage = useCallback(() => {
    if (!isRevision) { // FIXED: Only allow removing reference image if not in revision mode
      setReferenceImage(null);
      setReferenceImagePreview(null);
      // Clear the file input
      const fileInput = document.getElementById('reference-image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [isRevision]);

  // ORIGINAL options arrays restored
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
  
  const shapeOptions = [
    'Circular', 'Square/Rectangular', 'Triangular', 'Hexagonal', 
    'Organic/Curved', 'Sharp/Angular', 'Shield/Emblem', 
    'Asymmetrical', 'Symmetrical', 'Negative space'
  ];
  
  const textureOptions = [
    'Flat Design', 'Glossy', 'Gradient', 'Rough/Grungy', 
    'Embossed', 'Metallic', 'Hand-Illustrated', '3D Depth', 'Shadowed'
  ];
  
  const complexityOptions = [
    'Ultra-minimal (1-2 elements)', 'Simple (2-3 elements)', 
    'Moderate (3-5 elements)', 'Detailed (5+ elements)', 
    'Complex/Intricate', 'Balanced/Medium'
  ];
  
  const applicationOptions = [
    'Digital-first (websites, apps)', 'Print-first (business cards, letterheads)', 
    'Merchandise/Products', 'Signage/Large format', 'Social media profiles', 
    'Multi-purpose/Versatile', 'Mobile app icon', 'Favicon/Small display', 
    'Animation-ready', 'Brand system (multiple variations)'
  ];

  // FIXED: Remove redundant auth loading check since parent page handles it
  return (
    <div className="generator-form-container">
      {/* Error Display - Shows above the form */}
      {error && (
        <div style={{
          marginBottom: 'var(--space-md)',
          padding: 'var(--space-md)',
          backgroundColor: 'var(--color-error-50, #fef2f2)',
          border: '1px solid var(--color-error-300, #fca5a5)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-error-700, #b91c1c)',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: '500' }}>Error</p>
          <p style={{ margin: 'var(--space-xs) 0 0 0', fontSize: 'var(--text-sm)' }}>{error}</p>
        </div>
      )}
      
      <div className={`card generator-form text-center ${showAdvanced || referenceImagePreview || colorScheme === 'Custom Colors' ? 'expanded' : ''}`}>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>
          {isRevision ? 'Create Logo Revision' : 'Generate Your Logo'}
        </h2>

        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <label htmlFor="company-name" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
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

        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <label htmlFor="slogan" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
            Slogan/Subtitle (Optional)
          </label>
          <input
            type="text"
            id="slogan"
            className="form-input"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="Enter your company slogan"
            disabled={isGenerating}
          />
        </div>

        {/* Size Selection - Only for new images (no reference) */}
        {!referenceImagePreview && (
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <label htmlFor="size" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
              Size <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <select
              id="size"
              className="form-select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
              disabled={isGenerating}
            >
              <option value="">-- Select Size --</option>
              {sizeOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reference Image Upload Section - Original styling preserved */}
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          {/* MOVED: Reference image instruction text above the button */}
          {!referenceImagePreview && (
            <p style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--color-gray-600)', 
              margin: '0 0 var(--space-xs) 0',
              textAlign: 'center'
            }}>
              {isRevision ? 'Reference logo will be used for revision' : 'Click to upload reference image (optional)'}
            </p>
          )}
          
          <label 
            htmlFor="reference-image" 
            style={{
              display: 'block',
              width: '100%',
              padding: 'var(--space-md)',
              border: '2px dashed var(--color-gray-300)',
              borderRadius: 'var(--radius-md)',
              cursor: isRevision ? 'default' : 'pointer', // FIXED: No cursor in revision mode
              backgroundColor: referenceImagePreview ? 'var(--color-gray-50)' : 'white',
              transition: 'all var(--transition-base)',
              textAlign: 'center'
            }}
            onClick={isRevision ? (e) => e.preventDefault() : undefined} // FIXED: Prevent clicks in revision mode
          >
            {referenceImagePreview ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <img 
                  src={referenceImagePreview} 
                  alt="Reference preview" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 'var(--space-sm)',
                    display: 'block'
                  }} 
                />
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  {/* FIXED: Only show remove button when NOT in revision mode */}
                  {!isRevision && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeReferenceImage();
                      }}
                      style={{
                        padding: 'var(--space-xs) var(--space-sm)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-error)',
                        backgroundColor: 'white',
                        border: '1px solid var(--color-error)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        marginRight: 'var(--space-xs)'
                      }}
                      disabled={isGenerating}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <span style={{ 
                  fontSize: 'var(--text-xs)', 
                  color: 'var(--color-primary)', 
                  fontWeight: '500' 
                }}>
                  {referenceImagePreview ? 'Change reference image' : 'Upload reference image'}
                </span>
              </div>
            )}
            <input
              type="file"
              id="reference-image"
              onChange={handleReferenceImageChange}
              accept="image/*"
              style={{ display: 'none' }}
              disabled={isGenerating || isRevision} // FIXED: Disable upload in revision mode
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

        {/* Color Scheme with Custom Colors - Original styling preserved */}
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
                Choose your colors:
              </p>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--space-xs)',
                alignItems: 'center' 
              }}>
                {customColors.map((color, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-xs)',
                    width: '100%',
                    maxWidth: '200px'
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
                        flex: '0 0 50px'
                      }}
                    />
                    <span style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: 'var(--color-gray-600)',
                      flex: '1',
                      textAlign: 'left'
                    }}>
                      {color.toUpperCase()}
                    </span>
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
        </div>
              
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

        {/* ADD: Transparent Background Checkbox */}
        <div style={{ 
          marginBottom: 'var(--space-sm)', 
          marginTop: 'var(--space-md)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--space-xs)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: '500',
            color: 'var(--color-gray-700)'
          }}>
            <input
              type="checkbox"
              checked={transparentBackground}
              onChange={(e) => setTransparentBackground(e.target.checked)}
              disabled={isGenerating}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--color-primary)',
                cursor: 'pointer'
              }}
            />
            Transparent Background
          </label>
        </div>

        {/* Advanced Options Toggle - Original styling preserved */}
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
                shapeOptions
              )}
              
              {renderDropdown(
                "texture",
                'Texture/Finish',
                texture,
                (e) => setTexture(e.target.value),
                textureOptions
              )}
              
              {renderDropdown(
                "complexity",
                'Complexity Level',
                complexityLevel,
                (e) => setComplexityLevel(e.target.value),
                complexityOptions
              )}
              
              {renderDropdown(
                "application",
                'Primary Use/Application',
                applicationContext,
                (e) => setApplicationContext(e.target.value),
                applicationOptions
              )}

              {/* Special Instructions */}
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <label htmlFor="special-instructions" className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
                  Special Instructions/Notes
                </label>
                <textarea
                  id="special-instructions"
                  className="form-textarea"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any specific details, elements to include/exclude, or style preferences..."
                  rows={3}
                  disabled={isGenerating}
                  style={{
                    minHeight: '80px',
                    resize: 'vertical'
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

        {/* REVISION MODE: Cancel Button */}
        {isRevision && (
          <button
            type="button"
            onClick={() => router.push(`/logos/${originalLogoId || editLogoId}`)}
            style={{
              width: '100%',
              marginBottom: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-lg)',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            Cancel Revision
          </button>
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
            !user
          }
          onClick={handleGenerateLogo}
        >
          {isGenerating 
            ? 'Generating Logo...' 
            : !user 
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
            Logo generation can take 15-30 seconds.
          </p>
        )}

        {/* Limit reached modal */}
        {showLimitModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Logo Limit Reached</h3>
              <p>
                {isRevision 
                  ? 'You have reached the maximum number of revisions (3) for this logo.'
                  : 'You have reached your logo generation limit.'}
              </p>
              <div className="modal-actions">
                <button onClick={() => setShowLimitModal(false)} className="btn-secondary">
                  Close
                </button>
                <Link href="/account" className="btn-primary">
                  Buy More Credits
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}