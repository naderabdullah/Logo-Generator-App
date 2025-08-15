// src/app/constants/industries.ts
// Centralized industry list used across all logo generation methods

export const INDUSTRIES = [
    'Agriculture',
    'Arts/Entertainment',
    'Consulting',
    'Construction/Real Estate',
    'Design/Creative',
    'Education',
    'Energy',
    'Entertainment/Media',
    'Fashion/Beauty',
    'Finance/Banking',
    'Food/Restaurant',
    'Healthcare/Medical',
    'Legal',
    'Manufacturing/Industrial',
    'Marketing/Advertising',
    'Non-profit/Charity',
    'Professional Services',
    'Retail/Shopping',
    'Security',
    'Sports/Fitness',
    'Technology',
    'Telecommunications',
    'Transportation/Logistics',
    'Travel/Hospitality'
] as const;

export type Industry = typeof INDUSTRIES[number];

// Helper function to validate industry
export const isValidIndustry = (industry: string): industry is Industry => {
    return INDUSTRIES.includes(industry as Industry);
};

// Default fallback industry
export const DEFAULT_INDUSTRY: Industry = 'Professional Services';