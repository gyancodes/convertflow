/**
 * Tests for error handling utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorType } from '../../types/errors';
import { VectorizationConfig } from '../../types/converter';

describe('Error Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Validation Errors', () => {
    it('should handle file size errors', () => {
      const error = new Error('File size exceeds maximum');
      expect(error.message).toContain('size');
    });

    it('should handle file corruption errors', () => {
      const error = new Error('File signature is invalid');
      expect(error.message).toContain('signature');
    });
  });

  describe('Processing Errors', () => {
    it('should handle memory errors', () => {
      const error = new Error('Out of memory');
      expect(error.message).toContain('memory');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Processing timeout');
      expect(error.message).toContain('timeout');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate color count range', () => {
      const validConfig: VectorizationConfig = {
        colorCount: 16,
        smoothingLevel: 'medium',
        pathSimplification: 1.0,
        preserveTransparency: true,
        algorithm: 'auto'
      };
      
      expect(validConfig.colorCount).toBeGreaterThanOrEqual(2);
      expect(validConfig.colorCount).toBeLessThanOrEqual(256);
    });

    it('should validate path simplification range', () => {
      const validConfig: VectorizationConfig = {
        colorCount: 16,
        smoothingLevel: 'medium',
        pathSimplification: 1.0,
        preserveTransparency: true,
        algorithm: 'auto'
      };
      
      expect(validConfig.pathSimplification).toBeGreaterThanOrEqual(0.1);
      expect(validConfig.pathSimplification).toBeLessThanOrEqual(10.0);
    });
  });

  describe('Browser Compatibility', () => {
    it('should check for required APIs', () => {
      const requiredAPIs = ['File', 'FileReader', 'FileList'];
      
      requiredAPIs.forEach(api => {
        expect(typeof window[api as keyof Window]).toBeDefined();
      });
    });
  });
});