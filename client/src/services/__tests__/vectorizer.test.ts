import { describe, it, expect, beforeEach } from 'vitest';
import { Vectorizer } from '../vectorizer';
import { EdgeData, ContourPoint } from '../../types/vectorization';

describe('Vectorizer', () => {
  let vectorizer: Vectorizer;

  beforeEach(() => {
    vectorizer = new Vectorizer();
  });

  describe('Constructor', () => {
    it('should create vectorizer with default options', () => {
      const defaultVectorizer = new Vectorizer();
      expect(defaultVectorizer).toBeInstanceOf(Vectorizer);
    });

    it('should create vectorizer with custom options', () => {
      const customVectorizer = new Vectorizer({
        simplificationTolerance: 2.0,
        enableBezierFitting: false,
        minContourLength: 8
      });
      expect(customVectorizer).toBeInstanceOf(Vectorizer);
    });
  });

  describe('Douglas-Peucker Algorithm', () => {
    it('should simplify straight line to two points', () => {
      // Create a straight line with intermediate points
      const points: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 }
      ];

      // Access private method for testing
      const simplified = (vectorizer as any).douglasPeucker(points, 0.1);
      
      expect(simplified).toHaveLength(2);
      expect(simplified[0]).toEqual({ x: 0, y: 0 });
      expect(simplified[1]).toEqual({ x: 4, y: 0 });
    });

    it('should preserve significant points in curved path', () => {
      // Create a curved path
      const points: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 3 }, // Significant deviation
        { x: 3, y: 1 },
        { x: 4, y: 0 }
      ];

      const simplified = (vectorizer as any).douglasPeucker(points, 0.5);
      
      expect(simplified.length).toBeGreaterThan(2);
      expect(simplified).toContainEqual({ x: 2, y: 3 }); // Should preserve the peak
    });

    it('should handle edge cases', () => {
      // Empty array
      expect((vectorizer as any).douglasPeucker([], 1.0)).toEqual([]);
      
      // Single point
      const singlePoint = [{ x: 1, y: 1 }];
      expect((vectorizer as any).douglasPeucker(singlePoint, 1.0)).toEqual(singlePoint);
      
      // Two points
      const twoPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
      expect((vectorizer as any).douglasPeucker(twoPoints, 1.0)).toEqual(twoPoints);
    });
  });

  describe('Perpendicular Distance Calculation', () => {
    it('should calculate correct perpendicular distance', () => {
      const point = { x: 1, y: 1 };
      const lineStart = { x: 0, y: 0 };
      const lineEnd = { x: 2, y: 0 };

      const distance = (vectorizer as any).perpendicularDistance(point, lineStart, lineEnd);
      
      expect(distance).toBeCloseTo(1.0, 2);
    });

    it('should handle degenerate line case', () => {
      const point = { x: 1, y: 1 };
      const lineStart = { x: 0, y: 0 };
      const lineEnd = { x: 0, y: 0 }; // Same point

      const distance = (vectorizer as any).perpendicularDistance(point, lineStart, lineEnd);
      
      expect(distance).toBeCloseTo(Math.sqrt(2), 2);
    });
  });

  describe('Path Generation', () => {
    it('should generate linear path from contour', () => {
      const contour = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        closed: true,
        length: 40,
        bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
      };

      const pathData = (vectorizer as any).contourToLinearPath(contour);
      
      expect(pathData).toBe('M 0 0 L 10 0 L 10 10 L 0 10 Z');
    });

    it('should generate open path when contour is not closed', () => {
      const contour = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 }
        ],
        closed: false,
        length: 30,
        bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
      };

      const pathData = (vectorizer as any).contourToLinearPath(contour);
      
      expect(pathData).toBe('M 0 0 L 10 0 L 10 10');
      expect(pathData).not.toContain('Z');
    });

    it('should handle empty contour', () => {
      const emptyContour = {
        points: [],
        closed: false,
        length: 0,
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 }
      };

      const pathData = (vectorizer as any).contourToLinearPath(emptyContour);
      
      expect(pathData).toBe('');
    });
  });

  describe('Bézier Curve Fitting', () => {
    it('should fit cubic Bézier curve to point segment', () => {
      const points: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 0 }
      ];

      const bezier = (vectorizer as any).fitCubicBezier(points);
      
      expect(bezier).toHaveProperty('cp1');
      expect(bezier).toHaveProperty('cp2');
      expect(bezier).toHaveProperty('end');
      expect(bezier.end).toEqual({ x: 3, y: 0 });
    });

    it('should fit quadratic Bézier curve to point segment', () => {
      const points: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 0 }
      ];

      const bezier = (vectorizer as any).fitQuadraticBezier(points);
      
      expect(bezier).toHaveProperty('cp');
      expect(bezier).toHaveProperty('end');
      expect(bezier.end).toEqual({ x: 2, y: 0 });
    });

    it('should generate Bézier path from contour', () => {
      const contour = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 0 }
        ],
        closed: false,
        length: 10,
        bounds: { minX: 0, maxX: 3, minY: 0, maxY: 1 }
      };

      const pathData = (vectorizer as any).contourToBezierPath(contour);
      
      expect(pathData).toMatch(/^M \d+ \d+/); // Should start with Move command
      expect(pathData).toMatch(/[CQ]/); // Should contain Curve or Quadratic commands
    });
  });

  describe('Contour Utilities', () => {
    it('should calculate correct bounding box', () => {
      const points: ContourPoint[] = [
        { x: 1, y: 2 },
        { x: 5, y: 1 },
        { x: 3, y: 4 },
        { x: 0, y: 3 }
      ];

      const bounds = (vectorizer as any).calculateBounds(points);
      
      expect(bounds).toEqual({
        minX: 0,
        maxX: 5,
        minY: 1,
        maxY: 4
      });
    });

    it('should calculate contour length', () => {
      const points: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 3, y: 0 }, // Distance: 3
        { x: 3, y: 4 }  // Distance: 4
      ];

      const length = (vectorizer as any).calculateContourLength(points);
      
      expect(length).toBe(7); // 3 + 4
    });

    it('should calculate path complexity', () => {
      const simplePath = 'M 0 0 L 10 10';
      const complexPath = 'M 0 0 C 1 1 2 2 3 3 Q 4 4 5 5 L 6 6 Z';

      const simpleComplexity = (vectorizer as any).calculatePathComplexity(simplePath);
      const complexComplexity = (vectorizer as any).calculatePathComplexity(complexPath);
      
      expect(complexComplexity).toBeGreaterThan(simpleComplexity);
    });
  });

  describe('Edge Data Vectorization', () => {
    it('should vectorize simple edge data', async () => {
      // Create simple edge data with a square pattern
      const width = 10;
      const height = 10;
      const magnitude = new Float32Array(width * height);
      const direction = new Float32Array(width * height);

      // Create a simple square edge pattern
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          // Create edges around a 4x4 square in the center
          if ((x === 3 || x === 6) && y >= 3 && y <= 6) {
            magnitude[index] = 1.0; // Vertical edges
          } else if ((y === 3 || y === 6) && x >= 3 && x <= 6) {
            magnitude[index] = 1.0; // Horizontal edges
          } else {
            magnitude[index] = 0.0;
          }
          direction[index] = 0;
        }
      }

      const edgeData: EdgeData = {
        magnitude,
        direction,
        width,
        height,
        algorithm: 'sobel'
      };

      const colorMap = new Map([['#000000', '#000000']]);
      const paths = await vectorizer.vectorizeEdges(edgeData, colorMap);
      
      expect(paths).toBeInstanceOf(Array);
      expect(paths.length).toBeGreaterThan(0);
      
      for (const path of paths) {
        expect(path).toHaveProperty('pathData');
        expect(path).toHaveProperty('fillColor');
        expect(path).toHaveProperty('complexity');
        expect(typeof path.pathData).toBe('string');
        expect(path.pathData.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty edge data', async () => {
      const edgeData: EdgeData = {
        magnitude: new Float32Array(100),
        direction: new Float32Array(100),
        width: 10,
        height: 10,
        algorithm: 'sobel'
      };

      const colorMap = new Map();
      const paths = await vectorizer.vectorizeEdges(edgeData, colorMap);
      
      expect(paths).toBeInstanceOf(Array);
      expect(paths.length).toBe(0);
    });
  });

  describe('SVG Path Validation', () => {
    it('should generate valid SVG path commands', () => {
      const contour = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        closed: true,
        length: 40,
        bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
      };

      const pathData = (vectorizer as any).contourToLinearPath(contour);
      
      // Validate SVG path syntax
      expect(pathData).toMatch(/^M\s+[\d.-]+\s+[\d.-]+/); // Starts with Move
      expect(pathData).toMatch(/[LZ]/); // Contains Line or Close commands
      expect(pathData).not.toMatch(/[^MLHVCSQTAZ\s\d.-]/i); // Only valid SVG commands and numbers
    });

    it('should generate numerically valid coordinates', () => {
      const contour = {
        points: [
          { x: 1.5, y: 2.7 },
          { x: 10.123, y: 0.456 }
        ],
        closed: false,
        length: 10,
        bounds: { minX: 1.5, maxX: 10.123, minY: 0.456, maxY: 2.7 }
      };

      const pathData = (vectorizer as any).contourToLinearPath(contour);
      
      // Extract all numbers from path
      const numbers = pathData.match(/[\d.-]+/g) || [];
      
      for (const numStr of numbers) {
        const num = parseFloat(numStr);
        expect(num).not.toBeNaN();
        expect(isFinite(num)).toBe(true);
      }
    });
  });
});