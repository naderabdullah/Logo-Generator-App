// src/app/bulk-generate/BulkGenerateView.tsx - COMPLETE VERSION WITH ALL FIXES
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    saveLogo,
    getLogo,
    getAllLogosWithRevisions,
    renameLogo,
    type StoredLogo,
    type LogoParameters
} from '@/app/utils/indexedDBUtils';
import companyData from '../../data/company-names.json';

type StringIndexed<T> = { [key: string]: T };

// Define explicit interface for company data
interface CompanyData {
    name: string;
    description: string;
    slogan: string;
}

interface BulkGenerationProgress {
    totalLogos: number;
    currentCount: number;
    remaining: number;
    currentCompany: string;
    currentIndustry?: string;
    status: 'idle' | 'generating' | 'completed' | 'error';
    errorMessage?: string;
}

export default function BulkGenerateView() {
    const { user } = useAuth();
    const router = useRouter();
    const [bulkCount, setBulkCount] = useState<number>(10);
    const [progress, setProgress] = useState<BulkGenerationProgress>({
        totalLogos: 0,
        currentCount: 0,
        remaining: 0,
        currentCompany: '',
        status: 'idle'
    });
    const [generatedLogos, setGeneratedLogos] = useState<StoredLogo[]>([]);
    const [usedCompanyNames, setUsedCompanyNames] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);

    // NEW: Untitled logos fix functionality
    const [untitledLogos, setUntitledLogos] = useState<StoredLogo[]>([]);
    const [isFixingUntitled, setIsFixingUntitled] = useState(false);
    const [fixingProgress, setFixingProgress] = useState({ current: 0, total: 0 });

    // Check if user is authorized
    useEffect(() => {
        if (!user || !user.isSuperUser) {
            router.push('/');
            return;
        }
    }, [user, router]);

    // Load existing logos to check for duplicates
    useEffect(() => {
        const loadExistingLogos = async () => {
            if (user?.email) {
                try {
                    const existingLogosWithRevisions = await getAllLogosWithRevisions(user.email);
                    const allLogos = existingLogosWithRevisions.flatMap(logoGroup => [
                        logoGroup.original,
                        ...logoGroup.revisions
                    ]);
                    const existingNames = new Set(
                        allLogos
                            .map(logo => logo.parameters.companyName)
                            .filter(Boolean)
                    );
                    setUsedCompanyNames(existingNames);
                } catch (error) {
                    console.error('Error loading existing logos:', error);
                }
            }
        };
        loadExistingLogos();
    }, [user?.email]);

    // NEW: Find untitled logos function
    const findUntitledLogos = async (): Promise<StoredLogo[]> => {
        if (!user?.email) return [];

        try {
            const allLogosWithRevisions = await getAllLogosWithRevisions(user.email);
            const allLogos = allLogosWithRevisions.flatMap(logoGroup => [
                logoGroup.original,
                ...logoGroup.revisions
            ]);

            const untitled = allLogos.filter(logo =>
                logo.name === 'Untitled' ||
                logo.name === '' ||
                !logo.name
            );

            return untitled;
        } catch (error) {
            console.error('Error finding untitled logos:', error);
            return [];
        }
    };

    // NEW: Check for untitled logos when component loads
    useEffect(() => {
        const checkUntitledLogos = async () => {
            if (user?.email) {
                const untitled = await findUntitledLogos();
                setUntitledLogos(untitled);
            }
        };
        checkUntitledLogos();
    }, [user?.email, generatedLogos]); // Re-check when new logos are generated

    // NEW: Fix untitled logos function
    const fixUntitledLogos = async () => {
        if (!user?.email || untitledLogos.length === 0) return;

        setIsFixingUntitled(true);
        setFixingProgress({ current: 0, total: untitledLogos.length });

        let successCount = 0;

        try {
            for (let i = 0; i < untitledLogos.length; i++) {
                const logo = untitledLogos[i];
                setFixingProgress({ current: i + 1, total: untitledLogos.length });

                try {
                    // Use the company name from parameters as the new name
                    const newName = logo.parameters.companyName || `Logo ${i + 1}`;
                    await renameLogo(logo.id, newName, user.email);
                    successCount++;

                    // Small delay to show progress
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error(`Error renaming logo ${logo.id}:`, error);
                }
            }

            // Refresh the untitled logos list
            const remainingUntitled = await findUntitledLogos();
            setUntitledLogos(remainingUntitled);

            console.log(`Successfully renamed ${successCount}/${untitledLogos.length} logos`);

        } catch (error) {
            console.error('Error fixing untitled logos:', error);
        } finally {
            setIsFixingUntitled(false);
            setFixingProgress({ current: 0, total: 0 });
        }
    };

    // AI-powered industry classification
    const classifyIndustryWithAI = async (company: CompanyData): Promise<string> => {
        const industries = [
            'Technology', 'Healthcare/Medical', 'Food/Restaurant', 'Finance/Banking',
            'Construction/Real Estate', 'Education', 'Transportation/Logistics', 'Energy',
            'Entertainment/Media', 'Retail/Fashion', 'Marketing/Advertising', 'Professional Services',
            'Manufacturing/Industrial', 'Legal', 'Design/Creative', 'Telecommunications',
            'Security', 'Consulting', 'Agriculture', 'Non-profit/Charity', 'Arts/Entertainment',
            'Sports/Fitness', 'Travel/Hospitality', 'Fashion/Beauty'
        ];

        const prompt = `Classify this company into the most appropriate industry category:

Company Name: "${company.name}"
Description: "${company.description}"
Slogan: "${company.slogan}"

Available Industries:
${industries.map(industry => `- ${industry}`).join('\n')}

Instructions:
- Consider the company name, description, and slogan
- Return ONLY the industry name exactly as listed above
- Choose the single most appropriate category
- If uncertain between two categories, pick the more specific one

Industry:`;

        try {
            const response = await fetch('/api/classify-industry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            const result = await response.json();
            const classifiedIndustry = result.industry?.trim();

            if (industries.includes(classifiedIndustry)) {
                console.log(`✅ AI classified "${company.name}" as: ${classifiedIndustry}`);
                return classifiedIndustry;
            } else {
                console.warn(`AI returned invalid industry: ${classifiedIndustry}, falling back to Professional Services`);
                return 'Professional Services';
            }
        } catch (error) {
            console.error('Error classifying industry with AI:', error);
            return fallbackIndustryClassification(company);
        }
    };

    // Simple fallback classification
    const fallbackIndustryClassification = (company: CompanyData): string => {
        const text = `${company.name} ${company.description} ${company.slogan}`.toLowerCase();

        const simpleMapping = {
            'Technology': ['tech', 'software', 'digital', 'app', 'system', 'platform'],
            'Healthcare/Medical': ['health', 'medical', 'care', 'clinic', 'wellness'],
            'Food/Restaurant': ['restaurant', 'food', 'coffee', 'culinary', 'kitchen'],
            'Construction/Real Estate': ['construction', 'building', 'realty', 'architecture'],
            'Finance/Banking': ['bank', 'financial', 'payment', 'investment'],
            'Education': ['education', 'learning', 'school', 'training'],
            'Design/Creative': ['design', 'creative', 'studio', 'interior'],
            'Telecommunications': ['communication', 'telecom', 'network']
        };

        for (const [industry, keywords] of Object.entries(simpleMapping)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return industry;
            }
        }
        return 'Professional Services';
    };

    // CONTEXTUAL STYLE SELECTION
    const getContextualStyle = (industry: string): string => {
        const styleMapping: StringIndexed<string[]> = {
            'Technology': ['Modern', 'Contemporary', 'Minimalist', 'Hi-Tech'],
            'Healthcare/Medical': ['Professional', 'Modern', 'Elegant'],
            'Food/Restaurant': ['Modern', 'Contemporary', 'Vintage', 'Hand-Drawn'],
            'Finance/Banking': ['Professional', 'Elegant', 'Classical'],
            'Construction/Real Estate': ['Professional', 'Bold', 'Modern'],
            'Education': ['Playful', 'Modern', 'Professional'],
            'Energy': ['Modern', 'Hi-Tech', 'Bold'],
            'Marketing/Advertising': ['Creative', 'Bold', 'Modern'],
            'Retail/Fashion': ['Elegant', 'Playful', 'Modern'],
            'Legal': ['Professional', 'Elegant', 'Classical'],
            'Design/Creative': ['Creative', 'Modern', 'Abstract'],
            'Telecommunications': ['Modern', 'Hi-Tech', 'Minimalist'],
            'Entertainment/Media': ['Creative', 'Bold', 'Modern'],
            'Transportation/Logistics': ['Professional', 'Bold', 'Modern'],
            'Security': ['Professional', 'Bold', 'Modern'],
            'Consulting': ['Professional', 'Modern', 'Elegant'],
            'Manufacturing/Industrial': ['Professional', 'Bold', 'Modern'],
            'Agriculture': ['Natural', 'Modern', 'Hand-Drawn'],
            'Non-profit/Charity': ['Professional', 'Elegant', 'Modern'],
            'Arts/Entertainment': ['Creative', 'Bold', 'Abstract'],
            'Sports/Fitness': ['Bold', 'Modern', 'Dynamic'],
            'Travel/Hospitality': ['Elegant', 'Modern', 'Playful'],
            'Fashion/Beauty': ['Elegant', 'Luxury', 'Modern']
        };

        const styles = styleMapping[industry] || ['Modern', 'Professional'];
        return styles[Math.floor(Math.random() * styles.length)];
    };

    // CONTEXTUAL COLOR SCHEME SELECTION
    const getContextualColors = (industry: string, style: string): string => {
        const colorMapping: StringIndexed<string[]> = {
            'Technology': ['Blue & White', 'Navy & Gold', 'Monochrome', 'Metallics'],
            'Healthcare/Medical': ['Blue & White', 'Green & White', 'Primary Colors'],
            'Food/Restaurant': ['Earthy Tones', 'Green & Gold', 'Primary Colors'],
            'Finance/Banking': ['Navy & Gold', 'Blue & White', 'Metallics'],
            'Construction/Real Estate': ['Primary Colors', 'Bold Colors', 'Earthy Tones'],
            'Energy': ['Green & Gold', 'Blue & Yellow', 'Primary Colors'],
            'Marketing/Advertising': ['Primary Colors', 'Creative Colors', 'Bold Colors'],
            'Legal': ['Navy & Gold', 'Professional Blues', 'Classical Colors'],
            'Design/Creative': ['Creative Colors', 'Bold Colors', 'Artistic Palette'],
            'Telecommunications': ['Blue & White', 'Modern Colors', 'Tech Colors'],
            'Entertainment/Media': ['Bold Colors', 'Creative Palette', 'Vibrant Colors'],
            'Transportation/Logistics': ['Primary Colors', 'Bold Colors', 'Professional Colors'],
            'Security': ['Professional Colors', 'Bold Colors', 'Trustworthy Colors'],
            'Consulting': ['Professional Colors', 'Modern Palette', 'Elegant Colors'],
            'Manufacturing/Industrial': ['Bold Colors', 'Industrial Colors', 'Strong Palette'],
            'Agriculture': ['Green & Gold', 'Earthy Tones', 'Natural Colors'],
            'Non-profit/Charity': ['Professional Colors', 'Warm Colors', 'Trustworthy Palette'],
            'Arts/Entertainment': ['Creative Palette', 'Bold Colors', 'Artistic Colors'],
            'Sports/Fitness': ['Bold Colors', 'Energy Colors', 'Dynamic Palette'],
            'Travel/Hospitality': ['Warm Colors', 'Elegant Palette', 'Inviting Colors'],
            'Fashion/Beauty': ['Elegant Colors', 'Luxury Palette', 'Sophisticated Colors']
        };

        if (style.includes('Luxury')) {
            return ['Gold & Black', 'Metallics', 'Deep Purple & Gold'][Math.floor(Math.random() * 3)];
        }
        if (style.includes('Natural') || style.includes('Hand-Drawn')) {
            return ['Earthy Tones', 'Green & Brown', 'Natural Colors'][Math.floor(Math.random() * 3)];
        }
        if (style.includes('Modern')) {
            return ['Clean Blues', 'Minimal Grays', 'Contemporary Colors'][Math.floor(Math.random() * 3)];
        }

        const colors = colorMapping[industry] || ['Blue & White', 'Professional Colors'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // CONTEXTUAL SYMBOL FOCUS SELECTION
    const getContextualSymbolFocus = (industry: string): string => {
        const symbolMapping: StringIndexed<string[]> = {
            'Technology': ['Abstract Icon', 'Lettermark (Initial-based)', 'Minimalist Icon', 'Geometric Icon'],
            'Healthcare/Medical': ['Pictorial (Image-based)', 'Wordmark (Company Name)', 'Symbol Only (No Text)'],
            'Food/Restaurant': ['Pictorial (Image-based)', 'Wordmark (Company Name)', 'Nature-Inspired Icon'],
            'Finance/Banking': ['Lettermark (Initial-based)', 'Wordmark (Company Name)', 'Emblem (Badge-style)'],
            'Construction/Real Estate': ['Emblem (Badge-style)', 'Lettermark (Initial-based)', 'Geometric Icon'],
            'Education': ['Pictorial (Image-based)', 'Wordmark (Company Name)', 'Abstract Icon'],
            'Marketing/Advertising': ['Abstract Icon', 'Creative Symbol', 'Dynamic Icon'],
            'Legal': ['Lettermark (Initial-based)', 'Emblem (Badge-style)', 'Wordmark (Company Name)'],
            'Design/Creative': ['Abstract Icon', 'Creative Symbol', 'Artistic Icon'],
            'Telecommunications': ['Abstract Icon', 'Minimalist Icon', 'Geometric Icon'],
            'Entertainment/Media': ['Pictorial (Image-based)', 'Abstract Icon', 'Creative Symbol'],
            'Transportation/Logistics': ['Pictorial (Image-based)', 'Emblem (Badge-style)', 'Geometric Icon'],
            'Security': ['Emblem (Badge-style)', 'Lettermark (Initial-based)', 'Abstract Icon'],
            'Consulting': ['Lettermark (Initial-based)', 'Wordmark (Company Name)', 'Abstract Icon'],
            'Manufacturing/Industrial': ['Emblem (Badge-style)', 'Lettermark (Initial-based)', 'Geometric Icon'],
            'Agriculture': ['Nature-Inspired Icon', 'Pictorial (Image-based)', 'Wordmark (Company Name)'],
            'Non-profit/Charity': ['Pictorial (Image-based)', 'Abstract Icon', 'Wordmark (Company Name)'],
            'Arts/Entertainment': ['Abstract Icon', 'Pictorial (Image-based)', 'Creative Symbol'],
            'Sports/Fitness': ['Pictorial (Image-based)', 'Abstract Icon', 'Mascot (Character-based)'],
            'Travel/Hospitality': ['Pictorial (Image-based)', 'Abstract Icon', 'Wordmark (Company Name)'],
            'Fashion/Beauty': ['Lettermark (Initial-based)', 'Abstract Icon', 'Wordmark (Company Name)']
        };

        const symbols = symbolMapping[industry] || ['Wordmark (Company Name)', 'Lettermark (Initial-based)'];
        return symbols[Math.floor(Math.random() * symbols.length)];
    };

    // CONTEXTUAL BRAND PERSONALITY SELECTION
    const getContextualPersonality = (industry: string, companyName: string): string => {
        const personalityMapping: StringIndexed<string[]> = {
            'Technology': ['Futuristic & Cutting-Edge', 'Professional', 'Bold & Energetic'],
            'Healthcare/Medical': ['Trustworthy', 'Professional', 'Elegant'],
            'Food/Restaurant': ['Playful', 'Elegant', 'Trustworthy'],
            'Finance/Banking': ['Trustworthy', 'Professional', 'Luxury & Premium'],
            'Construction/Real Estate': ['Bold & Energetic', 'Professional', 'Trustworthy'],
            'Education': ['Playful', 'Professional', 'Trustworthy'],
            'Marketing/Advertising': ['Bold & Energetic', 'Playful', 'Futuristic & Cutting-Edge'],
            'Legal': ['Professional', 'Trustworthy', 'Elegant'],
            'Design/Creative': ['Playful', 'Bold & Energetic', 'Elegant'],
            'Telecommunications': ['Futuristic & Cutting-Edge', 'Professional', 'Tech & Innovation Focused'],
            'Entertainment/Media': ['Playful', 'Bold & Energetic', 'Futuristic & Cutting-Edge'],
            'Transportation/Logistics': ['Professional', 'Bold & Energetic', 'Trustworthy'],
            'Security': ['Professional', 'Trustworthy', 'Bold & Energetic'],
            'Consulting': ['Professional', 'Trustworthy', 'Elegant'],
            'Manufacturing/Industrial': ['Professional', 'Bold & Energetic', 'Trustworthy'],
            'Agriculture': ['Eco-Friendly', 'Trustworthy', 'Professional'],
            'Non-profit/Charity': ['Trustworthy', 'Professional', 'Elegant'],
            'Arts/Entertainment': ['Playful', 'Bold & Energetic', 'Elegant'],
            'Sports/Fitness': ['Bold & Energetic', 'Professional', 'Playful'],
            'Travel/Hospitality': ['Elegant', 'Trustworthy', 'Playful'],
            'Fashion/Beauty': ['Elegant', 'Luxury & Premium', 'Bold & Energetic']
        };

        if (companyName.toLowerCase().includes('luxury') || companyName.toLowerCase().includes('premium')) {
            return 'Luxury & Premium';
        }
        if (companyName.toLowerCase().includes('eco') || companyName.toLowerCase().includes('green')) {
            return 'Eco-Friendly';
        }
        if (companyName.toLowerCase().includes('smart') || companyName.toLowerCase().includes('ai')) {
            return 'Tech & Innovation Focused';
        }

        const personalities = personalityMapping[industry] || ['Professional', 'Trustworthy'];
        return personalities[Math.floor(Math.random() * personalities.length)];
    };

    // NEW: CONTEXTUAL TYPOGRAPHY SELECTION
    const getContextualTypography = (industry: string, style: string): string => {
        const typographyMapping: StringIndexed<string[]> = {
            'Technology': ['Sans-serif', 'Geometric', 'Monospace'],
            'Healthcare/Medical': ['Sans-serif', 'Serif', 'Classic/Traditional'],
            'Food/Restaurant': ['Script/Cursive', 'Handwritten', 'Display'],
            'Finance/Banking': ['Serif', 'Sans-serif', 'Classic/Traditional'],
            'Legal': ['Serif', 'Classic/Traditional', 'Slab serif'],
            'Design/Creative': ['Display', 'Decorative/Ornamental', 'Script/Cursive'],
            'Education': ['Sans-serif', 'Serif', 'Geometric'],
            'Marketing/Advertising': ['Display', 'Sans-serif', 'Decorative/Ornamental'],
            'Entertainment/Media': ['Display', 'Script/Cursive', 'Decorative/Ornamental'],
            'Sports/Fitness': ['Sans-serif', 'Display', 'Geometric'],
            'Fashion/Beauty': ['Script/Cursive', 'Display', 'Serif']
        };

        if (style.includes('Modern') || style.includes('Hi-Tech')) {
            return ['Sans-serif', 'Geometric', 'Monospace'][Math.floor(Math.random() * 3)];
        }
        if (style.includes('Vintage') || style.includes('Classical')) {
            return ['Serif', 'Slab serif', 'Classic/Traditional'][Math.floor(Math.random() * 3)];
        }
        if (style.includes('Hand-Drawn')) {
            return ['Handwritten', 'Script/Cursive'][Math.floor(Math.random() * 2)];
        }

        const options = typographyMapping[industry] || ['Sans-serif', 'Serif'];
        return options[Math.floor(Math.random() * options.length)];
    };

    // NEW: CONTEXTUAL LINE STYLE SELECTION
    const getContextualLineStyle = (style: string, personality: string): string => {
        const lineMapping: StringIndexed<string[]> = {
            'Modern': ['Thin', 'Continuous Smooth', 'Sharp/Angular'],
            'Minimalist': ['Thin', 'Continuous Smooth'],
            'Hand-Drawn': ['Hand-Drawn', 'Sketch-like', 'Fluid/Wavy'],
            'Vintage': ['Thick', 'Broken/Dotted', 'Calligraphy'],
            'Hi-Tech': ['Sharp/Angular', 'Continuous Smooth', 'Thin'],
            'Abstract': ['Fluid/Wavy', 'Sharp/Angular', 'Broken/Dotted'],
            'Geometric': ['Sharp/Angular', 'Continuous Smooth', 'Thick']
        };

        if (personality.includes('Bold')) {
            return ['Thick', 'Sharp/Angular'][Math.floor(Math.random() * 2)];
        }
        if (personality.includes('Elegant')) {
            return ['Thin', 'Calligraphy', 'Fluid/Wavy'][Math.floor(Math.random() * 3)];
        }

        const options = lineMapping[style] || ['Continuous Smooth', 'Thin'];
        return options[Math.floor(Math.random() * options.length)];
    };

    // NEW: CONTEXTUAL COMPOSITION SELECTION
    const getContextualComposition = (symbolFocus: string, industry: string): string => {
        const compositionMapping: StringIndexed<string[]> = {
            'Lettermark (Initial-based)': ['Symbol beside text', 'Symbol integrated with text', 'Horizontal'],
            'Wordmark (Company Name)': ['Text only', 'Horizontal', 'Stacked'],
            'Pictorial (Image-based)': ['Symbol above text', 'Symbol beside text', 'Vertical'],
            'Emblem (Badge-style)': ['Enclosed (symbol + text in container)', 'Circular/Radial'],
            'Symbol Only (No Text)': ['Circular/Radial', 'Diagonal', 'Symmetrical'],
            'Abstract Icon': ['Symbol above text', 'Symbol integrated with text', 'Asymmetrical'],
            'Minimalist Icon': ['Symbol beside text', 'Horizontal', 'Symbol above text'],
            'Geometric Icon': ['Symbol above text', 'Horizontal', 'Diagonal'],
            'Nature-Inspired Icon': ['Symbol above text', 'Circular/Radial', 'Vertical'],
            'Mascot (Character-based)': ['Symbol above text', 'Symbol beside text', 'Stacked']
        };

        if (industry === 'Technology') {
            return ['Horizontal', 'Symbol beside text', 'Symbol integrated with text'][Math.floor(Math.random() * 3)];
        }
        if (industry === 'Legal' || industry === 'Finance/Banking') {
            return ['Enclosed (symbol + text in container)', 'Horizontal', 'Stacked'][Math.floor(Math.random() * 3)];
        }

        const options = compositionMapping[symbolFocus] || ['Horizontal', 'Symbol beside text'];
        return options[Math.floor(Math.random() * options.length)];
    };

    // NEW: CONTEXTUAL SHAPE EMPHASIS SELECTION
    const getContextualShape = (industry: string, symbolFocus: string): string => {
        const shapeMapping: StringIndexed<string[]> = {
            'Technology': ['Circular', 'Sharp/Angular', 'Asymmetrical', 'Hexagonal'],
            'Healthcare/Medical': ['Circular', 'Organic/Curved', 'Symmetrical'],
            'Finance/Banking': ['Square/Rectangular', 'Shield/Emblem', 'Symmetrical'],
            'Legal': ['Shield/Emblem', 'Square/Rectangular', 'Symmetrical'],
            'Design/Creative': ['Asymmetrical', 'Organic/Curved', 'Negative space'],
            'Food/Restaurant': ['Circular', 'Organic/Curved', 'Triangular'],
            'Sports/Fitness': ['Sharp/Angular', 'Triangular', 'Asymmetrical'],
            'Fashion/Beauty': ['Circular', 'Organic/Curved', 'Symmetrical']
        };

        if (symbolFocus.includes('Emblem')) {
            return ['Shield/Emblem', 'Circular', 'Symmetrical'][Math.floor(Math.random() * 3)];
        }
        if (symbolFocus.includes('Abstract')) {
            return ['Asymmetrical', 'Organic/Curved', 'Negative space'][Math.floor(Math.random() * 3)];
        }
        if (symbolFocus.includes('Geometric')) {
            return ['Hexagonal', 'Triangular', 'Sharp/Angular'][Math.floor(Math.random() * 3)];
        }

        const options = shapeMapping[industry] || ['Circular', 'Square/Rectangular'];
        return options[Math.floor(Math.random() * options.length)];
    };

    // NEW: CONTEXTUAL TEXTURE SELECTION
    const getContextualTexture = (style: string, personality: string): string => {
        const textureMapping: StringIndexed<string[]> = {
            'Modern': ['Flat Design', 'Gradient', 'Metallic'],
            'Minimalist': ['Flat Design'],
            'Hi-Tech': ['Metallic', 'Glossy', '3D Depth'],
            'Vintage': ['Rough/Grungy', 'Embossed', 'Hand-Illustrated'],
            'Elegant': ['Glossy', 'Embossed', 'Gradient'],
            'Hand-Drawn': ['Hand-Illustrated', 'Rough/Grungy'],
            'Abstract': ['Gradient', '3D Depth', 'Shadowed'],
            'Geometric': ['Flat Design', 'Gradient', 'Metallic']
        };

        if (personality.includes('Luxury')) {
            return ['Metallic', 'Glossy', 'Embossed'][Math.floor(Math.random() * 3)];
        }
        if (personality.includes('Tech')) {
            return ['Metallic', '3D Depth', 'Gradient'][Math.floor(Math.random() * 3)];
        }
        if (personality.includes('Playful')) {
            return ['Hand-Illustrated', 'Gradient', 'Shadowed'][Math.floor(Math.random() * 3)];
        }

        const options = textureMapping[style] || ['Flat Design', 'Gradient'];
        return options[Math.floor(Math.random() * options.length)];
    };

    // NEW: CONTEXTUAL COMPLEXITY SELECTION
    const getContextualComplexity = (industry: string, personality: string): string => {
        const complexityMapping: StringIndexed<string[]> = {
            'Technology': ['Simple (2-3 elements)', 'Moderate (3-5 elements)', 'Balanced/Medium'],
            'Healthcare/Medical': ['Simple (2-3 elements)', 'Balanced/Medium'],
            'Finance/Banking': ['Simple (2-3 elements)', 'Balanced/Medium'],
            'Legal': ['Simple (2-3 elements)', 'Balanced/Medium'],
            'Design/Creative': ['Moderate (3-5 elements)', 'Detailed (5+ elements)', 'Complex/Intricate'],
            'Food/Restaurant': ['Moderate (3-5 elements)', 'Detailed (5+ elements)'],
            'Entertainment/Media': ['Detailed (5+ elements)', 'Complex/Intricate'],
            'Sports/Fitness': ['Simple (2-3 elements)', 'Moderate (3-5 elements)'],
            'Fashion/Beauty': ['Moderate (3-5 elements)', 'Detailed (5+ elements)']
        };

        if (personality.includes('Professional') || personality.includes('Minimalist')) {
            return ['Ultra-minimal (1-2 elements)', 'Simple (2-3 elements)'][Math.floor(Math.random() * 2)];
        }
        if (personality.includes('Bold') || personality.includes('Playful')) {
            return ['Moderate (3-5 elements)', 'Detailed (5+ elements)'][Math.floor(Math.random() * 2)];
        }
        if (personality.includes('Elegant')) {
            return ['Simple (2-3 elements)', 'Balanced/Medium'][Math.floor(Math.random() * 2)];
        }

        const options = complexityMapping[industry] || ['Simple (2-3 elements)', 'Balanced/Medium'];
        return options[Math.floor(Math.random() * options.length)];
    };

    // NEW: CONTEXTUAL APPLICATION CONTEXT SELECTION
    const getContextualApplication = (industry: string): string => {
        const applicationMapping: StringIndexed<string[]> = {
            'Technology': ['Mobile app icon', 'Digital-first (websites, apps)', 'Multi-purpose/Versatile'],
            'Healthcare/Medical': ['Print-first (business cards, letterheads)', 'Signage/Large format', 'Multi-purpose/Versatile'],
            'Food/Restaurant': ['Signage/Large format', 'Merchandise/Products', 'Multi-purpose/Versatile'],
            'Finance/Banking': ['Print-first (business cards, letterheads)', 'Digital-first (websites, apps)', 'Multi-purpose/Versatile'],
            'Legal': ['Print-first (business cards, letterheads)', 'Multi-purpose/Versatile', 'Brand system (multiple variations)'],
            'Design/Creative': ['Multi-purpose/Versatile', 'Social media profiles', 'Brand system (multiple variations)'],
            'Sports/Fitness': ['Merchandise/Products', 'Social media profiles', 'Multi-purpose/Versatile'],
            'Fashion/Beauty': ['Social media profiles', 'Merchandise/Products', 'Multi-purpose/Versatile']
        };

        const applications = applicationMapping[industry] || ['Multi-purpose/Versatile', 'Digital-first (websites, apps)'];
        return applications[Math.floor(Math.random() * applications.length)];
    };

    // NEW: CONTEXTUAL SPECIAL INSTRUCTIONS GENERATION
    const getContextualSpecialInstructions = (industry: string, style: string, personality: string): string => {
        const instructionsPool = [
            'Ensure the logo works well in both large and small sizes',
            'Focus on creating a timeless design that won\'t look outdated',
            'Make the logo distinctive and memorable',
            'Ensure good contrast for both light and dark backgrounds',
            'Create a design that reflects the company\'s core values',
            'Make it versatile for various marketing materials',
            'Focus on simplicity and clarity',
            'Ensure the design is unique and stands out from competitors'
        ];

        const industrySpecific: StringIndexed<string[]> = {
            'Technology': ['Incorporate subtle tech elements without being too literal', 'Focus on innovation and forward-thinking design'],
            'Healthcare/Medical': ['Convey trust, care, and professionalism', 'Use calming and reassuring design elements'],
            'Food/Restaurant': ['Make it appetizing and inviting', 'Consider how it will look on packaging and signage'],
            'Finance/Banking': ['Emphasize stability, trust, and security', 'Use conservative yet modern design approaches'],
            'Legal': ['Convey authority, trust, and professionalism', 'Use traditional yet contemporary elements'],
            'Design/Creative': ['Show creativity while maintaining professionalism', 'Make it visually striking and artistic'],
            'Sports/Fitness': ['Convey energy, movement, and strength', 'Use dynamic and motivating design elements'],
            'Fashion/Beauty': ['Emphasize elegance, style, and sophistication', 'Consider premium and luxury aesthetics']
        };

        const styleSpecific: StringIndexed<string[]> = {
            'Modern': ['Keep lines clean and contemporary', 'Avoid overly decorative elements'],
            'Minimalist': ['Use negative space effectively', 'Focus on essential elements only'],
            'Vintage': ['Incorporate classic design elements', 'Use traditional color palettes appropriately'],
            'Hand-Drawn': ['Maintain authentic hand-crafted feel', 'Ensure consistency in line work'],
            'Hi-Tech': ['Use precise geometric forms', 'Incorporate subtle technological references']
        };

        const personalitySpecific: StringIndexed<string[]> = {
            'Professional': ['Maintain business-appropriate aesthetics', 'Ensure credibility and trustworthiness'],
            'Playful': ['Include friendly and approachable elements', 'Use vibrant and engaging design'],
            'Elegant': ['Focus on sophisticated and refined aesthetics', 'Use premium design principles'],
            'Bold & Energetic': ['Create strong visual impact', 'Use dynamic and powerful design elements'],
            'Luxury & Premium': ['Emphasize exclusivity and high quality', 'Use premium materials and finishes conceptually']
        };

        // Combine instructions from different categories
        const allInstructions = [
            ...instructionsPool,
            ...(industrySpecific[industry] || []),
            ...(styleSpecific[style] || []),
            ...(personalitySpecific[personality] || [])
        ];

        // Return a random instruction
        return allInstructions[Math.floor(Math.random() * allInstructions.length)];
    };

    // COMPREHENSIVE PARAMETER GENERATION WITH ALL PARAMETERS
    const getRandomLogoParameters = async (company: CompanyData): Promise<LogoParameters> => {
        // AI-powered industry classification
        const industry = await classifyIndustryWithAI(company);

        // Build contextual parameters
        const overallStyle = getContextualStyle(industry);
        const colorScheme = getContextualColors(industry, overallStyle);
        const symbolFocus = getContextualSymbolFocus(industry);
        const brandPersonality = getContextualPersonality(industry, company.name);

        // Fixed values for bulk generation consistency
        const size = '1024x1024';
        const transparentBackground = 'true';

        // Base required parameters
        const parameters: LogoParameters = {
            companyName: company.name,
            overallStyle,
            colorScheme,
            symbolFocus,
            brandPersonality,
            industry,
            size,
            transparentBackground
        };

        // OPTIONAL PARAMETERS WITH CHANCES

        // Slogan (70% chance)
        if (Math.random() > 0.3) {
            parameters.slogan = company.slogan;
        }

        // Typography Style (65% chance)
        if (Math.random() > 0.35) {
            parameters.typographyStyle = getContextualTypography(industry, overallStyle);
        }

        // Line Style (60% chance)
        if (Math.random() > 0.4) {
            parameters.lineStyle = getContextualLineStyle(overallStyle, brandPersonality);
        }

        // Composition (65% chance)
        if (Math.random() > 0.35) {
            parameters.composition = getContextualComposition(symbolFocus, industry);
        }

        // Shape Emphasis (60% chance)
        if (Math.random() > 0.4) {
            parameters.shapeEmphasis = getContextualShape(industry, symbolFocus);
        }

        // Texture (50% chance)
        if (Math.random() > 0.5) {
            parameters.texture = getContextualTexture(overallStyle, brandPersonality);
        }

        // Complexity Level (55% chance)
        if (Math.random() > 0.45) {
            parameters.complexityLevel = getContextualComplexity(industry, brandPersonality);
        }

        // Application Context (60% chance)
        if (Math.random() > 0.4) {
            parameters.applicationContext = getContextualApplication(industry);
        }

        // Special Instructions (40% chance)
        if (Math.random() > 0.6) {
            parameters.specialInstructions = getContextualSpecialInstructions(industry, overallStyle, brandPersonality);
        }

        return parameters;
    };

    const getRandomUnusedCompany = (): CompanyData | null => {
        const availableCompanies = companyData.companies.filter(company => {
            return !usedCompanyNames.has(company.name);
        });

        if (availableCompanies.length === 0) {
            return null;
        }

        return availableCompanies[Math.floor(Math.random() * availableCompanies.length)];
    };

    // Function to build the prompt from parameters
    const buildPromptFromParameters = (params: LogoParameters): string => {
        let prompt = `Create a professional logo for "${params.companyName}".`;

        if (params.slogan) {
            prompt += ` Company slogan: "${params.slogan}".`;
        }

        prompt += ` Style: ${params.overallStyle}.`;
        prompt += ` Color scheme: ${params.colorScheme}.`;
        prompt += ` Symbol focus: ${params.symbolFocus}.`;
        prompt += ` Brand personality: ${params.brandPersonality}.`;
        prompt += ` Industry: ${params.industry}.`;

        if (params.typographyStyle) {
            prompt += ` Typography: ${params.typographyStyle}.`;
        }

        if (params.lineStyle) {
            prompt += ` Line style: ${params.lineStyle}.`;
        }

        if (params.composition) {
            prompt += ` Composition: ${params.composition}.`;
        }

        if (params.shapeEmphasis) {
            prompt += ` Shape emphasis: ${params.shapeEmphasis}.`;
        }

        if (params.texture) {
            prompt += ` Texture: ${params.texture}.`;
        }

        if (params.complexityLevel) {
            prompt += ` Complexity: ${params.complexityLevel}.`;
        }

        if (params.applicationContext) {
            prompt += ` Primary application: ${params.applicationContext}.`;
        }

        if (params.specialInstructions) {
            prompt += ` Special instructions: ${params.specialInstructions}.`;
        }

        if (params.transparentBackground === 'true') {
            prompt += ' Use transparent background.';
        }

        prompt += ' Logo should be clean, professional, and suitable for business use.';

        return prompt;
    };

    // FIXED: Generate single logo function with proper company name
    const generateSingleLogo = async (company: CompanyData): Promise<StoredLogo | null> => {
        try {
            const parameters = await getRandomLogoParameters(company);
            const prompt = buildPromptFromParameters(parameters);

            // Create form data for the API call
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('size', parameters.size);
            formData.append('isBulkGeneration', 'true');

            // Call the logo generation API
            const response = await fetch('/logos', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Logo generation failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.image || !result.image.data) {
                throw new Error('No image data received from API');
            }

            // Convert base64 data to data URI format
            const imageDataUri = `data:image/png;base64,${result.image.data}`;

            // FIXED: Save logo with proper company name
            const logoId = await saveLogo(
                user!.email,         // userId
                imageDataUri,        // imageDataUri
                parameters,          // parameters
                undefined,           // originalLogoId (undefined for new logos)
                company.name         // name - Use the company name instead of defaulting to "Untitled"
            );

            // Get the full logo object using the returned ID
            const savedLogo = await getLogo(logoId, user!.email);

            return savedLogo;
        } catch (error) {
            console.error('Error generating single logo:', error);
            return null;
        }
    };

    // Main bulk generation function
    const startBulkGeneration = async () => {
        if (!user || isGenerating) return;

        setIsGenerating(true);
        setProgress({
            totalLogos: bulkCount,
            currentCount: 0,
            remaining: bulkCount,
            currentCompany: '',
            status: 'generating'
        });

        const newGeneratedLogos: StoredLogo[] = [];

        try {
            for (let i = 0; i < bulkCount; i++) {
                const company = getRandomUnusedCompany();

                if (!company) {
                    setProgress(prev => ({
                        ...prev,
                        status: 'error',
                        errorMessage: 'No more unused company names available'
                    }));
                    break;
                }

                // Update progress with company name
                setProgress(prev => ({
                    ...prev,
                    currentCount: i,
                    remaining: bulkCount - i,
                    currentCompany: company.name,
                    currentIndustry: 'Classifying...'
                }));

                // Classify industry first and update progress
                const classifiedIndustry = await classifyIndustryWithAI(company);
                setProgress(prev => ({
                    ...prev,
                    currentIndustry: classifiedIndustry
                }));

                // Small delay to show the classification
                await new Promise(resolve => setTimeout(resolve, 500));

                const logo = await generateSingleLogo(company);

                if (logo) {
                    newGeneratedLogos.push(logo);
                    setGeneratedLogos(prev => [...prev, logo]);
                    setUsedCompanyNames(prev => new Set([...prev, company.name]));
                }

                // Small delay to prevent overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setProgress(prev => ({
                ...prev,
                currentCount: bulkCount,
                remaining: 0,
                status: 'completed',
                currentCompany: '',
                currentIndustry: undefined
            }));

        } catch (error) {
            console.error('Bulk generation error:', error);
            setProgress(prev => ({
                ...prev,
                status: 'error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
            }));
        } finally {
            setIsGenerating(false);
        }
    };

    // Function to view a logo
    const handleViewLogo = (logoId: string) => {
        router.push(`/logos/${logoId}`);
    };

    // Check authorization
    if (!user || !user.isSuperUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 pb-6 max-w-4xl">
            <div className="mt-4 card">
                <h1 className="text-2xl font-bold mb-6 text-center text-indigo-600">
                    🚀 Comprehensive Bulk Logo Generator
                </h1>

                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                    <p className="font-semibold">⚡ All Parameters Included with Contextual AI Selection</p>
                    <p className="text-sm">
                        This enhanced tool now includes ALL logo parameters with intelligent contextual selection.
                        Every parameter has a chance to be included based on industry, style, and brand personality.
                        Used company names: {usedCompanyNames.size} / {companyData.companies.length}
                    </p>
                </div>

                {/* Generation Controls */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Generation Settings</h2>

                    <div className="mb-4">
                        <label htmlFor="bulkCount" className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Logos to Generate
                        </label>
                        <select
                            id="bulkCount"
                            value={bulkCount}
                            onChange={(e) => setBulkCount(parseInt(e.target.value))}
                            disabled={isGenerating}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value={5}>5 logos</option>
                            <option value={10}>10 logos</option>
                            <option value={25}>25 logos</option>
                            <option value={50}>50 logos</option>
                            <option value={100}>100 logos</option>
                        </select>
                    </div>

                    <button
                        onClick={startBulkGeneration}
                        disabled={isGenerating || usedCompanyNames.size >= companyData.companies.length}
                        className={`w-full py-3 px-4 rounded-md font-medium ${
                            isGenerating || usedCompanyNames.size >= companyData.companies.length
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white transition-colors`}
                    >
                        {isGenerating ? '🔄 Generating...' : '🚀 Start Comprehensive Bulk Generation'}
                    </button>
                </div>

                {/* NEW: Utility Tools Section - Only show if there are untitled logos */}
                {untitledLogos.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-orange-800 mb-1">
                                    🔧 Maintenance Tools
                                </h3>
                                <p className="text-xs text-orange-700">
                                    Found {untitledLogos.length} logo{untitledLogos.length > 1 ? 's' : ''} with "Untitled" names
                                </p>
                            </div>
                            <button
                                onClick={fixUntitledLogos}
                                disabled={isFixingUntitled || isGenerating}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isFixingUntitled || isGenerating
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                                }`}
                            >
                                {isFixingUntitled ? (
                                    <span className="flex items-center space-x-2">
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        <span>Fixing...</span>
                                    </span>
                                ) : (
                                    '🏷️ Fix Names'
                                )}
                            </button>
                        </div>

                        {/* Progress bar for fixing process */}
                        {isFixingUntitled && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-orange-700 mb-1">
                                    <span>Renaming logos...</span>
                                    <span>{fixingProgress.current} / {fixingProgress.total}</span>
                                </div>
                                <div className="w-full bg-orange-200 rounded-full h-2">
                                    <div
                                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${fixingProgress.total > 0 ? (fixingProgress.current / fixingProgress.total) * 100 : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Progress Display */}
                {progress.status !== 'idle' && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Generation Progress</h2>

                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{progress.currentCount} / {progress.totalLogos}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${progress.totalLogos > 0 ? (progress.currentCount / progress.totalLogos) * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-semibold text-indigo-600">{progress.currentCount}</div>
                                <div className="text-gray-500">Generated</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-orange-600">{progress.remaining}</div>
                                <div className="text-gray-500">Remaining</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-green-600">{progress.totalLogos}</div>
                                <div className="text-gray-500">Total</div>
                            </div>
                        </div>

                        {progress.currentCompany && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    🎨 Currently generating: <span className="font-semibold">{progress.currentCompany}</span>
                                </p>
                                {progress.currentIndustry && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        🏢 Industry: {progress.currentIndustry}
                                    </p>
                                )}
                            </div>
                        )}

                        {progress.status === 'completed' && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-800">
                                    ✅ Comprehensive bulk generation completed successfully!
                                </p>
                            </div>
                        )}

                        {progress.status === 'error' && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-800">
                                    ❌ Error: {progress.errorMessage}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Generated Logos Display */}
                {generatedLogos.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Recently Generated Logos ({generatedLogos.length})
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {generatedLogos.slice().reverse().map((logo) => (
                                <div
                                    key={logo.id}
                                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleViewLogo(logo.id)}
                                >
                                    <div className="aspect-square mb-2">
                                        <img
                                            src={logo.imageDataUri}
                                            alt={logo.parameters.companyName || 'Generated Logo'}
                                            className="w-full h-full object-contain rounded"
                                        />
                                    </div>
                                    <div className="text-xs text-center">
                                        <div className="font-medium truncate">
                                            {logo.parameters.companyName || 'Unknown Company'}
                                        </div>
                                        <div className="text-gray-500 truncate">
                                            {logo.parameters.industry || 'Unknown Industry'}
                                        </div>
                                        <div className="text-gray-400 text-xs mt-1">
                                            {logo.parameters.overallStyle} • {logo.parameters.symbolFocus}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}