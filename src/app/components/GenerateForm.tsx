// src/app/components/GenerateForm.tsx
'use client';

import { useState, useCallback, useRef, ChangeEvent } from 'react';

interface GenerateFormProps {
  setLoading: (loading: boolean) => void;
  setImageDataUri: (dataUri: string | null) => void;
  setError: (error: string | null) => void;
}

export default function GenerateForm({ setLoading, setImageDataUri, setError }: GenerateFormProps) {
  // Create unique IDs for form elements
  const formRef = useRef<HTMLFormElement>(null);
  
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
  
  // Animation reference
  const advancedSectionRef = useRef<HTMLDivElement>(null);
  
  // Track loading state locally
  const [isGenerating, setIsGenerating] = useState(false);

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

  const areRequiredFieldsFilled = useCallback(() => {
    return companyName && overallStyle && colorScheme && symbolFocus && brandPersonality && industry;
  }, [companyName, overallStyle, colorScheme, symbolFocus, brandPersonality, industry]);

  const handleGenerateLogo = useCallback(async () => {
    // If already generating or missing required fields, do nothing
    if (isGenerating || !areRequiredFieldsFilled()) {
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

      // Send the request
      const response = await fetch('/api/generate', {
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
      if (data?.data?.[0]?.b64_json) {
        const imageDataUriString = `data:image/png;base64,${data.data[0].b64_json}`;
        setImageDataUri(imageDataUriString);
      } else if (data?.data?.[0]?.url) {
        setImageDataUri(data.data[0].url);
      } else {
        throw new Error('No image data received in the expected format');
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [
    isGenerating, areRequiredFieldsFilled, buildPrompt, 
    setLoading, setError, setImageDataUri, referenceImage
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
      <h2 className="text-xl font-semibold mb-4">Generate Logo</h2>
      <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-medium mb-3">Required Options</h3>

          {/* Company Name Input */}
          <div className="mb-4">
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
          <div className="mb-4">
            <label htmlFor="reference-image" className="form-label">
              Reference Image (Optional)
            </label>
            <div className="relative">
              <label 
                className="w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-300 transition text-gray-500 hover:text-indigo-500"
                style={{ minHeight: '44px' }}
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
            <p className="text-sm text-gray-500 mt-1">
              Upload an image for inspiration
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
        <div className="mb-4 sm:mb-6">
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
          ref={advancedSectionRef}
          className={`transition-all duration-300 ease-in-out ${
            showAdvanced 
              ? 'max-h-[2000px] opacity-100 transform translate-y-0' 
              : 'max-h-0 opacity-0 overflow-hidden transform -translate-y-4'
          }`}
        >
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg font-medium mb-3">Advanced Options</h3>
            
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

        {/* Generate Button - Mobile optimized size */}
        <button
          type="button"
          className="btn-primary w-full"
          disabled={isGenerating || !areRequiredFieldsFilled()}
          onClick={handleGenerateLogo}
          style={{ minHeight: '48px' }}
        >
          {isGenerating ? 'Generating Logo...' : 'Generate Logo'}
        </button>

        {/* Loading indicator text */}
        {isGenerating && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Logo generation can take 15-30 seconds. Please be patient...
          </p>
        )}
        
        {/* Required fields reminder */}
        {!areRequiredFieldsFilled() && !isGenerating && (
          <p className="text-sm text-amber-600 mt-2 text-center">
            Please fill in all required fields marked with <span className="text-red-500">*</span>
          </p>
        )}
      </form>
    </div>
  );
}