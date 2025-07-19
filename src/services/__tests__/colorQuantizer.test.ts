import { describe, it, expect, beforeEach } from 'vitest';
import ColorQuantizer from '../colorQuantizer';
import { ColorPalette } from '../../types/vectorization';

describe('ColorQuantizer', () => {
  let quantizer: ColorQuantizer;

  beforeEach(() => {
    quantizer = new ColorQuantizer();
  });

  // Helper function to create test ImageData
  const createTestImageData = (width: number, height: number, colors: Array<{r: number, g: number, b: number, a?: number}>): ImageData => {
    const imageData = new ImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const colorIndex = Math.floor((i / 4) % colors.length);
      const color = colors[colorIndex];
      
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = color.a !== undefined ? color.a : 255;
    }
    
    return imageData;
  };

  describe('quantizeKMeans', () => {
    it('should reduce colors to specified count', async () => {
      const testColors = [
        { r: 255, g: 0, b: 0 },    // Red
        { r: 0, g: 255, b: 0 },    // Green
        { r: 0, g: 0, b: 255 },    // Blue
        { r: 255, g: 255, b: 0 },  // Yellow
        { r: 255, g: 0, b: 255 },  // Magenta
        { r: 0, g: 255, b: 255 }   // Cyan
      ];
      
      const imageData = createTestImageData(10, 10, testColors);
      const result = await quantizer.quantizeKMeans(imageData, 3);
      
      expect(result.colors).toHaveLength(3);
      expect(result.weights).toHaveLength(3);
      expect(result.weights?.every(w => w > 0)).toBe(true);
    });

    it('should handle single color image', async () => {
      const singleColor = [{ r: 128, g: 128, b: 128 }];
      const imageData = createTestImageData(5, 5, singleColor);
      const result = await quantizer.quantizeKMeans(imageData, 2);
      
      expect(result.colors).toHaveLength(2);
      // At least one centroid should be close to the original color
      const hasCloseColor = result.colors.some(color => 
        Math.abs(color.r - 128) < 20 &&
        Math.abs(color.g - 128) < 20 &&
        Math.abs(color.b - 128) < 20
      );
      expect(hasCloseColor).toBe(true);
      
      // All colors should be valid RGB values
      result.colors.forEach(color => {
        expect(color.r).toBeGreaterThanOrEqual(0);
        expect(color.r).toBeLessThanOrEqual(255);
        expect(color.g).toBeGreaterThanOrEqual(0);
        expect(color.g).toBeLessThanOrEqual(255);
        expect(color.b).toBeGreaterThanOrEqual(0);
        expect(color.b).toBeLessThanOrEqual(255);
      });
    });

    it('should converge within max iterations', async () => {
      const testColors = [
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      ];
      
      const imageData = createTestImageData(8, 8, testColors);
      const startTime = performance.now();
      const result = await quantizer.quantizeKMeans(imageData, 2, 10);
      const endTime = performance.now();
      
      expect(result.colors).toHaveLength(2);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    it('should handle alpha channel correctly', async () => {
      const testColors = [
        { r: 255, g: 0, b: 0, a: 255 },
        { r: 0, g: 255, b: 0, a: 128 },
        { r: 0, g: 0, b: 255, a: 64 }
      ];
      
      const imageData = createTestImageData(6, 6, testColors);
      const result = await quantizer.quantizeKMeans(imageData, 2);
      
      expect(result.colors).toHaveLength(2);
      result.colors.forEach(color => {
        expect(color.a).toBeGreaterThanOrEqual(0);
        expect(color.a).toBeLessThanOrEqual(255);
      });
    });
  });

  describe('quantizeMedianCut', () => {
    it('should reduce colors using median cut algorithm', async () => {
      const testColors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
        { r: 255, g: 255, b: 0 }
      ];
      
      const imageData = createTestImageData(8, 8, testColors);
      const result = await quantizer.quantizeMedianCut(imageData, 4);
      
      expect(result.colors.length).toBeLessThanOrEqual(4);
      expect(result.weights).toHaveLength(result.colors.length);
      expect(result.weights?.every(w => w > 0)).toBe(true);
    });

    it('should adjust color count to nearest power of 2', async () => {
      const testColors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 }
      ];
      
      const imageData = createTestImageData(6, 6, testColors);
      const result = await quantizer.quantizeMedianCut(imageData, 5); // Should become 4
      
      expect(result.colors.length).toBeLessThanOrEqual(4);
    });

    it('should handle grayscale images', async () => {
      const grayscaleColors = [
        { r: 0, g: 0, b: 0 },
        { r: 64, g: 64, b: 64 },
        { r: 128, g: 128, b: 128 },
        { r: 192, g: 192, b: 192 },
        { r: 255, g: 255, b: 255 }
      ];
      
      const imageData = createTestImageData(10, 10, grayscaleColors);
      const result = await quantizer.quantizeMedianCut(imageData, 4);
      
      expect(result.colors.length).toBeLessThanOrEqual(4);
      // Check that colors are reasonably distributed
      const sortedColors = result.colors.sort((a, b) => a.r - b.r);
      for (let i = 1; i < sortedColors.length; i++) {
        expect(sortedColors[i].r).toBeGreaterThanOrEqual(sortedColors[i-1].r);
      }
    });
  });

  describe('extractPalette', () => {
    it('should extract unique colors with frequency', () => {
      const testColors = [
        { r: 255, g: 0, b: 0 },    // Will appear 4 times
        { r: 0, g: 255, b: 0 },    // Will appear 4 times  
        { r: 0, g: 0, b: 255 },    // Will appear 4 times
        { r: 255, g: 255, b: 0 }   // Will appear 4 times
      ];
      
      const imageData = createTestImageData(4, 4, testColors);
      const result = quantizer.extractPalette(imageData);
      
      expect(result.colors).toHaveLength(4);
      expect(result.weights).toHaveLength(4);
      expect(result.weights?.every(w => w === 4)).toBe(true); // Each color appears 4 times
    });

    it('should limit colors to maxColors parameter', () => {
      const manyColors = Array.from({ length: 20 }, (_, i) => ({
        r: i * 12,
        g: (i * 7) % 256,
        b: (i * 13) % 256
      }));
      
      const imageData = createTestImageData(20, 20, manyColors);
      const result = quantizer.extractPalette(imageData, 10);
      
      expect(result.colors.length).toBeLessThanOrEqual(10);
    });

    it('should sort colors by frequency', () => {
      // Create image where red appears more frequently
      const data = new Uint8ClampedArray(16); // 4 pixels
      // Pixel 1: Red
      data[0] = 255; data[1] = 0; data[2] = 0; data[3] = 255;
      // Pixel 2: Red  
      data[4] = 255; data[5] = 0; data[6] = 0; data[7] = 255;
      // Pixel 3: Green
      data[8] = 0; data[9] = 255; data[10] = 0; data[11] = 255;
      // Pixel 4: Red
      data[12] = 255; data[13] = 0; data[14] = 0; data[15] = 255;
      
      const imageData = new ImageData(data, 2, 2);
      const result = quantizer.extractPalette(imageData);
      
      expect(result.colors[0]).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red should be first
      expect(result.weights?.[0]).toBe(3); // Red appears 3 times
      expect(result.weights?.[1]).toBe(1); // Green appears 1 time
    });
  });

  describe('mapToQuantizedPalette', () => {
    it('should map original colors to quantized palette', () => {
      const originalColors = [
        { r: 250, g: 10, b: 10 },   // Close to red
        { r: 10, g: 250, b: 10 },   // Close to green
        { r: 10, g: 10, b: 250 }    // Close to blue
      ];
      
      const palette: ColorPalette = {
        colors: [
          { r: 255, g: 0, b: 0 },     // Pure red
          { r: 0, g: 255, b: 0 },     // Pure green  
          { r: 0, g: 0, b: 255 }      // Pure blue
        ]
      };
      
      const originalImageData = createTestImageData(3, 3, originalColors);
      const quantizedImageData = quantizer.mapToQuantizedPalette(originalImageData, palette);
      
      expect(quantizedImageData.width).toBe(3);
      expect(quantizedImageData.height).toBe(3);
      
      // Check that colors were mapped to palette colors
      const data = quantizedImageData.data;
      expect(data[0]).toBe(255); // First pixel should be pure red
      expect(data[1]).toBe(0);
      expect(data[2]).toBe(0);
    });

    it('should preserve image dimensions', () => {
      const testColors = [{ r: 128, g: 128, b: 128 }];
      const palette: ColorPalette = {
        colors: [{ r: 100, g: 100, b: 100 }]
      };
      
      const originalImageData = createTestImageData(7, 5, testColors);
      const quantizedImageData = quantizer.mapToQuantizedPalette(originalImageData, palette);
      
      expect(quantizedImageData.width).toBe(7);
      expect(quantizedImageData.height).toBe(5);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large images efficiently', async () => {
      const testColors = Array.from({ length: 50 }, (_, i) => ({
        r: (i * 5) % 256,
        g: (i * 7) % 256,
        b: (i * 11) % 256
      }));
      
      const imageData = createTestImageData(100, 100, testColors); // 10,000 pixels
      
      const startTime = performance.now();
      const result = await quantizer.quantizeKMeans(imageData, 8);
      const endTime = performance.now();
      
      expect(result.colors).toHaveLength(8);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should complete with different iteration counts', async () => {
      const testColors = Array.from({ length: 10 }, (_, i) => ({
        r: (i * 25) % 256,
        g: (i * 30) % 256,
        b: (i * 35) % 256
      }));
      
      const imageData = createTestImageData(20, 20, testColors);
      
      // Test that both complete successfully
      const result1 = await quantizer.quantizeKMeans(imageData, 4, 3);
      const result2 = await quantizer.quantizeKMeans(imageData, 4, 10);
      
      expect(result1.colors).toHaveLength(4);
      expect(result2.colors).toHaveLength(4);
      expect(result1.weights?.every(w => w > 0)).toBe(true);
      expect(result2.weights?.every(w => w > 0)).toBe(true);
    });
  });

  describe('Accuracy Tests', () => {
    it('should preserve dominant colors in k-means', async () => {
      // Create image with clear dominant colors
      const dominantRed = Array(60).fill({ r: 255, g: 0, b: 0 });
      const minorBlue = Array(4).fill({ r: 0, g: 0, b: 255 });
      const testColors = [...dominantRed, ...minorBlue];
      
      const imageData = createTestImageData(8, 8, testColors);
      const result = await quantizer.quantizeKMeans(imageData, 2);
      
      // One of the colors should be close to red
      const hasRedish = result.colors.some(color => 
        color.r > 200 && color.g < 50 && color.b < 50
      );
      expect(hasRedish).toBe(true);
    });

    it('should maintain color relationships in median cut', async () => {
      const testColors = [
        { r: 255, g: 0, b: 0 },     // Red corner
        { r: 0, g: 255, b: 0 },     // Green corner
        { r: 0, g: 0, b: 255 },     // Blue corner
        { r: 128, g: 128, b: 128 }  // Gray center
      ];
      
      const imageData = createTestImageData(8, 8, testColors);
      const result = await quantizer.quantizeMedianCut(imageData, 4);
      
      // Should have colors spanning the color space
      const minR = Math.min(...result.colors.map(c => c.r));
      const maxR = Math.max(...result.colors.map(c => c.r));
      const minG = Math.min(...result.colors.map(c => c.g));
      const maxG = Math.max(...result.colors.map(c => c.g));
      const minB = Math.min(...result.colors.map(c => c.b));
      const maxB = Math.max(...result.colors.map(c => c.b));
      
      expect(maxR - minR).toBeGreaterThan(100); // Good red range
      expect(maxG - minG).toBeGreaterThan(100); // Good green range  
      expect(maxB - minB).toBeGreaterThan(100); // Good blue range
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or minimal images', async () => {
      const imageData = new ImageData(1, 1);
      imageData.data[0] = 128;
      imageData.data[1] = 128;
      imageData.data[2] = 128;
      imageData.data[3] = 255;
      
      const result = await quantizer.quantizeKMeans(imageData, 2);
      expect(result.colors).toHaveLength(2);
    });

    it('should handle transparent pixels', () => {
      const testColors = [
        { r: 255, g: 0, b: 0, a: 255 },
        { r: 0, g: 255, b: 0, a: 0 },    // Transparent
        { r: 0, g: 0, b: 255, a: 128 }   // Semi-transparent
      ];
      
      const imageData = createTestImageData(3, 3, testColors);
      const result = quantizer.extractPalette(imageData);
      
      expect(result.colors).toHaveLength(3);
      
      // Check that we have the expected alpha values
      const alphaValues = result.colors.map(c => c.a).sort();
      expect(alphaValues).toContain(0);
      expect(alphaValues).toContain(128);
      expect(alphaValues).toContain(255);
    });

    it('should handle requesting more colors than available', async () => {
      const testColors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 }
      ];
      
      const imageData = createTestImageData(4, 4, testColors);
      const result = await quantizer.quantizeKMeans(imageData, 10);
      
      expect(result.colors).toHaveLength(10); // Should still return requested count
    });
  });
});