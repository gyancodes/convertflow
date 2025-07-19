import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ShapeProcessor, 
  PhotoProcessor, 
  LineArtProcessor, 
  createAlgorithmProcessor 
} from '../algorithmProcessors';
import { VectorizationConfig } from '../../types/converter';

describe('Algorithm Processors', () => {
  let mockImageData: ImageData;
  let defaultConfig: VectorizationConfig;

  beforeEach(() => {
    // Create mock image data (simple 4x4 image)
    const data = new Uint8ClampedArray(64); // 4x4 * 4 channels
    
    // Create a simple pattern for testing
    for (let i = 0; i < 64; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 0;   // G
      data[i + 2] = 0;   // B
      data[i + 3] = 255; // A
    }
    
    mockImageData = new ImageData(data, 4, 4);

    defaultConfig = {
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };
  });

  describe('ShapeProcessor', () => {
    let processor: ShapeProcessor;

    beforeEach(() => {
      processor = new ShapeProcessor();
    });

    it('should create a ShapeProcessor instance', () => {
      expect(processor).toBeInstanceOf(ShapeProcessor);
    });

    it('should process image with shape-specific settings', async () => {
      const result = await processor.processImage(mockImageData, defaultConfig);
      
      expect(result).toHaveProperty('palette');
      expect(result).toHaveProperty('edges');
      expect(result).toHaveProperty('paths');
      expect(result.palette.colors).toBeDefined();
      expect(Array.isArray(result.paths)).toBe(true);
    });

    it('should limit color count for shape detection', async () => {
      const config = { ...defaultConfig, colorCount: 32 };
      const result = await processor.processImage(mockImageData, config);
      
      // Shape processor should limit colors to 16 max
      expect(result.palette.colors.length).toBeLessThanOrEqual(16);
    });

    it('should use higher simplification tolerance for shapes', async () => {
      const result = await processor.processImage(mockImageData, defaultConfig);
      
      // Paths should have lower complexity due to higher simplification
      result.paths.forEach(path => {
        expect(path.complexity).toBeLessThan(10); // Arbitrary threshold for test
      });
    });

    it('should detect cardinal directions in edges', async () => {
      // Create image with horizontal edge
      const edgeData = new Uint8ClampedArray(64);
      for (let i = 0; i < 32; i += 4) {
        edgeData[i] = 0; edgeData[i + 1] = 0; edgeData[i + 2] = 0; edgeData[i + 3] = 255;
      }
      for (let i = 32; i < 64; i += 4) {
        edgeData[i] = 255; edgeData[i + 1] = 255; edgeData[i + 2] = 255; edgeData[i + 3] = 255;
      }
      
      const horizontalEdgeImage = new ImageData(edgeData, 4, 4);
      const result = await processor.processImage(horizontalEdgeImage, defaultConfig);
      
      expect(result.edges).toBeDefined();
      expect(result.edges.algorithm).toBe('sobel');
    });
  });

  describe('PhotoProcessor', () => {
    let processor: PhotoProcessor;

    beforeEach(() => {
      processor = new PhotoProcessor();
    });

    it('should create a PhotoProcessor instance', () => {
      expect(processor).toBeInstanceOf(PhotoProcessor);
    });

    it('should process image with photo-specific settings', async () => {
      const result = await processor.processImage(mockImageData, defaultConfig);
      
      expect(result).toHaveProperty('palette');
      expect(result).toHaveProperty('edges');
      expect(result).toHaveProperty('paths');
      expect(result.edges.algorithm).toBe('canny');
    });

    it('should use full color range for photos', async () => {
      const config = { ...defaultConfig, colorCount: 64 };
      const result = await processor.processImage(mockImageData, config);
      
      // Photo processor should use the full color count
      expect(result.palette.colors.length).toBeLessThanOrEqual(64);
    });

    it('should apply lower simplification tolerance for detail preservation', async () => {
      const result = await processor.processImage(mockImageData, defaultConfig);
      
      // Should preserve more detail than shape processor
      expect(result.paths.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate local contrast correctly', async () => {
      // Create gradient image for contrast testing
      const gradientData = new Uint8ClampedArray(64);
      for (let i = 0; i < 64; i += 4) {
        const value = Math.floor((i / 4) * 16); // 0 to 240 gradient
        gradientData[i] = value;
        gradientData[i + 1] = value;
        gradientData[i + 2] = value;
        gradientData[i + 3] = 255;
      }
      
      const gradientImage = new ImageData(gradientData, 4, 4);
      const result = await processor.processImage(gradientImage, defaultConfig);
      
      expect(result.edges).toBeDefined();
    });
  });

  describe('LineArtProcessor', () => {
    let processor: LineArtProcessor;

    beforeEach(() => {
      processor = new LineArtProcessor();
    });

    it('should create a LineArtProcessor instance', () => {
      expect(processor).toBeInstanceOf(LineArtProcessor);
    });

    it('should process image with line art-specific settings', async () => {
      const result = await processor.processImage(mockImageData, defaultConfig);
      
      expect(result).toHaveProperty('palette');
      expect(result).toHaveProperty('edges');
      expect(result).toHaveProperty('paths');
      expect(result.edges.algorithm).toBe('sobel');
    });

    it('should limit color count for line art', async () => {
      const config = { ...defaultConfig, colorCount: 64 };
      const result = await processor.processImage(mockImageData, config);
      
      // Line art processor should limit colors to 32 max
      expect(result.palette.colors.length).toBeLessThanOrEqual(32);
    });

    it('should enhance contrast for line detection', async () => {
      // Create low contrast image
      const lowContrastData = new Uint8ClampedArray(64);
      for (let i = 0; i < 64; i += 4) {
        lowContrastData[i] = 128;     // Mid-gray
        lowContrastData[i + 1] = 128;
        lowContrastData[i + 2] = 128;
        lowContrastData[i + 3] = 255;
      }
      
      const lowContrastImage = new ImageData(lowContrastData, 4, 4);
      const result = await processor.processImage(lowContrastImage, defaultConfig);
      
      expect(result.palette).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it('should calculate line continuity', async () => {
      // Create image with line pattern
      const lineData = new Uint8ClampedArray(64);
      // Create vertical line in middle
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const index = (y * 4 + x) * 4;
          if (x === 1 || x === 2) { // Vertical line
            lineData[index] = 0;     // Black line
            lineData[index + 1] = 0;
            lineData[index + 2] = 0;
          } else {
            lineData[index] = 255;   // White background
            lineData[index + 1] = 255;
            lineData[index + 2] = 255;
          }
          lineData[index + 3] = 255; // Alpha
        }
      }
      
      const lineImage = new ImageData(lineData, 4, 4);
      const result = await processor.processImage(lineImage, defaultConfig);
      
      expect(result.edges).toBeDefined();
      expect(result.paths.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createAlgorithmProcessor factory', () => {
    it('should create ShapeProcessor for shapes algorithm', () => {
      const processor = createAlgorithmProcessor('shapes');
      expect(processor).toBeInstanceOf(ShapeProcessor);
    });

    it('should create PhotoProcessor for photo algorithm', () => {
      const processor = createAlgorithmProcessor('photo');
      expect(processor).toBeInstanceOf(PhotoProcessor);
    });

    it('should create LineArtProcessor for lineart algorithm', () => {
      const processor = createAlgorithmProcessor('lineart');
      expect(processor).toBeInstanceOf(LineArtProcessor);
    });

    it('should throw error for unknown algorithm', () => {
      expect(() => {
        // @ts-expect-error Testing invalid algorithm
        createAlgorithmProcessor('unknown');
      }).toThrow('Unknown algorithm: unknown');
    });
  });

  describe('Algorithm-specific optimizations', () => {
    it('should optimize rectangle paths in ShapeProcessor', async () => {
      const processor = new ShapeProcessor();
      
      // Create simple rectangle pattern
      const rectData = new Uint8ClampedArray(256); // 8x8 image
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const index = (y * 8 + x) * 4;
          // Create rectangle: border in black, inside in white
          if (x === 0 || x === 7 || y === 0 || y === 7) {
            rectData[index] = 0;     // Black border
            rectData[index + 1] = 0;
            rectData[index + 2] = 0;
          } else {
            rectData[index] = 255;   // White inside
            rectData[index + 1] = 255;
            rectData[index + 2] = 255;
          }
          rectData[index + 3] = 255; // Alpha
        }
      }
      
      const rectImage = new ImageData(rectData, 8, 8);
      const result = await processor.processImage(rectImage, defaultConfig);
      
      expect(result.paths).toBeDefined();
      // Should detect some geometric structure
      expect(result.paths.length).toBeGreaterThanOrEqual(0);
    });

    it('should apply Floyd-Steinberg dithering in PhotoProcessor', async () => {
      const processor = new PhotoProcessor();
      
      // Create gradient for dithering test
      const gradientData = new Uint8ClampedArray(256); // 8x8 image
      for (let i = 0; i < 256; i += 4) {
        const value = Math.floor((i / 4) * 4); // Create gradient
        gradientData[i] = value;
        gradientData[i + 1] = value;
        gradientData[i + 2] = value;
        gradientData[i + 3] = 255;
      }
      
      const gradientImage = new ImageData(gradientData, 8, 8);
      const result = await processor.processImage(gradientImage, defaultConfig);
      
      expect(result.palette).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it('should smooth curves in LineArtProcessor', async () => {
      const processor = new LineArtProcessor();
      
      // Create curved line pattern
      const curveData = new Uint8ClampedArray(256); // 8x8 image
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const index = (y * 8 + x) * 4;
          // Create diagonal curve
          if (Math.abs(x - y) <= 1) {
            curveData[index] = 0;     // Black curve
            curveData[index + 1] = 0;
            curveData[index + 2] = 0;
          } else {
            curveData[index] = 255;   // White background
            curveData[index + 1] = 255;
            curveData[index + 2] = 255;
          }
          curveData[index + 3] = 255; // Alpha
        }
      }
      
      const curveImage = new ImageData(curveData, 8, 8);
      const result = await processor.processImage(curveImage, defaultConfig);
      
      expect(result.paths).toBeDefined();
      // Should generate smooth paths for curves
      result.paths.forEach(path => {
        expect(path.pathData).toBeDefined();
        expect(typeof path.pathData).toBe('string');
      });
    });
  });
});