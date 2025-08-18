// src/app/components/GenerateForm.tsx - COMPLETE VERSION with global generation state
'use client';

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useGeneration } from '@/app/context/GenerationContext';
import {
  saveLogo,
  getLogo,
  LogoParameters,
  canCreateOriginalLogo,
  canCreateRevision,
  syncUserUsageWithDynamoDB
} from '@/app/utils/indexedDBUtils';
import { INDUSTRIES } from '@/app/constants/industries';
import CatalogModeToggle from './CatalogModeToggle';
import CatalogCodeInput from './CatalogCodeInput';

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
  const { user, updateUser } = useAuth();
  const { isGenerating, isRevising, setIsGenerating, setIsRevising } = useGeneration();
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

  const [transparentBackground, setTransparentBackground] = useState(true);

  const [industry, setIndustry] = useState('');
  const [typographyStyle, setTypographyStyle] = useState('');
  const [lineStyle, setLineStyle] = useState('');
  const [composition, setComposition] = useState('');
  const [shapeEmphasis, setShapeEmphasis] = useState('');
  const [texture, setTexture] = useState('');
  const [complexityLevel, setComplexityLevel] = useState('');
  const [applicationContext, setApplicationContext] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [canCreateLogo, setCanCreateLogo] = useState(true);
  const [canRevise, setCanRevise] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  const [customColors, setCustomColors] = useState<string[]>(['#6366f1']);

  const [catalogMode, setCatalogMode] = useState(false);
  const [catalogCode, setCatalogCode] = useState('');
  const [catalogData, setCatalogData] = useState<any>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const getFieldsDisabled = useCallback(() => {
    if (catalogMode) {
      return true;
    }
    return isGenerating || isRevising;
  }, [catalogMode, isGenerating, isRevising]);

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

  useEffect(() => {
    const checkLimits = async () => {
      if (user?.email) {
        try {
          const canCreate = await canCreateOriginalLogo(user.email);
          setCanCreateLogo(canCreate);

          if (originalLogoId) {
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

  useEffect(() => {
    const loadLogoForEdit = async () => {
      if (editLogoId && user?.email) {
        try {
          const logoData = await getLogo(editLogoId, user.email);
          if (logoData) {
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

            setSpecialInstructions('');

            setTransparentBackground(logoData.parameters.transparentBackground === 'false' ? false : true);

            setReferenceImagePreview(logoData.imageDataUri);

            try {
              const response = await fetch(logoData.imageDataUri);
              const blob = await response.blob();
              const file = new File([blob], 'reference-logo.png', { type: 'image/png' });
              setReferenceImage(file);
            } catch (err) {
              console.error('Error converting logo to reference file:', err);
            }

            if (logoData.originalLogoId) {
              setIsRevision(true);
              setOriginalLogoId(logoData.originalLogoId);
            } else {
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

  useEffect(() => {
    const loadReferenceData = async () => {
      if (referenceLogoId && user?.email) {
        try {
          const referenceData = await getLogo(referenceLogoId, user.email);
          if (referenceData) {
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
            setTransparentBackground(referenceData.parameters.transparentBackground === 'false' ? false : true);

            setSpecialInstructions('');

            setReferenceImagePreview(referenceData.imageDataUri);

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

    if (colorScheme === 'Custom Colors' && customColors.length > 0) {
      prompt += `Colors: Use these specific colors - ${customColors.join(', ')}\n`;
    } else {
      prompt += `Colors: ${colorScheme}\n`;
    }

    prompt += `Symbol Focus: ${symbolFocus}\n`;
    prompt += `Brand Personality: ${brandPersonality}\n`;

    prompt += `Industry: ${industry}\n`;

    if (transparentBackground) {
      prompt += `Background: Transparent background (no background color or elements)\n`;
    } else {
      prompt += `Background: Include background color or design elements\n`;
    }

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
    applicationContext, customColors, specialInstructions, transparentBackground
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
      transparentBackground: transparentBackground ? 'true' : 'false'
    };
  }, [
    companyName, slogan, overallStyle, colorScheme, symbolFocus,
    brandPersonality, industry, size, typographyStyle, lineStyle,
    composition, shapeEmphasis, texture, complexityLevel,
    applicationContext, customColors, specialInstructions, transparentBackground
  ]);

  const areRequiredFieldsFilled = useCallback(() => {
    return (
        companyName &&
        overallStyle &&
        colorScheme &&
        symbolFocus &&
        brandPersonality &&
        industry &&
        (referenceImagePreview || size)
    );
  }, [
    companyName,
    overallStyle,
    colorScheme,
    symbolFocus,
    brandPersonality,
    industry,
    referenceImagePreview,
    size
  ]);

  const handleGenerateLogo = useCallback(async () => {
    if (!user?.email) {
      router.push('/login?redirect=/');
      return;
    }

    if ((isGenerating || isRevising) || !areRequiredFieldsFilled()) {
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
    setLocalError(null);
    setImageDataUri(null);

    // Set appropriate global generation state
    if (isRevision) {
      setIsRevising(true);
    } else {
      setIsGenerating(true);
    }

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('size', size);
      formData.append('transparentBackground', transparentBackground.toString());

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
          user.email,
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
        setLocalError(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      // Clear appropriate global generation state
      if (isRevision) {
        setIsRevising(false);
      } else {
        setIsGenerating(false);
      }
    }
  }, [
    user?.email,
    isGenerating,
    isRevising,
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
    transparentBackground,
    setIsGenerating,
    setIsRevising
  ]);

  const renderDropdown = useCallback((
      id: string,
      label: string,
      value: string,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
      options: string[] | readonly string[],
      required: boolean = false
  ) => {
    const isFieldDisabled = (() => {
      if (catalogMode && ['company-name', 'slogan', 'industry'].includes(id)) {
        return isGenerating || isRevising;
      }
      return getFieldsDisabled();
    })();

    return (
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <label htmlFor={id} className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>
            {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
            {catalogMode && !['company-name', 'slogan', 'industry'].includes(id) && (
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-gray-500)',
                  marginLeft: 'var(--space-xs)'
                }}>
              🔒
            </span>
            )}
          </label>
          <select
              id={id}
              className="form-select"
              value={value}
              onChange={onChange}
              required={required}
              disabled={isFieldDisabled}
              style={{
                backgroundColor: isFieldDisabled ? 'var(--color-gray-100)' : 'white',
                cursor: isFieldDisabled ? 'not-allowed' : 'pointer'
              }}
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
  }, [getFieldsDisabled, catalogMode, isGenerating, isRevising]);

  const handleReferenceImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setLocalError('Reference image must be smaller than 10MB');
        return;
      }

      setReferenceImage(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeReferenceImage = useCallback(() => {
    if (!isRevision) {
      setReferenceImage(null);
      setReferenceImagePreview(null);
      const fileInput = document.getElementById('reference-image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [isRevision]);

  const handleCatalogModeChange = useCallback((newCatalogMode: boolean) => {
    setCatalogMode(newCatalogMode);

    if (newCatalogMode) {
      // Switching FROM manual TO catalog mode
      // Clear the fields that will be populated by catalog data
      setCompanyName('');
      setSlogan('');
      setIndustry('');

      // Also clear any existing reference image since catalog will provide its own
      setReferenceImage(null);
      setReferenceImagePreview(null);
      const fileInput = document.getElementById('reference-image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } else {
      // Switching FROM catalog TO manual mode
      setCatalogCode('');
      setCatalogData(null);
      setCatalogError(null);

      // Clear reference image if it was from catalog
      if (catalogData) {
        setReferenceImage(null);
        setReferenceImagePreview(null);
      }

      // Reset ALL form fields to default values (including company, slogan, industry)
      setCompanyName('');        // ADD THIS
      setSlogan('');             // ADD THIS
      setIndustry('');           // ADD THIS
      setOverallStyle('');
      setColorScheme('');
      setSymbolFocus('');
      setBrandPersonality('');
      setSize('1024x1024');
      setTypographyStyle('');
      setLineStyle('');
      setComposition('');
      setShapeEmphasis('');
      setTexture('');
      setComplexityLevel('');
      setApplicationContext('');
      setSpecialInstructions('');
      setTransparentBackground(true);
      setCustomColors([]);
    }
  }, [catalogData]);
  const handleCatalogLoaded = useCallback((catalogData: any) => {
    setCatalogData(catalogData);

    if (catalogData) {
      const params = catalogData.parameters;

      setCompanyName('');
      setSlogan('');
      setIndustry('');

      setOverallStyle(params.overallStyle || '');
      setColorScheme(params.colorScheme || '');
      setSymbolFocus(params.symbolFocus || '');
      setBrandPersonality(params.brandPersonality || '');
      setSize(params.size || '1024x1024');
      setTypographyStyle(params.typographyStyle || '');
      setLineStyle(params.lineStyle || '');
      setComposition(params.composition || '');
      setShapeEmphasis(params.shapeEmphasis || '');
      setTexture(params.texture || '');
      setComplexityLevel(params.complexityLevel || '');
      setApplicationContext(params.applicationContext || '');
      setSpecialInstructions(params.specialInstructions || '');
      setTransparentBackground(params.transparentBackground !== 'false');

      setReferenceImagePreview(catalogData.image_data_uri);

      fetch(catalogData.image_data_uri)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], `catalog-${catalogData.catalog_code}.png`, { type: 'image/png' });
            setReferenceImage(file);
          })
          .catch(error => {
            console.error('Error converting catalog image to file:', error);
          });
    } else {
      // Clear all fields when catalogData is null (when Clear button is clicked)
      setOverallStyle('');
      setColorScheme('');
      setSymbolFocus('');
      setBrandPersonality('');
      setSize('1024x1024');
      setTypographyStyle('');
      setLineStyle('');
      setComposition('');
      setShapeEmphasis('');
      setTexture('');
      setComplexityLevel('');
      setApplicationContext('');
      setSpecialInstructions('');
      setCustomColors([]);
      setTransparentBackground(true);

      // Clear reference image
      setReferenceImage(null);
      setReferenceImagePreview(null);

      // Clear file input
      const fileInput = document.getElementById('reference-image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [companyName, slogan]);

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

  return (
      <div className="generator-form-container">
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
          <h2 className="text-indigo-600" style={{ marginBottom: 'var(--space-md)' }}>
            {isRevision ? 'Create Logo Revision' : 'Generate Your Logo'}
          </h2>

          <div style={{
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-md)',
            backgroundColor: '#f8f9fa',
            border: '1px solid var(--color-gray-300)',
            borderRadius: 'var(--radius-md)'
          }}>

            <CatalogModeToggle
                catalogMode={catalogMode}
                onChange={handleCatalogModeChange}
                disabled={(isGenerating || isRevising) || isRevision}
            />

            {catalogMode && (
                <CatalogCodeInput
                    enabled={catalogMode && !isRevision}
                    value={catalogCode}
                    onChange={setCatalogCode}
                    onCatalogLoaded={handleCatalogLoaded}
                    onError={setCatalogError}
                />
            )}

            {catalogError && (
                <div style={{
                  marginBottom: 'var(--space-sm)',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--color-red-50)',
                  border: '1px solid var(--color-red-200)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-red-700)'
                }}>
                  {catalogError}
                </div>
            )}

            {catalogMode && catalogData && (
                <div style={{
                  marginBottom: 'var(--space-sm)',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--color-blue-50)',
                  border: '1px solid var(--color-blue-200)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-blue-700)'
                }}>
                  📋 Using template: <strong>{catalogData.catalog_code}</strong> - {catalogData.original_company_name}
                </div>
            )}
          </div>

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
                disabled={isGenerating || isRevising}
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
                disabled={isGenerating || isRevising}
            />
          </div>

          {!referenceImagePreview && (
              <div style={{marginBottom: 'var(--space-sm)'}}>
                <label htmlFor="size" className="form-label" style={{marginBottom: 'var(--space-xs)'}}>
                  Size <span style={{color: 'var(--color-error)'}}>*</span>
                  {catalogMode && (
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-gray-500)',
                        marginLeft: 'var(--space-xs)'
                      }}>🔒
                      </span>
                  )}
                </label>
                <select
                    id="size"
                    className="form-select"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    required
                    disabled={getFieldsDisabled()}
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

          <div style={{marginBottom: 'var(--space-sm)'}}>
            {!referenceImagePreview && (
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-gray-600)',
                  margin: '0 0 var(--space-xs) 0',
                  textAlign: 'center'
                }}>
                  {isRevision ? 'Reference logo will be used for revision' : 'Click to upload reference image (optional)'}
                  {catalogMode && (
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-gray-500)',
                        marginLeft: 'var(--space-xs)'
                      }}>
          🔒
        </span>
                  )}
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
                  cursor: isRevision ? 'default' : 'pointer',
                  backgroundColor: referenceImagePreview ? 'var(--color-gray-50)' : 'white',
                  transition: 'all var(--transition-base)',
                  textAlign: 'center'
                }}
                onClick={isRevision ? (e) => e.preventDefault() : undefined}
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
                    <div style={{marginBottom: 'var(--space-xs)'}}>

                      <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!catalogMode && !isRevision) {
                              removeReferenceImage();
                            }
                          }}
                          style={{
                            padding: 'var(--space-xs) var(--space-sm)',
                            fontSize: 'var(--text-sm)',
                            color: (catalogMode || isRevision) ? 'var(--color-gray-500)' : 'var(--color-error)',
                            backgroundColor: (catalogMode || isRevision) ? 'var(--color-gray-100)' : 'white',
                            border: `1px solid ${(catalogMode || isRevision) ? 'var(--color-gray-300)' : 'var(--color-error)'}`,
                            borderRadius: 'var(--radius-sm)',
                            cursor: (catalogMode || isRevision) ? 'not-allowed' : 'pointer',
                            opacity: (catalogMode || isRevision) ? 0.6 : 1,
                            marginRight: 'var(--space-xs)',
                            transition: 'all 0.2s ease'
                          }}
                          disabled={getFieldsDisabled() || catalogMode || isRevision}
                          title={
                            catalogMode
                                ? "Cannot remove reference image in catalog mode"
                                : isRevision
                                    ? "Cannot remove reference image during revision"
                                    : "Remove reference image"
                          }
                      >
                        Remove Image
                      </button>

                    </div>
                  </div>
              ) : (
                  <div>
                    <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!catalogMode && !isRevision && !getFieldsDisabled()) {
                            document.getElementById('reference-image')?.click();
                          }
                        }}
                        style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          fontSize: 'var(--text-sm)',
                          color: (catalogMode || isRevision || getFieldsDisabled()) ? 'var(--color-gray-500)' : 'var(--color-primary)',
                          backgroundColor: (catalogMode || isRevision || getFieldsDisabled()) ? 'var(--color-gray-100)' : 'white',
                          border: `1px solid ${(catalogMode || isRevision || getFieldsDisabled()) ? 'var(--color-gray-300)' : 'var(--color-primary)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: (catalogMode || isRevision || getFieldsDisabled()) ? 'not-allowed' : 'pointer',
                          opacity: (catalogMode || isRevision || getFieldsDisabled()) ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        disabled={catalogMode || isRevision || getFieldsDisabled()}
                        title={
                          catalogMode
                              ? "Cannot upload reference image in catalog mode"
                              : isRevision
                                  ? "Cannot upload reference image during revision"
                                  : "Upload reference image (optional)"
                        }
                    >
                      📁 Upload Reference Image
                    </button>
                  </div>
              )}
              <input
                  type="file"
                  id="reference-image"
                  onChange={handleReferenceImageChange}
                  accept="image/*"
                  style={{display: 'none'}}
                  disabled={getFieldsDisabled() || isRevision}
              />
            </label>
          </div>

          {renderDropdown(
              "overall-style",
              'Overall Style',
              overallStyle,
              (e) => setOverallStyle(e.target.value),
              overallStyleOptions,
              true
          )}

          <div style={{marginBottom: 'var(--space-sm)'}}>
            <label htmlFor="color-scheme" className="form-label" style={{marginBottom: 'var(--space-xs)'}}>
              Color Scheme <span style={{color: 'var(--color-error)'}}>*</span>
              {catalogMode && (
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-gray-500)',
                    marginLeft: 'var(--space-xs)'
                  }}>
      🔒
    </span>
              )}
            </label>
            <select
                id="color-scheme"
                className="form-select"
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
                required
                disabled={getFieldsDisabled()}
            >
              <option value="">-- Select Color Scheme --</option>
              {colorSchemeOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
              ))}
            </select>

            {colorScheme === 'Custom Colors' && (
                <div style={{marginTop: 'var(--space-sm)'}}>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '500',
                    marginBottom: 'var(--space-xs)',
                    color: 'var(--color-gray-700)'
                  }}>
                    Choose your colors:
                    {catalogMode && (
                        <span style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-gray-500)',
                          marginLeft: 'var(--space-xs)'
                        }}>
      🔒
    </span>
                    )}
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
                              disabled={getFieldsDisabled()}
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
                                  disabled={getFieldsDisabled()}
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
                            disabled={getFieldsDisabled()}
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
                          <span style={{fontSize: '1.2em'}}>+</span> Add Color ({customColors.length}/3)
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

          {renderDropdown(
              "industry",
              'Industry/Niche',
              industry,
              (e) => setIndustry(e.target.value),
              INDUSTRIES,
              true
          )}

          <div style={{
            marginBottom: 'var(--space-sm)',
            marginTop: 'var(--space-xs)',
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
                  disabled={getFieldsDisabled()}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--color-primary)',
                    cursor: 'pointer'
                  }}
              />
              Transparent Background
              {catalogMode && (
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-gray-500)',
                    marginLeft: 'var(--space-xs)'
                  }}>
      🔒
    </span>
              )}
            </label>
          </div>

          <div style={{marginBottom: 'var(--space-sm)'}}>
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

                  <div style={{marginBottom: 'var(--space-sm)'}}>
                    <label htmlFor="special-instructions" className="form-label"
                           style={{marginBottom: 'var(--space-xs)'}}>
                      Special Instructions/Notes
                      {catalogMode && (
                          <span style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-gray-500)',
                            marginLeft: 'var(--space-xs)'
                          }}>
      🔒
    </span>
                      )}
                    </label>
                    <textarea
                        id="special-instructions"
                        className="form-textarea"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any specific details, elements to include/exclude, or style preferences..."
                        rows={3}
                        disabled={getFieldsDisabled()}
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

          {isRevision && (
              <button
                  type="button"
                  onClick={() => router.push(`/logos/${editLogoId || originalLogoId}`)}
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
                  (isGenerating || isRevising) ||
                  !areRequiredFieldsFilled() ||
                  !user
              }
              onClick={handleGenerateLogo}
          >
            {(isGenerating || isRevising)
                ? 'Generating Logo...'
                : !user
                    ? 'Login to Generate'
                    : isRevision
                        ? 'Generate Revision'
                        : 'Generate Logo'}
          </button>

          {(isGenerating || isRevising) && (
              <p className="text-center" style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-gray-500)',
                marginTop: 'var(--space-xs)',
                marginBottom: '0'
              }}>
                Please be patient while your logo is being generated. Logo generation can take 30-45 seconds...
              </p>
          )}

          {showLimitModal && (
              <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowLimitModal(false)}
              >
                <div
                    className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold mb-4">Logo Limit Reached</h3>
                  <p className="mb-6">
                    {isRevision
                        ? 'You have reached the maximum number of revisions (3) for this logo.'
                        : 'You have reached your logo generation limit.'}
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                        onClick={() => setShowLimitModal(false)}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Close
                    </button>
                    <Link
                        href="/purchase"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
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