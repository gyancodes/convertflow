import { describe, it, expect, beforeEach } from 'vitest';
import { AlgorithmSelector } from '../algorithmSelector';
import { VectorizationConfig } from '../../types/converter';

describe('AlgorithmSelector', () => {
  let selector: AlgorithmSelector;
  let defaultConfig: VectorizationConfig;

  beforeEach(() => {
    selector = new AlgorithmSelector();
    defaultConfig = {
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };
  });

  describe('Algorithm Detection', () => {
    it('should detect shapes algorithm for simple graphics', async () => {
      // Create simple graphic with few distinct colors (not monochromatic)
      const simpleGraphicData = new Uint8ClampedArray(256); // 8x8 image
      
      // Create a pattern with distinct colored regions (not monochromatic)
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const index = (y * 8 + x) * 4;
          
          if (x < 4 && y < 4) {
            // Red quadrant
            simpleGraphicData[index] = 255;
            simpleGraphicData[index + 1] = 0;
            simpleGraphicData[index + 2] = 0;
          } else if (x >= 4 && y < 4) {
            // Green quadrant
            simpleGraphicData[index] = 0;
            simpleGraphicData[index + 1] = 255;
            simpleGraphicData[index + 2] = 0;
          } else if (x < 4 && y >= 4) {
            // Blue quadrant
            simpleGraphicData[index] = 0;
            simpleGraphicData[index + 1] = 0;
            simpleGraphicData[index + 2] = 255;
          } else {
            // Yellow quadrant
            simpleGraphicData[index] = 255;
            simpleGraphicData[index + 1] = 255;
            simpleGraphicData[index + 2] = 0;
          }
          simpleGraphicData[index + 3] = 255; // Alpha
        }
      }
      
      const simpleImage = new ImageData(simpleGraphicData, 8, 8);
      const result = await selector.processWithAlgorithm(simpleImage, defaultConfig);
      
      expect(result.algorithmUsed).toBe('shapes');
    });

    it('should detect lineart algorithm for line drawings', async () => {
      // Create line art pattern with more complex lines to meet detection criteria
      const lineArtData = new Uint8ClampedArray(1024); // 16x16 image for better detection
      
      // Fill with white background
      for (let i = 0; i < 1024; i += 4) {
        lineArtData[i] = 255;     // White background
        lineArtData[i + 1] = 255;
        lineArtData[i + 2] = 255;
        lineArtData[i + 3] = 255;
      }
      
      // Add multiple black lines to increase edge density
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const index = (y * 16 + x) * 4;
          
          // Create cross pattern and diagonal lines
          if (x === 8 || y === 8 || x === y || x + y === 15) {
            lineArtData[index] = 0;     // Black lines
            lineArtData[index + 1] = 0;
            lineArtData[index + 2] = 0;
          }
        }
      }
      
      const lineArtImage = new ImageData(lineArtData, 16, 16);
      const result = await selector.processWithAlgorithm(lineArtImage, defaultConfig);
      
      expect(result.algorithmUsed).toBe('lineart');
    });

    it('should detect photo algorithm for complex images', async () => {
      // Create complex image with many colors and gradients
      const photoData = new Uint8ClampedArray(256); // 8x8 image
      
      // Create gradient with many colors
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const index = (y * 8 + x) * 4;
          photoData[index] = (x * 32) % 256;         // R gradient
          photoData[index + 1] = (y * 32) % 256;     // G gradient
          photoData[index + 2] = ((x + y) * 16) % 256; // B gradient
          photoData[index + 3] = 255;                // Alpha
        }
      }
      
      const photoImage = new ImageData(photoData, 8, 8);
      const result = await selector.processWithAlgorithm(photoImage, defaultConfig);
      
      expect(result.algorithmUsed).toBe('photo');
    });
  });

  describe('Manual Algorithm Selection', () => {
    it('should use shapes algorithm when explicitly specified', async () => {
      const config = { ...defaultConfig, algorithm: 'shapes' as const };
      const mockImageData = new ImageData(new Uint8ClampedArray(64), 4, 4);
      
      const result = await selector.processWithAlgorithm(mockImageData, config);
      
      expect(result.algorithmUsed).toBe('shapes');
    });

    it('should use photo algorithm when explicitly specified', async () => {
      const config = { ...defaultConfig, algorithm: 'photo' as const };
      const mockImageData = new ImageData(new Uint8ClampedArray(64), 4, 4);
      
      const result = await selector.processWithAlgorithm(mockImageData, config);
      
      expect(result.algorithmUsed).toBe('photo');
    });

    it('should use lineart algorithm when explicitly specified', async () => {
      const config = { ...defaultConfig, algorithm: 'lineart' as const };
      const mockImageData = new ImageData(new Uint8ClampedArray(64), 4, 4);
      
      const result = await selector.processWithAlgorithm(mockImageData, config);
      
      expect(result.algorithmUsed).toBe('lineart');
    });
  });

  describe('Image Analysis', () => {
    it('should analyze color characteristics correctly', () => {
      // Create image with known color properties
      const testData = new Uint8ClampedArray(64); // 4x4 image
      
      // Fill with 4 distinct colors
      for (let i = 0; i < 16; i++) {
        const pixelIndex = i * 4;
        switch (i % 4) {
          case 0: // Red
            testData[pixelIndex] = 255;
            testData[pixelIndex + 1] = 0;
            testData[pixelIndex + 2] = 0;
            break;
          case 1: // Green
            testData[pixelIndex] = 0;
            testData[pixelIndex + 1] = 255;
            testData[pixelIndex + 2] = 0;
            break;
          case 2: // Blue
            testData[pixelIndex] = 0;
            testData[pixelIndex + 1] = 0;
            testData[pixelIndex + 2] = 255;
            break;
          case 3: // Gray (monochromatic)
            testData[pixelIndex] = 128;
            testData[pixelIndex + 1] = 128;
            testData[pixelIndex + 2] = 128;
            break;
        }
        testData[pixelIndex + 3] = 255; // Alpha
      }
      
      const testImage = new ImageData(testData, 4, 4);
      const recommendations = selector.getAlgorithmRecommendations(testImage);
      
      expect(recommendations.analysis.colorCount).toBeGreaterThan(0);
      expect(typeof recommendations.analysis.monochromaticRatio).toBe('number');
      expect(recommendations.analysis.monochromaticRatio).toBeGreaterThanOrEqual(0);
      expect(recommendations.recommended).toBeOneOf(['shapes', 'photo', 'lineart']);
    });

    it('should detect transparency correctly', () => {
      // Create image with transparency
      const transparentData = new Uint8ClampedArray(64); // 4x4 image
      
      for (let i = 0; i < 64; i += 4) {
        transparentData[i] = 255;     // R
        transparentData[i + 1] = 0;   // G
        transparentData[i + 2] = 0;   // B
        transparentData[i + 3] = i < 32 ? 128 : 255; // Half transparent, half opaque
      }
      
      const transparentImage = new ImageData(transparentData, 4, 4);
      const recommendations = selector.getAlgorithmRecommendations(transparentImage);
      
      expect(recommendations.analysis.hasTransparency).toBe(true);
    });

    it('should calculate edge density correctly', () => {
      // Create image with known edge pattern
      const edgeData = new Uint8ClampedArray(256); // 8x8 image
      
      // Create checkerboard pattern for high edge density
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const index = (y * 8 + x) * 4;
          const isBlack = (x + y) % 2 === 0;
          
          edgeData[index] = isBlack ? 0 : 255;     // R
          edgeData[index + 1] = isBlack ? 0 : 255; // G
          edgeData[index + 2] = isBlack ? 0 : 255; // B
          edgeData[index + 3] = 255;               // A
        }
      }
      
      const edgeImage = new ImageData(edgeData, 8, 8);
      const recommendations = selector.getAlgorithmRecommendations(edgeImage);
      
      expect(recommendations.analysis.edgeDensity).toBeGreaterThan(0);
    });

    it('should calculate contrast level correctly', () => {
      // Create high contrast image
      const contrastData = new Uint8ClampedArray(64); // 4x4 image
      
      for (let i = 0; i < 64; i += 4) {
        const isFirstHalf = i < 32;
        contrastData[i] = isFirstHalf ? 0 : 255;     // R
        contrastData[i + 1] = isFirstHalf ? 0 : 255; // G
        contrastData[i + 2] = isFirstHalf ? 0 : 255; // B
        contrastData[i + 3] = 255;                   // A
      }
      
      const contrastImage = new ImageData(contrastData, 4, 4);
      const recommendations = selector.getAlgorithmRecommendations(contrastImage);
      
      expect(recommendations.analysis.contrastLevel).toBeCloseTo(1.0, 1);
    });
  });

  describe('Algorithm Recommendations', () => {
    it('should provide confidence scores', () => {
      const mockImageData = new ImageData(new Uint8ClampedArray(64), 4, 4);
      const recommendations = selector.getAlgorithmRecommendations(mockImageData);
      
      expect(recommendations.confidence).toBeGreaterThan(0);
      expect(recommendations.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide alternative algorithms', () => {
      const mockImageData = new ImageData(new Uint8ClampedArray(64), 4, 4);
      const recommendations = selector.getAlgorithmRecommendations(mockImageData);
      
      expect(Array.isArray(recommendations.alternatives)).toBe(true);
      expect(recommendations.alternatives.length).toBeGreaterThan(0);
      
      recommendations.alternatives.forEach(alt => {
        expect(alt).toHaveProperty('algorithm');
        expect(alt).toHaveProperty('confidence');
        expect(alt).toHaveProperty('reason');
        expect(alt.confidence).toBeGreaterThan(0);
        expect(alt.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should sort alternatives by confidence', () => {
      const mockImageData = new ImageData(new Uint8ClampedArray(64), 4, 4);
      const recommendations = selector.getAlgorithmRecommendations(mockImageData);
      
      for (let i = 1; i < recommendations.alternatives.length; i++) {
        expect(recommendations.alternatives[i - 1].confidence)
          .toBeGreaterThanOrEqual(recommendations.alternatives[i].confidence);
      }
    });

    it('should not include recommended algorithm in alternatives', () => {
      const mockImageData = new ImageData(new Uint8ClampedArray(64), 4, 4);
      const recommendations = selector.getAlgorithmRecommendations(mockImageData);
      
      const alternativeAlgorithms = recommendations.alternatives.map(alt => alt.algorithm);
      expect(alternativeAlgorithms).not.toContain(recommendations.recommended);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single color images', async () => {
      // Create single color image
      const singleColorData = new Uint8ClampedArray(64); // 4x4 image
      
      for (let i = 0; i < 64; i += 4) {
        singleColorData[i] = 128;     // Gray
        singleColorData[i + 1] = 128;
        singleColorData[i + 2] = 128;
        singleColorData[i + 3] = 255;
      }
      
      const singleColorImage = new ImageData(singleColorData, 4, 4);
      const result = await selector.processWithAlgorithm(singleColorImage, defaultConfig);
      
      expect(result.algorithmUsed).toBeOneOf(['shapes', 'photo', 'lineart']);
      expect(result.palette).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(result.paths).toBeDefined();
    });

    it('should handle very small images', async () => {
      // Create 2x2 image
      const smallImageData = new Uint8ClampedArray(16); // 2x2 * 4 channels
      
      for (let i = 0; i < 16; i += 4) {
        smallImageData[i] = 255;     // R
        smallImageData[i + 1] = 0;   // G
        smallImageData[i + 2] = 0;   // B
        smallImageData[i + 3] = 255; // A
      }
      
      const smallImage = new ImageData(smallImageData, 2, 2);
      const result = await selector.processWithAlgorithm(smallImage, defaultConfig);
      
      expect(result.algorithmUsed).toBeOneOf(['shapes', 'photo', 'lineart']);
    });

    it('should handle images with extreme aspect ratios', async () => {
      // Create 1x16 image (very wide)
      const wideImageData = new Uint8ClampedArray(64); // 1x16 * 4 channels
      
      for (let i = 0; i < 64; i += 4) {
        wideImageData[i] = (i / 4) * 16;     // Gradient
        wideImageData[i + 1] = (i / 4) * 16;
        wideImageData[i + 2] = (i / 4) * 16;
        wideImageData[i + 3] = 255;
      }
      
      const wideImage = new ImageData(wideImageData, 16, 1);
      const result = await selector.processWithAlgorithm(wideImage, defaultConfig);
      
      expect(result.algorithmUsed).toBeOneOf(['shapes', 'photo', 'lineart']);
    });
  });
});