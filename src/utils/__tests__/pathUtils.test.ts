import { describe, it, expect } from 'vitest';
import {
  optimizeSVGPath,
  calculatePolygonArea,
  isClockwise,
  reverseContour,
  smoothPath,
  removeDuplicatePoints,
  pathToAbsolute,
  mergeSimilarPaths,
  isValidSVGPath
} from '../pathUtils';
import { ContourPoint, VectorPath } from '../../types/vectorization';

describe('pathUtils', () => {
  describe('optimizeSVGPath', () => {
    it('should remove unnecessary whitespace', () => {
      const input = 'M  0   0  L  10   10   Z';
      const result = optimizeSVGPath(input);
      expect(result).toBe('M 0 0 L 10 10 Z');
    });

    it('should handle empty path', () => {
      const result = optimizeSVGPath('');
      expect(result).toBe('');
    });

    it('should preserve valid path structure', () => {
      const input = 'M 0 0 L 10 0 L 10 10 L 0 10 Z';
      const result = optimizeSVGPath(input);
      expect(result).toContain('M 0 0');
      expect(result).toContain('Z');
    });
  });

  describe('calculatePolygonArea', () => {
    it('should calculate area of square', () => {
      const square: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      
      const area = calculatePolygonArea(square);
      expect(area).toBe(100);
    });

    it('should calculate area of triangle', () => {
      const triangle: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 }
      ];
      
      const area = calculatePolygonArea(triangle);
      expect(area).toBe(50);
    });

    it('should return 0 for insufficient points', () => {
      const line: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ];
      
      const area = calculatePolygonArea(line);
      expect(area).toBe(0);
    });
  });

  describe('isClockwise', () => {
    it('should detect clockwise square', () => {
      const clockwiseSquare: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 0 }
      ];
      
      expect(isClockwise(clockwiseSquare)).toBe(true);
    });

    it('should detect counter-clockwise square', () => {
      const counterClockwiseSquare: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      
      expect(isClockwise(counterClockwiseSquare)).toBe(false);
    });
  });

  describe('reverseContour', () => {
    it('should reverse point order', () => {
      const original: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ];
      
      const reversed = reverseContour(original);
      
      expect(reversed).toEqual([
        { x: 2, y: 2 },
        { x: 1, y: 1 },
        { x: 0, y: 0 }
      ]);
      
      // Original should be unchanged
      expect(original[0]).toEqual({ x: 0, y: 0 });
    });

    it('should handle empty array', () => {
      const result = reverseContour([]);
      expect(result).toEqual([]);
    });
  });

  describe('smoothPath', () => {
    it('should smooth jagged path', () => {
      const jaggedPath: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 5 }, // Spike
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 }
      ];
      
      const smoothed = smoothPath(jaggedPath, 3);
      
      expect(smoothed).toHaveLength(jaggedPath.length);
      // The spike should be reduced
      expect(smoothed[1].y).toBeLessThan(jaggedPath[1].y);
      expect(smoothed[1].y).toBeGreaterThan(0);
    });

    it('should handle path shorter than window size', () => {
      const shortPath: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ];
      
      const result = smoothPath(shortPath, 5);
      expect(result).toEqual(shortPath);
    });
  });

  describe('removeDuplicatePoints', () => {
    it('should remove consecutive duplicate points', () => {
      const withDuplicates: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 0.05, y: 0.05 }, // Very close to previous
        { x: 1, y: 1 },
        { x: 1.01, y: 1.01 }, // Very close to previous
        { x: 2, y: 2 }
      ];
      
      const filtered = removeDuplicatePoints(withDuplicates, 0.1);
      
      expect(filtered).toHaveLength(3);
      expect(filtered[0]).toEqual({ x: 0, y: 0 });
      expect(filtered[1]).toEqual({ x: 1, y: 1 });
      expect(filtered[2]).toEqual({ x: 2, y: 2 });
    });

    it('should handle empty array', () => {
      const result = removeDuplicatePoints([]);
      expect(result).toEqual([]);
    });

    it('should handle single point', () => {
      const singlePoint = [{ x: 1, y: 1 }];
      const result = removeDuplicatePoints(singlePoint);
      expect(result).toEqual(singlePoint);
    });
  });

  describe('pathToAbsolute', () => {
    it('should convert relative move and line commands', () => {
      const relativePath = 'm 10 10 l 5 0 l 0 5 l -5 0 z';
      const result = pathToAbsolute(relativePath);
      
      expect(result).toContain('M 10 10');
      expect(result).toContain('L 15 10');
      expect(result).toContain('L 15 15');
      expect(result).toContain('L 10 15');
      expect(result).toContain('Z');
    });

    it('should handle absolute commands unchanged', () => {
      const absolutePath = 'M 0 0 L 10 10 Z';
      const result = pathToAbsolute(absolutePath);
      
      expect(result).toBe('M 0 0 L 10 10 Z');
    });

    it('should handle horizontal and vertical lines', () => {
      const path = 'M 0 0 h 10 v 10 H 0 V 0 Z';
      const result = pathToAbsolute(path);
      
      expect(result).toContain('L 10 0');
      expect(result).toContain('L 10 10');
      expect(result).toContain('L 0 10');
      expect(result).toContain('L 0 0');
    });
  });

  describe('mergeSimilarPaths', () => {
    it('should merge paths with same color', () => {
      const paths: VectorPath[] = [
        {
          pathData: 'M 0 0 L 10 0 Z',
          fillColor: '#ff0000',
          complexity: 5
        },
        {
          pathData: 'M 20 0 L 30 0 Z',
          fillColor: '#ff0000',
          complexity: 5
        },
        {
          pathData: 'M 0 20 L 10 20 Z',
          fillColor: '#00ff00',
          complexity: 5
        }
      ];
      
      const merged = mergeSimilarPaths(paths, 0);
      
      expect(merged).toHaveLength(2);
      expect(merged[0].fillColor).toBe('#ff0000');
      expect(merged[0].pathData).toContain('M 0 0 L 10 0 Z M 20 0 L 30 0 Z');
      expect(merged[1].fillColor).toBe('#00ff00');
    });

    it('should handle single path', () => {
      const paths: VectorPath[] = [
        {
          pathData: 'M 0 0 L 10 0 Z',
          fillColor: '#ff0000',
          complexity: 5
        }
      ];
      
      const result = mergeSimilarPaths(paths, 0);
      expect(result).toEqual(paths);
    });

    it('should handle empty array', () => {
      const result = mergeSimilarPaths([], 0);
      expect(result).toEqual([]);
    });
  });

  describe('isValidSVGPath', () => {
    it('should validate correct SVG paths', () => {
      const validPaths = [
        'M 0 0 L 10 10 Z',
        'M 0 0 C 1 1 2 2 3 3 Z',
        'M 0 0 Q 1 1 2 2 Z',
        'm 0 0 l 10 10 z'
      ];
      
      for (const path of validPaths) {
        expect(isValidSVGPath(path)).toBe(true);
      }
    });

    it('should reject invalid SVG paths', () => {
      const invalidPaths = [
        'L 10 10', // Doesn't start with move
        'M 0 0 X 10 10', // Invalid command
        'invalid path data'
      ];
      
      for (const path of invalidPaths) {
        expect(isValidSVGPath(path)).toBe(false);
      }
      
      // Test empty path separately
      expect(isValidSVGPath('')).toBe(false);
      
      // Test incomplete command separately  
      expect(isValidSVGPath('M 0 0 L')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidSVGPath('M 0 0')).toBe(true); // Minimal valid path
      expect(isValidSVGPath('M 0.5 -1.2 L 10.7 20.3 Z')).toBe(true); // Decimal numbers
    });
  });
});