// src/app/context/GenerationContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GenerationContextType {
  isGenerating: boolean;
  isRevising: boolean;
  isBulkGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  setIsRevising: (revising: boolean) => void;
  setIsBulkGenerating: (bulkGenerating: boolean) => void;
  isAnyGenerationActive: () => boolean;
}

const GenerationContext = createContext<GenerationContextType>({
  isGenerating: false,
  isRevising: false,
  isBulkGenerating: false,
  setIsGenerating: () => {},
  setIsRevising: () => {},
  setIsBulkGenerating: () => {},
  isAnyGenerationActive: () => false,
});

export const useGeneration = () => useContext(GenerationContext);

export const GenerationProvider = ({ children }: { children: ReactNode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  const isAnyGenerationActive = () => {
    return isGenerating || isRevising || isBulkGenerating;
  };

  return (
    <GenerationContext.Provider
      value={{
        isGenerating,
        isRevising,
        isBulkGenerating,
        setIsGenerating,
        setIsRevising,
        setIsBulkGenerating,
        isAnyGenerationActive,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
};