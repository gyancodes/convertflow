import { describe, it, expect, beforeEach } from 'vitest';
import { SvgGenerator } from '../svgGenerator';
import { VectorPath, ColorPalette } from '../../types/vectorization';

describe('SvgGenerator', () => {
  let generator: SvgGenerator;
  let mockPaths: VectorPath[];
  let mockPalette: ColorPalette;

  beforeEach(() => {
    generator = new SvgGenerator();
    
    mockPaths = [
      {
        pathData: 'M 10 10 L 20 10 L 20 20 L 10 20 Z',
        fillColor: '#ff0000',
        complexity: 5
      },
      {
        pathData: 'M 30 30 L 40 30 L 40 40 L 30 40 Z',
        fillColor: '#00ff00',
        complexity: 5
      },
      {
        pathData: 'M 50 50 C 60 50 60 60 50 60 Z',
        fillColor: '#ff0000',
        strokeColor: '#000000',
        strokeWidth: 2,
        complexity: 4
      }
    ];

    mockPalette = {
      colors: [
        { r: 255, g: 0, b: 0, a: 255 },
        { r: 0, g: 255, b: 0, a: 255 },
        { r: 0, g: 0, b: 255, a: 255 }
      ],
      weights: [100, 80, 60]
    };
  });

  describe('generateSVG', () => {
    it('should generate valid SVG markup', async () => {
      const result = await generator.generateSVG(mockPaths, 100, 100, mockPalette);

      expect(result.svgContent).toContain('<?xml version="1.0"');
      expect(result.svgContent).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.svgContent).toContain('width="100"');
      expect(result.svgContent).toContain('height="100"');
      expect(result.svgContent).toContain('viewBox="0 0 100 100"');
      expect(result.svgContent).toContain('</svg>');
    });

    it('should include all paths in the output', async () => {
      const result = await generator.generateSVG(mockPaths, 100, 100);

      expect(result.svgContent).toContain('M 10 10 L 20 10 L 20 20 L 10 20 Z');
      expect(result.svgContent).toContain('M 30 30 L 40 30 L 40 40 L 30 40 Z');
      expect(result.svgContent).toContain('M 50 50 C 60 50 60 60 50 60 Z');
    });

    it('should group paths by color', async () => {
      const result = await generator.generateSVG(mockPaths, 100, 100);

      // Should have groups for red and green colors
      expect(result.svgContent).toContain('fill="#ff0000"');
      expect(result.svgContent).toContain('fill="#00ff00"');
      
      // Red group should contain both red paths
      const redGroupMatch = result.svgContent.match(/<g[^>]*fill="#ff0000"[^>]*>(.*?)<\/g>/s);
      expect(redGroupMatch).toBeTruthy();
      if (redGroupMatch) {
        expect(redGroupMatch[1]).toContain('M 10 10 L 20 10 L 20 20 L 10 20 Z');
        expect(redGroupMatch[1]).toContain('M 50 50 C 60 50 60 60 50 60 Z');
      }
    });

    it('should include stroke properties when present', async () => {
      const result = await generator.generateSVG(mockPaths, 100, 100);

      expect(result.svgContent).toContain('stroke="#000000"');
      expect(result.svgContent).toContain('stroke-width="2"');
    });

    it('should return processing statistics', async () => {
      const result = await generator.generateSVG(mockPaths, 100, 100);

      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.vectorSize).toBeGreaterThan(0);
      expect(result.colorCount).toBe(2); // Red and green
      expect(result.pathCount).toBe(3);
    });
  });

  describe('path optimization', () => {
    it('should remove redundant points', () => {
      const pathWithRedundancy = {
        pathData: 'M 10 10 L 10 10 L 20 10 L 20 10 L 20 20 Z',
        fillColor: '#ff0000',
        complexity: 6
      };

      const optimizedGenerator = new SvgGenerator({ removeRedundantPoints: true });
      const result = optimizedGenerator['removeRedundantPoints'](pathWithRedundancy);

      // Should remove redundant points
      expect(result.pathData).not.toContain('L 10 10');
      expect(result.pathData).not.toContain('L 20 10 L 20 10');
    });

    it('should merge compatible paths', () => {
      const compatiblePaths = [
        {
          pathData: 'M 10 10 L 20 10 Z',
          fillColor: '#ff0000',
          complexity: 3
        },
        {
          pathData: 'M 30 30 L 40 30 Z',
          fillColor: '#ff0000',
          complexity: 3
        }
      ];

      const merged = generator['mergeCompatiblePaths'](compatiblePaths);

      expect(merged).toHaveLength(1);
      expect(merged[0].pathData).toContain('M 10 10 L 20 10 Z');
      expect(merged[0].pathData).toContain('M 30 30 L 40 30 Z');
      expect(merged[0].fillColor).toBe('#ff0000');
    });

    it('should round coordinates to specified precision', () => {
      const preciseGenerator = new SvgGenerator({ precision: 1 });
      const pathData = 'M 10.123456 10.987654 L 20.555555 30.111111';
      
      const rounded = preciseGenerator['roundCoordinates'](pathData);
      
      expect(rounded).toBe('M 10.1 11 L 20.6 30.1');
    });
  });

  describe('SVG validation', () => {
    it('should validate correct SVG content', () => {
      const validSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <path d="M 10 10 L 20 20 Z" fill="#ff0000"/>
</svg>`;

      const validation = generator.validateSVG(validSVG);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing SVG elements', () => {
      const invalidSVG = '<div>Not an SVG</div>';
      
      const validation = generator.validateSVG(invalidSVG);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing SVG root element');
      expect(validation.errors).toContain('Missing SVG namespace declaration');
      expect(validation.errors).toContain('Missing SVG closing tag');
    });

    it('should detect invalid path data', () => {
      const invalidSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <path d="INVALID_PATH_DATA" fill="#ff0000"/>
</svg>`;

      const validation = generator.validateSVG(invalidSVG);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Invalid path data'))).toBe(true);
    });
  });

  describe('optimization statistics', () => {
    it('should calculate optimization statistics', () => {
      const originalPaths = [
        { pathData: 'M 0 0 L 10 10 L 10 10 L 20 20 Z', fillColor: '#ff0000', complexity: 10 },
        { pathData: 'M 30 30 L 40 40 Z', fillColor: '#ff0000', complexity: 5 },
        { pathData: 'M 50 50 L 60 60 Z', fillColor: '#00ff00', complexity: 5 }
      ];

      const optimizedPaths = [
        { pathData: 'M 0 0 L 10 10 L 20 20 Z M 30 30 L 40 40 Z', fillColor: '#ff0000', complexity: 12 },
        { pathData: 'M 50 50 L 60 60 Z', fillColor: '#00ff00', complexity: 5 }
      ];

      const stats = generator.getOptimizationStats(originalPaths, optimizedPaths);

      expect(stats.pathReduction).toBeGreaterThan(0);
      expect(stats.complexityReduction).toBeGreaterThan(0);
      expect(stats.estimatedSizeReduction).toBeGreaterThan(0);
    });
  });

  describe('path parsing and optimization', () => {
    it('should parse path data correctly', () => {
      const pathData = 'M 10 20 L 30 40 C 50 60 70 80 90 100 Z';
      const commands = generator['parsePathData'](pathData);

      expect(commands).toHaveLength(4);
      expect(commands[0]).toEqual({ command: 'M', coordinates: [10, 20] });
      expect(commands[1]).toEqual({ command: 'L', coordinates: [30, 40] });
      expect(commands[2]).toEqual({ command: 'C', coordinates: [50, 60, 70, 80, 90, 100] });
      expect(commands[3]).toEqual({ command: 'Z', coordinates: [] });
    });

    it('should remove redundant commands', () => {
      const commands = [
        { command: 'M', coordinates: [10, 10] },
        { command: 'M', coordinates: [10, 10] }, // Redundant move
        { command: 'L', coordinates: [10, 10] }, // Zero-length line
        { command: 'L', coordinates: [20, 20] },
        { command: 'Z', coordinates: [] }
      ];

      const optimized = generator['removeRedundantCommands'](commands);

      expect(optimized).toHaveLength(3);
      expect(optimized[0]).toEqual({ command: 'M', coordinates: [10, 10] });
      expect(optimized[1]).toEqual({ command: 'L', coordinates: [20, 20] });
      expect(optimized[2]).toEqual({ command: 'Z', coordinates: [] });
    });

    it('should convert commands back to path data', () => {
      const commands = [
        { command: 'M', coordinates: [10, 20] },
        { command: 'L', coordinates: [30, 40] },
        { command: 'Z', coordinates: [] }
      ];

      const pathData = generator['commandsToPathData'](commands);

      expect(pathData).toBe('M 10 20 L 30 40 Z');
    });
  });

  describe('color grouping', () => {
    it('should group paths by color correctly', () => {
      const groups = generator['groupPathsByColor'](mockPaths);

      expect(groups.size).toBe(2);
      expect(groups.get('#ff0000')).toHaveLength(2);
      expect(groups.get('#00ff00')).toHaveLength(1);
    });

    it('should create color groups in SVG', () => {
      const redPaths = [mockPaths[0], mockPaths[2]];
      const groupContent = generator['createColorGroup']('#ff0000', redPaths);

      expect(groupContent).toContain('<g id="color-ff0000" fill="#ff0000">');
      expect(groupContent).toContain('</g>');
      expect(groupContent).toContain('<path id="color-ff0000-0"');
      expect(groupContent).toContain('<path id="color-ff0000-1"');
    });
  });

  describe('configuration options', () => {
    it('should respect optimization settings', async () => {
      const noOptimizationGenerator = new SvgGenerator({
        enableOptimization: false,
        groupByColor: false
      });

      const result = await noOptimizationGenerator.generateSVG(mockPaths, 100, 100);

      // Without grouping, should have individual paths
      expect(result.svgContent).not.toContain('<g id="color-');
    });

    it('should use custom precision settings', () => {
      const highPrecisionGenerator = new SvgGenerator({ precision: 4 });
      const pathData = 'M 10.123456789 20.987654321';
      
      const rounded = highPrecisionGenerator['roundCoordinates'](pathData);
      
      expect(rounded).toBe('M 10.1235 20.9877');
    });
  });
});

  describe('file size optimization', () => {
    it('should reduce file size through optimization', async () => {
      const complexPaths: VectorPath[] = [
        {
          pathData: 'M 10.123456789 10.987654321 L 20.111111111 10.987654321 L 20.111111111 20.555555555 L 10.123456789 20.555555555 Z',
          fillColor: '#ff0000',
          complexity: 8
        },
        {
          pathData: 'M 30.999999999 30.000000001 L 40.000000001 30.000000001 L 40.000000001 40.999999999 L 30.999999999 40.999999999 Z',
          fillColor: '#ff0000',
          complexity: 8
        }
      ];

      const optimizedGenerator = new SvgGenerator({
        enableOptimization: true,
        removeRedundantPoints: true,
        mergePaths: true,
        precision: 1
      });

      const unoptimizedGenerator = new SvgGenerator({
        enableOptimization: false,
        precision: 6
      });

      const optimizedResult = await optimizedGenerator.generateSVG(complexPaths, 100, 100);
      const unoptimizedResult = await unoptimizedGenerator.generateSVG(complexPaths, 100, 100);

      expect(optimizedResult.vectorSize).toBeLessThan(unoptimizedResult.vectorSize);
      expect(optimizedResult.pathCount).toBeLessThanOrEqual(unoptimizedResult.pathCount);
    });

    it('should handle empty path arrays gracefully', async () => {
      const testGenerator = new SvgGenerator();
      const result = await testGenerator.generateSVG([], 100, 100);

      expect(result.svgContent).toContain('<svg');
      expect(result.svgContent).toContain('</svg>');
      expect(result.pathCount).toBe(0);
      expect(result.colorCount).toBe(0);
    });

    it('should handle paths with transparency', async () => {
      const testGenerator = new SvgGenerator();
      const transparentPaths: VectorPath[] = [
        {
          pathData: 'M 10 10 L 20 20 Z',
          fillColor: 'rgba(255, 0, 0, 0.5)',
          complexity: 3
        }
      ];

      const result = await testGenerator.generateSVG(transparentPaths, 100, 100);

      expect(result.svgContent).toContain('rgba(255, 0, 0, 0.5)');
    });
  });

  describe('edge cases', () => {
    it('should handle very small images', async () => {
      const testGenerator = new SvgGenerator();
      const testPaths: VectorPath[] = [
        {
          pathData: 'M 0 0 L 1 1 Z',
          fillColor: '#ff0000',
          complexity: 3
        }
      ];
      const result = await testGenerator.generateSVG(testPaths, 1, 1);

      expect(result.svgContent).toContain('width="1"');
      expect(result.svgContent).toContain('height="1"');
      expect(result.svgContent).toContain('viewBox="0 0 1 1"');
    });

    it('should handle very large images', async () => {
      const testGenerator = new SvgGenerator();
      const testPaths: VectorPath[] = [
        {
          pathData: 'M 0 0 L 5000 5000 Z',
          fillColor: '#ff0000',
          complexity: 3
        }
      ];
      const result = await testGenerator.generateSVG(testPaths, 10000, 10000);

      expect(result.svgContent).toContain('width="10000"');
      expect(result.svgContent).toContain('height="10000"');
      expect(result.originalSize).toBeGreaterThan(400000000); // ~400MB for 10k x 10k RGBA
    });

    it('should handle paths with no coordinates', async () => {
      const testGenerator = new SvgGenerator();
      const emptyPaths: VectorPath[] = [
        {
          pathData: '',
          fillColor: '#ff0000',
          complexity: 0
        }
      ];

      const result = await testGenerator.generateSVG(emptyPaths, 100, 100);

      expect(result.svgContent).toContain('<svg');
      expect(result.pathCount).toBe(1);
    });

    it('should handle malformed path data gracefully', async () => {
      const testGenerator = new SvgGenerator();
      const malformedPaths: VectorPath[] = [
        {
          pathData: 'INVALID PATH DATA',
          fillColor: '#ff0000',
          complexity: 1
        }
      ];

      const result = await testGenerator.generateSVG(malformedPaths, 100, 100);
      const validation = testGenerator.validateSVG(result.svgContent);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Invalid path data'))).toBe(true);
    });
  });