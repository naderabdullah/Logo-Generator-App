// src/app/components/CatalogCodeInput.tsx
'use client';

import React, { useState, useEffect } from 'react';

// CatalogLogo interface to match backend
interface CatalogLogo {
    id: number;
    catalog_code: string;
    logo_key_id: string;
    image_data_uri: string;
    parameters: any;
    created_at: string;
    created_by: string;
    original_company_name: string;
}

interface CatalogCodeInputProps {
    enabled: boolean;
    value: string;
    onChange: (code: string) => void;
    onCatalogLoaded: (catalogData: CatalogLogo | null) => void;
    onError: (error: string | null) => void;
    disabled?: boolean;
}

export default function CatalogCodeInput({
                                             enabled,
                                             value,
                                             onChange,
                                             onCatalogLoaded,
                                             onError,
                                             disabled = false
                                         }: CatalogCodeInputProps) {
    const [loading, setLoading] = useState(false);
    const [lastValidCode, setLastValidCode] = useState<string>('');

    // Validate catalog code format (CAT-XXX)
    const isValidCodeFormat = (code: string): boolean => {
        return /^CAT-\d{3}$/i.test(code.trim());
    };

    // Fetch catalog data from API
    const fetchCatalogData = async (code: string): Promise<CatalogLogo | null> => {
        try {
            const response = await fetch(`/api/catalog?action=get_by_code&code=${code.toUpperCase()}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Catalog code ${code.toUpperCase()} not found`);
                }
                throw new Error(`Failed to fetch catalog data: ${response.statusText}`);
            }

            const data = await response.json();
            return data.catalogLogo;
        } catch (error) {
            throw error;
        }
    };

    // Handle code input changes with debounced API calls
    useEffect(() => {
        const trimmedValue = value.trim();

        // Clear states if input is empty
        if (!trimmedValue) {
            onCatalogLoaded(null);
            onError(null);
            setLastValidCode('');
            return;
        }

        // Don't fetch if we already have this code loaded
        if (trimmedValue.toUpperCase() === lastValidCode.toUpperCase()) {
            return;
        }

        // Validate format before making API call
        if (!isValidCodeFormat(trimmedValue)) {
            onError('Invalid format. Use: CAT-XXX (e.g., CAT-001)');
            onCatalogLoaded(null);
            return;
        }

        // Debounce API calls
        const timeoutId = setTimeout(async () => {
            setLoading(true);
            onError(null);

            try {
                const catalogData = await fetchCatalogData(trimmedValue);

                if (catalogData) {
                    onCatalogLoaded(catalogData);
                    setLastValidCode(trimmedValue);
                    onError(null);
                } else {
                    onCatalogLoaded(null);
                    onError(`Catalog code ${trimmedValue.toUpperCase()} not found`);
                }
            } catch (error) {
                onCatalogLoaded(null);
                onError(error instanceof Error ? error.message : 'Failed to fetch catalog data');
            } finally {
                setLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [value, onCatalogLoaded, onError, lastValidCode]);

    // Clear function
    const handleClear = () => {
        onChange('');
        onCatalogLoaded(null);
        onError(null);
        setLastValidCode('');
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toUpperCase(); // Auto-uppercase
        onChange(newValue);
    };

    return (
        <div>
            <div style={{
                display: 'flex',
                gap: 'var(--space-xs)',
                alignItems: 'flex-start'
            }}>
                {/* Input Field */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        id="catalog-code"
                        className="form-input"
                        value={value}
                        onChange={handleInputChange}
                        placeholder="Enter Catalog Code"
                        disabled={!enabled || disabled || loading}
                        style={{
                            paddingRight: loading ? 'var(--space-2xl)' : 'var(--space-md)',
                            backgroundColor: !enabled ? 'var(--color-gray-100)' : 'white',
                            cursor: !enabled ? 'not-allowed' : 'text'
                        }}
                        maxLength={7} // CAT-XXX format
                    />

                    {/* Loading Spinner */}
                    {loading && (
                        <div style={{
                            position: 'absolute',
                            right: 'var(--space-sm)',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '16px',
                            height: '16px',
                            border: '2px solid var(--color-gray-300)',
                            borderTop: '2px solid var(--color-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    )}
                </div>

                {/* Clear Button */}
                {enabled && value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={disabled || loading}
                        style={{
                            padding: 'var(--space-xs) var(--space-sm)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-gray-600)',
                            backgroundColor: 'white',
                            border: '1px solid var(--color-gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            minHeight: 'var(--touch-target)',
                            transition: 'all var(--transition-base)'
                        }}
                        onMouseOver={(e) => {
                            if (!disabled && !loading) {
                                e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Status Messages */}
            {enabled && value && lastValidCode && !loading && (
                <div style={{
                    marginTop: 'var(--space-xs)',
                    padding: 'var(--space-xs)',
                    backgroundColor: 'var(--color-green-50)',
                    border: '1px solid var(--color-green-200)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-green-700)'
                }}>
                    ✅ Template loaded successfully
                </div>
            )}
        </div>
    );
}

// Add keyframe animation for loading spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-50%) rotate(360deg); }
  }
`;
document.head.appendChild(style);