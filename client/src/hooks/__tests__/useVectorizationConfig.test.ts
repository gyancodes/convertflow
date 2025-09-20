import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  useVectorizationConfig, 
  validateVectorizationConfig, 
  DEFAULT_VECTORIZATION_CONFIG,
  CONFIG_VALIDATION 
} from '../useVectorizationConfig';
import { VectorizationConfig } from '../../types/converter';

describe('useVectorizationConfig', () => {
  it('initializes with default configuration', () => {
    const { result } = renderHook(() => useVectorizationConfig());
    
    expect(result.current.config).toEqual(DEFAULT_VECTORIZATION_CONFIG);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toHaveLength(0);
  });

  it('initializes with custom configuration', () => {
    const customConfig = { colorCount: 32, algorithm: 'shapes' as const };
    const { result } = renderHook(() => useVectorizationConfig(customConfig));
    
    expect(result.current.config).toEqual({
      ...DEFAULT_VECTORIZATION_CONFIG,
      ...customConfig
    });
  });

  it('updates configuration correctly', () => {
    const { result } = renderHook(() => useVectorizationConfig());
    
    act(() => {
      result.current.updateConfig({ colorCount: 64, smoothingLevel: 'high' });
    });

    expect(result.current.config.colorCount).toBe(64);
    expect(result.current.config.smoothingLevel).toBe('high');
    expect(result.current.config.algorithm).toBe('auto'); // Should preserve other values
  });

  it('rejects invalid configuration updates', () => {
    const { result } = renderHook(() => useVectorizationConfig());
    const originalConfig = result.current.config;
    
    act(() => {
      result.current.updateConfig({ colorCount: 500 }); // Invalid: exceeds max
    });

    expect(result.current.config).toEqual(originalConfig); // Should not change
  });

  it('resets configuration to defaults', () => {
    const { result } = renderHook(() => useVectorizationConfig());
    
    // First modify the config
    act(() => {
      result.current.updateConfig({ colorCount: 64, algorithm: 'photo' });
    });

    expect(result.current.config.colorCount).toBe(64);
    
    // Then reset
    act(() => {
      result.current.resetConfig();
    });

    expect(result.current.config).toEqual(DEFAULT_VECTORIZATION_CONFIG);
  });

  it('validates configuration and reports errors', () => {
    const { result } = renderHook(() => useVectorizationConfig());
    
    // Start with valid config
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toHaveLength(0);
    
    // Try to set invalid config (this should be rejected)
    act(() => {
      result.current.updateConfig({ colorCount: 1 }); // Below minimum
    });

    // Config should remain valid because invalid update was rejected
    expect(result.current.isValid).toBe(true);
  });
});

describe('validateVectorizationConfig', () => {
  it('validates correct configuration', () => {
    const validConfig: VectorizationConfig = {
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };

    const result = validateVectorizationConfig(validConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects invalid color count', () => {
    const invalidConfig: VectorizationConfig = {
      colorCount: 1, // Below minimum
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };

    const result = validateVectorizationConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `Color count must be between ${CONFIG_VALIDATION.colorCount.min} and ${CONFIG_VALIDATION.colorCount.max}`
    );
  });

  it('detects invalid path simplification', () => {
    const invalidConfig: VectorizationConfig = {
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 15.0, // Above maximum
      preserveTransparency: true,
      algorithm: 'auto'
    };

    const result = validateVectorizationConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `Path simplification must be between ${CONFIG_VALIDATION.pathSimplification.min} and ${CONFIG_VALIDATION.pathSimplification.max}`
    );
  });

  it('detects invalid smoothing level', () => {
    const invalidConfig: VectorizationConfig = {
      colorCount: 16,
      smoothingLevel: 'invalid' as any,
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };

    const result = validateVectorizationConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Smoothing level must be low, medium, or high');
  });

  it('detects invalid algorithm', () => {
    const invalidConfig: VectorizationConfig = {
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'invalid' as any
    };

    const result = validateVectorizationConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Algorithm must be auto, shapes, photo, or lineart');
  });

  it('detects multiple validation errors', () => {
    const invalidConfig: VectorizationConfig = {
      colorCount: 500, // Invalid
      smoothingLevel: 'invalid' as any, // Invalid
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };

    const result = validateVectorizationConfig(invalidConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('validates boundary values correctly', () => {
    // Test minimum values
    const minConfig: VectorizationConfig = {
      colorCount: CONFIG_VALIDATION.colorCount.min,
      smoothingLevel: 'low',
      pathSimplification: CONFIG_VALIDATION.pathSimplification.min,
      preserveTransparency: false,
      algorithm: 'shapes'
    };

    expect(validateVectorizationConfig(minConfig).isValid).toBe(true);

    // Test maximum values
    const maxConfig: VectorizationConfig = {
      colorCount: CONFIG_VALIDATION.colorCount.max,
      smoothingLevel: 'high',
      pathSimplification: CONFIG_VALIDATION.pathSimplification.max,
      preserveTransparency: true,
      algorithm: 'lineart'
    };

    expect(validateVectorizationConfig(maxConfig).isValid).toBe(true);
  });
});

describe('DEFAULT_VECTORIZATION_CONFIG', () => {
  it('has valid default values', () => {
    const result = validateVectorizationConfig(DEFAULT_VECTORIZATION_CONFIG);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('has expected default values', () => {
    expect(DEFAULT_VECTORIZATION_CONFIG).toEqual({
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    });
  });
});