import { VectorizationConfig, ProcessingResult } from '../types/converter';

/**
 * Core image processing service for PNG to SVG conversion
 * Handles image preprocessing, resizing, and format conversions
 */
export class ImageProcessor {
  private maxDimensions: { width: number; height: number };
  private memoryLimit: number;

  constructor(options?: {
    maxDimensions?: { width: number; height: number };
    memoryLimit?: number;
  }) {
    this.maxDimensions = options?.maxDimensions || { width: 2048, height: 2048 };
    this.memoryLimit = options?.memoryLimit || 100 * 1024 * 1024; // 100MB
  }

  /**
   * Process image with given configuration
   */
  async processImage(
    imageData: ImageData,
    config: VectorizationConfig
  ): Promise<ProcessingResult> {
    const startTime = performance.now();

    try {
      // Preprocess image
      const preprocessed = await this.preprocessImage(imageData);
      
      // Check memory constraints
      this.checkMemoryUsage(preprocessed);

      const processingTime = performance.now() - startTime;
      
      // Return basic result structure - actual processing will be done by other services
      return {
        svgContent: '', // Will be filled by SVG generator
        originalSize: imageData.data.length,
        vectorSize: 0, // Will be calculated later
        processingTime,
        colorCount: 0, // Will be filled by color quantizer
        pathCount: 0 // Will be filled by vectorizer
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image data (resize, normalize, etc.)
   */
  async preprocessImage(imageData: ImageData): Promise<ImageData> {
    // Check if resizing is needed
    if (imageData.width > this.maxDimensions.width || imageData.height > this.maxDimensions.height) {
      return this.resizeImageData(imageData);
    }

    // Normalize image data
    return this.normalizeImageData(imageData);
  }

  /**
   * Resize image data to fit within maximum dimensions
   */
  private resizeImageData(imageData: ImageData): ImageData {
    const { width, height } = imageData;
    const { width: maxWidth, height: maxHeight } = this.maxDimensions;

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = width / height;
    let newWidth = width;
    let newHeight = height;

    if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    // Round to integers
    newWidth = Math.round(newWidth);
    newHeight = Math.round(newHeight);

    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context for resizing');
    }

    // Set up source canvas
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    
    if (!sourceCtx) {
      throw new Error('Could not create source canvas context');
    }

    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceCtx.putImageData(imageData, 0, 0);

    // Resize
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(sourceCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight);

    return ctx.getImageData(0, 0, newWidth, newHeight);
  }

  /**
   * Normalize image data (adjust brightness, contrast, etc.)
   */
  private normalizeImageData(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    
    // Simple normalization - ensure full range utilization
    let min = 255;
    let max = 0;

    // Find min/max values (excluding alpha channel)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r + g + b) / 3;
      
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }

    // Normalize if there's a reasonable range
    if (max - min > 10) {
      const range = max - min;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Normalize each channel
        data[i] = Math.round(((r - min) / range) * 255);
        data[i + 1] = Math.round(((g - min) / range) * 255);
        data[i + 2] = Math.round(((b - min) / range) * 255);
        // Alpha channel remains unchanged
      }
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Check memory usage and throw error if exceeding limits
   */
  private checkMemoryUsage(imageData: ImageData): void {
    const memoryUsage = imageData.data.length;
    
    if (memoryUsage > this.memoryLimit) {
      throw new Error(`Memory usage (${Math.round(memoryUsage / 1024 / 1024)}MB) exceeds limit (${Math.round(this.memoryLimit / 1024 / 1024)}MB)`);
    }
  }

  /**
   * Extract image data from file
   */
  async extractImageData(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        } catch (error) {
          reject(new Error('Failed to extract image data'));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(imageData: ImageData): {
    dimensions: { width: number; height: number };
    pixelCount: number;
    memoryUsage: number;
    hasTransparency: boolean;
  } {
    const hasTransparency = this.checkTransparency(imageData);
    
    return {
      dimensions: { width: imageData.width, height: imageData.height },
      pixelCount: imageData.width * imageData.height,
      memoryUsage: imageData.data.length,
      hasTransparency
    };
  }

  /**
   * Check if image has transparency
   */
  private checkTransparency(imageData: ImageData): boolean {
    const data = imageData.data;
    
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    
    return false;
  }
}

export default ImageProcessor;