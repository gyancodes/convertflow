import { describe, it, expect, beforeEach } from 'vitest';
import EdgeDetector from '../edgeDetector';
import { EdgeData, ContourPoint } from '../../types/vectorization';

describe('EdgeDetector', () => {
  let edgeDetector: EdgeDetector;

  beforeEach(() => {
    edgeDetector = new EdgeDetector();
  });

  describe('Sobel Edge Detection', () => {
    it('should detect edges using Sobel algorithm', async () => {
      // Create a simple test image with a vertical edge
      const width = 10;
      const height = 10;
      const imageData = createTestImageWithVerticalEdge(width, height);

      const result = await edgeDetector.detectEdgesSobel(imageData, 50);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.magnitude).toBeInstanceOf(Float32Array);
      expect(result.direction).toBeInstanceOf(Float32Array);
      expect(result.magnitude.length).toBe(width * height);
      expect(result.direction.length).toBe(width * height);

      // Check that edges are detected in the middle columns
      const middleColumn = Math.floor(width / 2);
      for (let y = 1; y < height - 1; y++) {
        const index = y * width + middleColumn;
        expect(result.magnitude[index]).toBeGreaterThan(0);
      }
    });

    it('should apply threshold correctly', async () => {
      const imageData = createTestImageWithVerticalEdge(10, 10);
      
      const lowThreshold = await edgeDetector.detectEdgesSobel(imageData, 10);
      const highThreshold = await edgeDetector.detectEdgesSobel(imageData, 200);

      // Low threshold should detect more edges
      const lowEdgeCount = Array.from(lowThreshold.magnitude).filter(val => val > 0).length;
      const highEdgeCount = Array.from(highThreshold.magnitude).filter(val => val > 0).length;

      expect(lowEdgeCount).toBeGreaterThanOrEqual(highEdgeCount);
    });

    it('should handle edge cases', async () => {
      // Test with minimal image
      const smallImage = createSolidColorImage(3, 3, 128);
      const result = await edgeDetector.detectEdgesSobel(smallImage, 50);
      
      expect(result.magnitude.length).toBe(9);
      expect(result.direction.length).toBe(9);
    });
  });

  describe('Canny Edge Detection', () => {
    it('should detect edges using Canny algorithm', async () => {
      const imageData = createTestImageWithVerticalEdge(20, 20);

      const result = await edgeDetector.detectEdgesCanny(imageData, 50, 150, 5);

      expect(result.width).toBe(20);
      expect(result.height).toBe(20);
      expect(result.magnitude).toBeInstanceOf(Float32Array);
      expect(result.direction).toBeInstanceOf(Float32Array);

      // Canny should produce cleaner edges than Sobel
      const edgeCount = Array.from(result.magnitude).filter(val => val > 0).length;
      expect(edgeCount).toBeGreaterThan(0);
    });

    it('should apply hysteresis thresholding', async () => {
      const imageData = createTestImageWithVerticalEdge(15, 15);
      
      const result = await edgeDetector.detectEdgesCanny(imageData, 30, 100, 3);
      
      // Should have connected edge pixels
      const edgePixels = [];
      for (let i = 0; i < result.magnitude.length; i++) {
        if (result.magnitude[i] > 0) {
          edgePixels.push(i);
        }
      }
      
      expect(edgePixels.length).toBeGreaterThan(0);
    });

    it('should handle different Gaussian kernel sizes', async () => {
      const imageData = createNoisyImage(15, 15);
      
      const smallKernel = await edgeDetector.detectEdgesCanny(imageData, 50, 150, 3);
      const largeKernel = await edgeDetector.detectEdgesCanny(imageData, 50, 150, 7);

      // Larger kernel should produce smoother results
      expect(smallKernel.magnitude.length).toBe(largeKernel.magnitude.length);
    });
  });

  describe('Contour Following', () => {
    it('should follow contours from edge data', () => {
      const edgeData = createSimpleEdgeData();
      
      const contours = edgeDetector.followContours(edgeData, 5);
      
      expect(Array.isArray(contours)).toBe(true);
      expect(contours.length).toBeGreaterThan(0);
      
      // Each contour should be an array of points
      contours.forEach(contour => {
        expect(Array.isArray(contour)).toBe(true);
        expect(contour.length).toBeGreaterThanOrEqual(5); // Minimum length
        
        contour.forEach(point => {
          expect(point).toHaveProperty('x');
          expect(point).toHaveProperty('y');
          expect(typeof point.x).toBe('number');
          expect(typeof point.y).toBe('number');
        });
      });
    });

    it('should filter contours by minimum length', () => {
      const edgeData = createEdgeDataWithShortContours();
      
      const shortContours = edgeDetector.followContours(edgeData, 3);
      const longContours = edgeDetector.followContours(edgeData, 10);
      
      expect(longContours.length).toBeLessThanOrEqual(shortContours.length);
    });

    it('should handle empty edge data', () => {
      const emptyEdgeData: EdgeData = {
        magnitude: new Float32Array(100),
        direction: new Float32Array(100),
        width: 10,
        height: 10
      };
      
      const contours = edgeDetector.followContours(emptyEdgeData, 5);
      expect(contours).toEqual([]);
    });
  });

  describe('Contour Simplification', () => {
    it('should simplify contours using Douglas-Peucker algorithm', () => {
      const complexContour: ContourPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0.1 },
        { x: 2, y: 0.2 },
        { x: 3, y: 0.1 },
        { x: 4, y: 0 },
        { x: 5, y: 0 }
      ];
      
      const simplified = edgeDetector.simplifyContour(complexContour, 0.5);
      
      expect(simplified.length).toBeLessThanOrEqual(complexContour.length);
      expect(simplified.length).toBeGreaterThanOrEqual(2);
      
      // First and last points should be preserved
      expect(simplified[0]).toEqual(complexContour[0]);
      expect(simplified[simplified.length - 1]).toEqual(complexContour[complexContour.length - 1]);
    });

    it('should handle different tolerance values', () => {
      const contour: ContourPoint[] = createZigzagContour();
      
      const lowTolerance = edgeDetector.simplifyContour(contour, 0.1);
      const highTolerance = edgeDetector.simplifyContour(contour, 2.0);
      
      expect(highTolerance.length).toBeLessThanOrEqual(lowTolerance.length);
    });

    it('should handle edge cases', () => {
      // Empty contour
      expect(edgeDetector.simplifyContour([], 1.0)).toEqual([]);
      
      // Single point
      const singlePoint = [{ x: 5, y: 5 }];
      expect(edgeDetector.simplifyContour(singlePoint, 1.0)).toEqual(singlePoint);
      
      // Two points
      const twoPoints = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      expect(edgeDetector.simplifyContour(twoPoints, 1.0)).toEqual(twoPoints);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate edge statistics correctly', async () => {
      const imageData = createTestImageWithVerticalEdge(10, 10);
      const edgeData = await edgeDetector.detectEdgesSobel(imageData, 50);
      
      const stats = edgeDetector.getEdgeStatistics(edgeData);
      
      expect(stats.totalEdgePixels).toBeGreaterThan(0);
      expect(stats.averageMagnitude).toBeGreaterThan(0);
      expect(stats.maxMagnitude).toBeGreaterThan(0);
      expect(stats.edgeDensity).toBeGreaterThan(0);
      expect(stats.edgeDensity).toBeLessThanOrEqual(1);
    });

    it('should convert to binary edge map', async () => {
      const imageData = createTestImageWithVerticalEdge(10, 10);
      const edgeData = await edgeDetector.detectEdgesSobel(imageData, 50);
      
      const binaryMap = edgeDetector.toBinaryEdgeMap(edgeData, 0);
      
      expect(binaryMap.width).toBe(10);
      expect(binaryMap.height).toBe(10);
      expect(binaryMap.data.length).toBe(400); // 10*10*4
      
      // Check that we have both black and white pixels
      let hasBlack = false;
      let hasWhite = false;
      
      for (let i = 0; i < binaryMap.data.length; i += 4) {
        if (binaryMap.data[i] === 0) hasBlack = true;
        if (binaryMap.data[i] === 255) hasWhite = true;
      }
      
      expect(hasBlack).toBe(true);
      expect(hasWhite).toBe(true);
    });

    it('should include algorithm metadata in results', async () => {
      const imageData = createTestImageWithVerticalEdge(10, 10);
      
      const sobelResult = await edgeDetector.detectEdgesSobel(imageData, 75);
      expect(sobelResult.algorithm).toBe('sobel');
      expect(sobelResult.parameters?.threshold).toBe(75);
      
      const cannyResult = await edgeDetector.detectEdgesCanny(imageData, 30, 100, 7);
      expect(cannyResult.algorithm).toBe('canny');
      expect(cannyResult.parameters?.lowThreshold).toBe(30);
      expect(cannyResult.parameters?.highThreshold).toBe(100);
      expect(cannyResult.parameters?.gaussianKernelSize).toBe(7);
    });
  });

  describe('Integration Tests', () => {
    it('should process different image types correctly', async () => {
      const testImages = [
        createTestImageWithVerticalEdge(20, 20),
        createTestImageWithHorizontalEdge(20, 20),
        createTestImageWithDiagonalEdge(20, 20),
        createCircularImage(20, 20)
      ];

      for (const imageData of testImages) {
        const sobelResult = await edgeDetector.detectEdgesSobel(imageData, 50);
        const cannyResult = await edgeDetector.detectEdgesCanny(imageData, 50, 150, 5);
        
        expect(sobelResult.magnitude.length).toBe(imageData.width * imageData.height);
        expect(cannyResult.magnitude.length).toBe(imageData.width * imageData.height);
        
        const sobelContours = edgeDetector.followContours(sobelResult, 5);
        const cannyContours = edgeDetector.followContours(cannyResult, 5);
        
        expect(Array.isArray(sobelContours)).toBe(true);
        expect(Array.isArray(cannyContours)).toBe(true);
      }
    });

    it('should maintain performance with larger images', async () => {
      const largeImage = createTestImageWithVerticalEdge(100, 100);
      
      const startTime = performance.now();
      const result = await edgeDetector.detectEdgesSobel(largeImage, 50);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.magnitude.length).toBe(10000);
    });
  });
});

// Helper functions for creating test images

function createTestImageWithVerticalEdge(width: number, height: number): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const color = x < width / 2 ? 0 : 255;
      
      data[index] = color;     // R
      data[index + 1] = color; // G
      data[index + 2] = color; // B
      data[index + 3] = 255;   // A
    }
  }
  
  return imageData;
}

function createTestImageWithHorizontalEdge(width: number, height: number): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const color = y < height / 2 ? 0 : 255;
      
      data[index] = color;     // R
      data[index + 1] = color; // G
      data[index + 2] = color; // B
      data[index + 3] = 255;   // A
    }
  }
  
  return imageData;
}

function createTestImageWithDiagonalEdge(width: number, height: number): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const color = x + y < width ? 0 : 255;
      
      data[index] = color;     // R
      data[index + 1] = color; // G
      data[index + 2] = color; // B
      data[index + 3] = 255;   // A
    }
  }
  
  return imageData;
}

function createCircularImage(width: number, height: number): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const color = distance < radius ? 255 : 0;
      
      data[index] = color;     // R
      data[index + 1] = color; // G
      data[index + 2] = color; // B
      data[index + 3] = 255;   // A
    }
  }
  
  return imageData;
}

function createSolidColorImage(width: number, height: number, color: number): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color;     // R
    data[i + 1] = color; // G
    data[i + 2] = color; // B
    data[i + 3] = 255;   // A
  }
  
  return imageData;
}

function createNoisyImage(width: number, height: number): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 255;
    data[i] = noise;     // R
    data[i + 1] = noise; // G
    data[i + 2] = noise; // B
    data[i + 3] = 255;   // A
  }
  
  return imageData;
}

function createSimpleEdgeData(): EdgeData {
  const width = 10;
  const height = 10;
  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);
  
  // Create a simple rectangular edge pattern
  for (let y = 2; y < 8; y++) {
    for (let x = 2; x < 8; x++) {
      if (x === 2 || x === 7 || y === 2 || y === 7) {
        const index = y * width + x;
        magnitude[index] = 100;
        direction[index] = 0;
      }
    }
  }
  
  return { magnitude, direction, width, height };
}

function createEdgeDataWithShortContours(): EdgeData {
  const width = 15;
  const height = 15;
  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);
  
  // Create several short disconnected edges
  const shortEdges = [
    [2, 2], [2, 3], [2, 4], // Short vertical line
    [5, 5], [6, 5],         // Very short horizontal line
    [10, 10], [10, 11], [10, 12], [10, 13], [10, 14] // Longer line
  ];
  
  shortEdges.forEach(([x, y]) => {
    const index = y * width + x;
    magnitude[index] = 100;
    direction[index] = 0;
  });
  
  return { magnitude, direction, width, height };
}

function createZigzagContour(): ContourPoint[] {
  const points: ContourPoint[] = [];
  
  for (let i = 0; i <= 20; i++) {
    points.push({
      x: i,
      y: i % 2 === 0 ? 0 : 1
    });
  }
  
  return points;
}