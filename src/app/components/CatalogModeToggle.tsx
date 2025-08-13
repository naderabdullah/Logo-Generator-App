// src/app/components/CatalogModeToggle.tsx
'use client';

import React from 'react';

interface CatalogModeToggleProps {
    catalogMode: boolean;
    onChange: (catalogMode: boolean) => void;
    disabled?: boolean;
}

export default function CatalogModeToggle({ catalogMode, onChange, disabled = false }: CatalogModeToggleProps) {
    return (
        <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-sm)'
        }}>
            {/* Manual Mode Option */}
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1
            }}>
                <input
                    type="radio"
                    name="generation-mode"
                    checked={!catalogMode}
                    onChange={() => !disabled && onChange(false)}
                    disabled={disabled}
                    style={{
                        width: '16px',
                        height: '16px',
                        cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                />
                <span style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '500',
                    color: disabled ? 'var(--color-gray-500)' : 'var(--color-gray-700)'
                }}>
          Manual Mode
        </span>
            </label>

            {/* Catalog Mode Option */}
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1
            }}>
                <input
                    type="radio"
                    name="generation-mode"
                    checked={catalogMode}
                    onChange={() => !disabled && onChange(true)}
                    disabled={disabled}
                    style={{
                        width: '16px',
                        height: '16px',
                        cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                />
                <span style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '500',
                    color: disabled ? 'var(--color-gray-500)' : 'var(--color-gray-700)'
                }}>
          Catalog Mode
        </span>
            </label>
        </div>
    );
}