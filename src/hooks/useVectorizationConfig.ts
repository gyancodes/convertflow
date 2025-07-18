import { useState, useCallback } from 'react';
import { VectorizationConfig } from '../types/converter';

/**
 * Default vectorization configuration settings
 */
export const DEFAULT_VECTORIZATION_CONFIG: VectorizationConfig = {
  colorCount: 16,
  smoothingLevel: 'medium',
  pathSimplification: 1.0,
  preserveTransparency: true,
  algorithm: 'auto'
};

/**
 * Configuration validation rules
 */
export const CONFIG_VALIDATION = {
  colorCount: { min: 2, max: 256 },
  pathSimplification: { min: 0.1, max: 10.0 }
} as const;

/**
 * Validates a vectorization configuration object
 */
export function validateVectorizationConfig(config: VectorizationConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate color count
  if (config.colorCount < CONFIG_VALIDATION.colorCount.min || 
      config.colorCount > CONFIG_VALIDATION.colorCount.max) {
    errors.push(`Color count must be between ${CONFIG_VALIDATION.colorCount.min} and ${CONFIG_VALIDATION.colorCount.max}`);
  }

  // Validate path simplification
  if (config.pathSimplification < CONFIG_VALIDATION.pathSimplification.min || 
      config.pathSimplification > CONFIG_VALIDATION.pathSimplification.max) {
    errors.push(`Path simplification must be between ${CONFIG_VALIDATION.pathSimplification.min} and ${CONFIG_VALIDATION.pathSimplification.max}`);
  }

  // Validate smoothing level
  if (!['low', 'medium', 'high'].includes(config.smoothingLevel)) {
    errors.push('Smoothing level must be low, medium, or high');
  }

  // Validate algorithm
  if (!['auto', 'shapes', 'photo', 'lineart'].includes(config.algorithm)) {
    errors.push('Algorithm must be auto, shapes, photo, or lineart');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Custom hook for managing vectorization configuration state
 */
export function useVectorizationConfig(initialConfig?: Partial<VectorizationConfig>) {
  const [config, setConfig] = useState<VectorizationConfig>(() => ({
    ...DEFAULT_VECTORIZATION_CONFIG,
    ...initialConfig
  }));

  const updateConfig = useCallback((updates: Partial<VectorizationConfig>) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig, ...updates };
      
      // Validate the new configuration
      const validation = validateVectorizationConfig(newConfig);
      if (!validation.isValid) {
        console.warn('Invalid configuration:', validation.errors);
        return prevConfig; // Don't update if invalid
      }
      
      return newConfig;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_VECTORIZATION_CONFIG);
  }, []);

  const validation = validateVectorizationConfig(config);

  return {
    config,
    updateConfig,
    resetConfig,
    isValid: validation.isValid,
    errors: validation.errors
  };
}