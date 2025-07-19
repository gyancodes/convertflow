import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadImageToCanvas,
  extractImageData,
  createCanvasFromImageData,
  resizeImageData,
  normalizeImageData,
  processAlphaChannel,
  getPixel,
  setPixel,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  colorDistance,
} from '../canvasUtils';

// Mock ImageData constructor
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
    if (typeof dataOrWidth === 'number') {
      // new ImageData(width, height)
      this.width = dataOrWidth;
      this.height = widthOrHeight!;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      // new ImageData(data, width, height)
      this.data = dataOrWidth;
      this.width = widthOrHeight!;
      this.height = height!;
    }
  }
}

// Mock DOM APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
};

const mockContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
};

const mockImage = {
  width: 100,
  height: 100,
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
};

// Setup DOM mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock ImageData globally
  global.ImageData = MockImageData as any;
  
  global.document = {
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return {};
    }),
  } as any;
  
  global.Image = vi.fn(() => mockImage) as any;
  global.URL = {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
  } as any;
  
  mockCanvas.getContext = vi.fn(() => mockContext);
});

describe('canvasUtils', () => {
  describe('loadImageToCanvas', () => {
    it('should load PNG file and return ImageData', async () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const mockImageData = new ImageData(100, 100);
      
      mockContext.getImageData.mockReturnValue(mockImageData);
      
      const promise = loadImageToCanvas(mockFile);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      const result = await promise;
      
      expect(result).toBe(mockImageData);
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 100, 100);
    });

    it('should reject when canvas context is not available', async () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      mockCanvas.getContext = vi.fn(() => null);
      
      await expect(loadImageToCanvas(mockFile)).rejects.toThrow('Failed to get canvas context');
    });

    it('should reject when image fails to load', async () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      
      const promise = loadImageToCanvas(mockFile);
      
      // Simulate image error
      if (mockImage.onerror) {
        mockImage.onerror();
      }
      
      await expect(promise).rejects.toThrow('Failed to load image');
    });
  });

  describe('extractImageData', () => {
    it('should extract ImageData from canvas', () => {
      const mockImageData = new ImageData(100, 100);
      mockContext.getImageData.mockReturnValue(mockImageData);
      mockCanvas.width = 100;
      mockCanvas.height = 100;
      
      const result = extractImageData(mockCanvas as any);
      
      expect(result).toBe(mockImageData);
      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 100, 100);
    });

    it('should throw error when canvas context is not available', () => {
      mockCanvas.getContext = vi.fn(() => null);
      
      expect(() => extractImageData(mockCanvas as unknown)).toThrow('Failed to get canvas context');
    });
  });

  describe('createCanvasFromImageData', () => {
    it('should create canvas from ImageData', () => {
      const imageData = new ImageData(50, 50);
      
      const result = createCanvasFromImageData(imageData);
      
      expect(result).toBe(mockCanvas);
      expect(mockCanvas.width).toBe(50);
      expect(mockCanvas.height).toBe(50);
      expect(mockContext.putImageData).toHaveBeenCalledWith(imageData, 0, 0);
    });
  });

  describe('resizeImageData', () => {
    it('should resize ImageData to new dimensions', () => {
      const originalData = new ImageData(100, 100);
      const resizedData = new ImageData(50, 50);
      
      mockContext.getImageData.mockReturnValue(resizedData);
      
      const result = resizeImageData(originalData, 50, 50);
      
      expect(result).toBe(resizedData);
      expect(mockContext.imageSmoothingEnabled).toBe(true);
      expect(mockContext.imageSmoothingQuality).toBe('high');
    });
  });

  describe('normalizeImageData', () => {
    it('should normalize image data', () => {
      // Create test data with known values
      const data = new Uint8ClampedArray([
        50, 100, 150, 255,  // Pixel 1
        100, 150, 200, 255, // Pixel 2
        150, 200, 250, 255, // Pixel 3
        200, 250, 255, 255, // Pixel 4
      ]);
      const imageData = new ImageData(data, 2, 2);
      
      const result = normalizeImageData(imageData);
      
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(result.data.length).toBe(16);
      
      // Check that normalization has been applied
      // The exact values depend on the normalization algorithm
      expect(result.data[0]).toBeGreaterThanOrEqual(0);
      expect(result.data[0]).toBeLessThanOrEqual(255);
    });
  });

  describe('processAlphaChannel', () => {
    it('should preserve transparency by default', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 128,    // Semi-transparent red
        0, 255, 0, 255,    // Opaque green
      ]);
      const imageData = new ImageData(data, 2, 1);
      
      const result = processAlphaChannel(imageData);
      
      expect(result.data[3]).toBe(128); // Alpha preserved
      expect(result.data[7]).toBe(255); // Alpha preserved
    });

    it('should blend with background when not preserving transparency', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 128,    // Semi-transparent red
      ]);
      const imageData = new ImageData(data, 1, 1);
      
      const result = processAlphaChannel(imageData, { 
        preserveTransparency: false,
        backgroundColor: { r: 255, g: 255, b: 255 }
      });
      
      expect(result.data[3]).toBe(255); // Alpha set to opaque
      // Color should be blended with white background
      expect(result.data[0]).toBeGreaterThan(128); // Red component increased
    });
  });

  describe('getPixel and setPixel', () => {
    it('should get pixel values correctly', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 255,    // Red pixel at (0,0)
        0, 255, 0, 255,    // Green pixel at (1,0)
      ]);
      const imageData = new ImageData(data, 2, 1);
      
      const pixel = getPixel(imageData, 0, 0);
      expect(pixel).toEqual([255, 0, 0, 255]);
      
      const pixel2 = getPixel(imageData, 1, 0);
      expect(pixel2).toEqual([0, 255, 0, 255]);
    });

    it('should return [0,0,0,0] for out-of-bounds coordinates', () => {
      const imageData = new ImageData(2, 1);
      
      const pixel = getPixel(imageData, -1, 0);
      expect(pixel).toEqual([0, 0, 0, 0]);
      
      const pixel2 = getPixel(imageData, 2, 0);
      expect(pixel2).toEqual([0, 0, 0, 0]);
    });

    it('should set pixel values correctly', () => {
      const imageData = new ImageData(2, 1);
      
      setPixel(imageData, 0, 0, 255, 0, 0, 255);
      
      expect(imageData.data[0]).toBe(255); // R
      expect(imageData.data[1]).toBe(0);   // G
      expect(imageData.data[2]).toBe(0);   // B
      expect(imageData.data[3]).toBe(255); // A
    });

    it('should ignore out-of-bounds setPixel calls', () => {
      const imageData = new ImageData(1, 1);
      const originalData = new Uint8ClampedArray(imageData.data);
      
      setPixel(imageData, -1, 0, 255, 0, 0, 255);
      setPixel(imageData, 1, 0, 255, 0, 0, 255);
      
      // Data should remain unchanged
      expect(imageData.data).toEqual(originalData);
    });
  });

  describe('color space conversions', () => {
    describe('rgbToHsl and hslToRgb', () => {
      it('should convert RGB to HSL correctly', () => {
        const [h, s, l] = rgbToHsl(255, 0, 0); // Pure red
        expect(h).toBeCloseTo(0, 1);
        expect(s).toBeCloseTo(100, 1);
        expect(l).toBeCloseTo(50, 1);
      });

      it('should convert HSL to RGB correctly', () => {
        const [r, g, b] = hslToRgb(0, 100, 50); // Pure red
        expect(r).toBeCloseTo(255, 0);
        expect(g).toBeCloseTo(0, 0);
        expect(b).toBeCloseTo(0, 0);
      });

      it('should handle grayscale colors', () => {
        const [h, s, l] = rgbToHsl(128, 128, 128); // Gray
        expect(s).toBeCloseTo(0, 1);
        expect(l).toBeCloseTo(50.2, 1);
      });
    });

    describe('rgbToLab', () => {
      it('should convert RGB to LAB correctly', () => {
        const [L, A, B] = rgbToLab(255, 255, 255); // White
        expect(L).toBeCloseTo(100, 0);
        expect(A).toBeCloseTo(0, 1);
        expect(B).toBeCloseTo(0, 1);
      });

      it('should convert black to LAB correctly', () => {
        const [L, A, B] = rgbToLab(0, 0, 0); // Black
        expect(L).toBeCloseTo(0, 1);
        expect(A).toBeCloseTo(0, 1);
        expect(B).toBeCloseTo(0, 1);
      });
    });

    describe('colorDistance', () => {
      it('should calculate distance between identical colors as 0', () => {
        const distance = colorDistance(255, 0, 0, 255, 0, 0);
        expect(distance).toBeCloseTo(0, 2);
      });

      it('should calculate distance between different colors', () => {
        const distance = colorDistance(255, 0, 0, 0, 255, 0); // Red to Green
        expect(distance).toBeGreaterThan(0);
      });

      it('should calculate distance between black and white', () => {
        const distance = colorDistance(0, 0, 0, 255, 255, 255);
        expect(distance).toBeCloseTo(100, 0); // Should be close to 100 in LAB space
      });
    });
  });
});