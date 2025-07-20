import { VectorizationConfig, ProcessingResult } from '../types/converter';
import { PerformanceMonitor } from '../utils/performanceMonitor';

/**
 * Core image processing service for PNG to SVG conversion
 * Handles image preprocessing, resizing, and format conversions with performance optimizations
 */
export class ImageProcessor {
  private maxDimensions: { width: number; height: number };
  private memoryLimit: number;
  private performanceMonitor: PerformanceMonitor;

  constructor(options?: {
    maxDimensions?: { width: number; height: number };
    memoryLimit?: number;
  }) {
    // Reduced default dimensions for better performance
    this.maxDimensions = options?.maxDimensions || { width: 1024, height: 1024 };
    this.memoryLimit = options?.memoryLimit || 50 * 1024 * 1024; // Reduced to 50MB
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Process image with given configuration and performance monitoring
   */
  async processImage(
    imageData: ImageData,
    config: VectorizationConfig,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ProcessingResult> {
    this.performanceMonitor.startSession();
    this.performanceMonitor.startStage('total-processing');

    try {
      // Check performance thresholds before processing
      const thresholds = this.performanceMonitor.checkPerformanceThresholds(imageData);
      if (thresholds.warnings.length > 0) {
        console.warn('Performance warnings:', thresholds.warnings);
      }

      // Stage 1: Preprocessing
      this.performanceMonitor.startStage('preprocessing');
      onProgress?.(10, 'preprocessing');
      const preprocessed = await this.preprocessImageOptimized(imageData, config);
      this.performanceMonitor.endStage('preprocessing');
      
      // Check memory constraints
      this.checkMemoryUsage(preprocessed);
      onProgress?.(20, 'preprocessing-complete');

      this.performanceMonitor.endStage('total-processing');
      const processingTime = performance.now() - this.performanceMonitor['startTime'];
      
      // Return basic result structure - actual processing will be done by other services
      const result: ProcessingResult = {
        svgContent: '', // Will be filled by SVG generator
        originalSize: imageData.data.length,
        vectorSize: 0, // Will be calculated later
        processingTime,
        colorCount: 0, // Will be filled by color quantizer
        pathCount: 0 // Will be filled by vectorizer
      };

      // Generate performance report
      const report = this.performanceMonitor.generateReport(imageData, result);
      console.log(report);

      return result;
    } catch (error) {
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preprocess image data with performance optimizations
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
   * Optimized preprocessing with adaptive quality based on image size
   */
  private async preprocessImageOptimized(
    imageData: ImageData, 
    config: VectorizationConfig
  ): Promise<ImageData> {
    const pixels = imageData.width * imageData.height;
    
    // Adaptive resizing based on image complexity and memory constraints
    let targetDimensions = { ...this.maxDimensions };
    
    // For very large images, be more aggressive with resizing
    if (pixels > 2 * 1024 * 1024) { // > 2MP
      targetDimensions.width = Math.min(targetDimensions.width, 800);
      targetDimensions.height = Math.min(targetDimensions.height, 800);
    }
    
    // For high color count requirements, allow larger images
    if (config.colorCount > 128) {
      targetDimensions.width = Math.min(this.maxDimensions.width, 1200);
      targetDimensions.height = Math.min(this.maxDimensions.height, 1200);
    }

    let processed = imageData;

    // Resize if needed
    if (imageData.width > targetDimensions.width || imageData.height > targetDimensions.height) {
      processed = this.resizeImageDataOptimized(processed, targetDimensions);
    }

    // Apply normalization with sampling for large images
    processed = await this.normalizeImageDataOptimized(processed);

    return processed;
  }

  /**
   * Optimized resize with better quality and performance
   */
  private resizeImageDataOptimized(
    imageData: ImageData, 
    maxDimensions: { width: number; height: number }
  ): ImageData {
    const { width, height } = imageData;
    const { width: maxWidth, height: maxHeight } = maxDimensions;

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

    // Use optimized bilinear interpolation
    return this.bilinearResize(imageData, newWidth, newHeight);
  }

  /**
   * High-performance bilinear interpolation resize
   */
  private bilinearResize(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    const xRatio = width / newWidth;
    const yRatio = height / newHeight;

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = x * xRatio;
        const srcY = y * yRatio;
        
        const x1 = Math.floor(srcX);
        const y1 = Math.floor(srcY);
        const x2 = Math.min(x1 + 1, width - 1);
        const y2 = Math.min(y1 + 1, height - 1);
        
        const dx = srcX - x1;
        const dy = srcY - y1;

        const idx1 = (y1 * width + x1) * 4;
        const idx2 = (y1 * width + x2) * 4;
        const idx3 = (y2 * width + x1) * 4;
        const idx4 = (y2 * width + x2) * 4;

        const outputIdx = (y * newWidth + x) * 4;

        // Interpolate each channel
        for (let c = 0; c < 4; c++) {
          const p1 = data[idx1 + c];
          const p2 = data[idx2 + c];
          const p3 = data[idx3 + c];
          const p4 = data[idx4 + c];

          const interpolated = p1 * (1 - dx) * (1 - dy) +
                             p2 * dx * (1 - dy) +
                             p3 * (1 - dx) * dy +
                             p4 * dx * dy;

          newData[outputIdx + c] = Math.round(interpolated);
        }
      }
    }

    return new ImageData(newData, newWidth, newHeight);
  }

  /**
   * Resize image data to fit within maximum dimensions (legacy method)
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
   * Optimized normalization with sampling for large images
   */
  private async normalizeImageDataOptimized(imageData: ImageData): Promise<ImageData> {
    const data = new Uint8ClampedArray(imageData.data);
    const pixels = data.length / 4;
    
    // Use adaptive sampling based on image size
    const maxSamples = 50000; // Increased sample size for better accuracy
    const sampleSize = Math.min(pixels, maxSamples);
    const step = Math.max(1, Math.floor(pixels / sampleSize));
    
    // Find min/max values for each channel using sampling
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (let i = 0; i < pixels; i += step) {
      const idx = i * 4;
      minR = Math.min(minR, data[idx]);
      maxR = Math.max(maxR, data[idx]);
      minG = Math.min(minG, data[idx + 1]);
      maxG = Math.max(maxG, data[idx + 1]);
      minB = Math.min(minB, data[idx + 2]);
      maxB = Math.max(maxB, data[idx + 2]);
    }

    // Apply normalization if there's sufficient range
    const rangeR = maxR - minR;
    const rangeG = maxG - minG;
    const rangeB = maxB - minB;
    const threshold = 15; // Increased threshold for better results

    if (rangeR > threshold || rangeG > threshold || rangeB > threshold) {
      // Process in chunks to avoid blocking the main thread
      const chunkSize = 10000;
      
      for (let start = 0; start < pixels; start += chunkSize) {
        const end = Math.min(start + chunkSize, pixels);
        
        for (let i = start; i < end; i++) {
          const idx = i * 4;
          
          if (rangeR > threshold) {
            data[idx] = Math.round(((data[idx] - minR) / rangeR) * 255);
          }
          if (rangeG > threshold) {
            data[idx + 1] = Math.round(((data[idx + 1] - minG) / rangeG) * 255);
          }
          if (rangeB > threshold) {
            data[idx + 2] = Math.round(((data[idx + 2] - minB) / rangeB) * 255);
          }
        }
        
        // Yield control to prevent blocking
        if (start % (chunkSize * 10) === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Normalize image data (adjust brightness, contrast, etc.) - legacy method
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
   * Enhanced memory usage checking with performance monitoring
   */
  private checkMemoryUsage(imageData: ImageData): void {
    const imageMemory = imageData.data.length;
    const systemMemory = this.performanceMonitor.getCurrentMemoryUsage();
    
    // Check image data size
    if (imageMemory > this.memoryLimit) {
      throw new Error(
        `Image memory usage (${Math.round(imageMemory / 1024 / 1024)}MB) exceeds limit (${Math.round(this.memoryLimit / 1024 / 1024)}MB)`
      );
    }
    
    // Check system memory if available
    if (systemMemory > 0) {
      const memoryStats = this.performanceMonitor.getMemoryStats();
      if (memoryStats.delta > this.memoryLimit * 2) {
        console.warn(
          `High system memory usage detected: ${Math.round(memoryStats.delta / 1024 / 1024)}MB above baseline`
        );
      }
    }
  }

  /**
   * Optimize image for processing based on available memory
   */
  private optimizeForMemory(imageData: ImageData): ImageData {
    const memoryStats = this.performanceMonitor.getMemoryStats();
    const imageMemory = imageData.data.length;
    
    // If memory usage is high, aggressively resize
    if (memoryStats.delta > this.memoryLimit || imageMemory > this.memoryLimit / 2) {
      const reductionFactor = Math.sqrt(this.memoryLimit / (imageMemory * 2));
      const newWidth = Math.round(imageData.width * reductionFactor);
      const newHeight = Math.round(imageData.height * reductionFactor);
      
      console.log(`Optimizing image for memory: ${imageData.width}x${imageData.height} -> ${newWidth}x${newHeight}`);
      return this.bilinearResize(imageData, newWidth, newHeight);
    }
    
    return imageData;
  }

  /**
   * Extract image data from file with memory optimization
   */
  async extractImageData(file: File): Promise<ImageData> {
    // Check file size before processing
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      img.onload = () => {
        try {
          // Check if image dimensions are reasonable
          if (img.width > 4096 || img.height > 4096) {
            console.warn(`Large image dimensions: ${img.width}x${img.height}`);
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          
          // Clean up
          URL.revokeObjectURL(img.src);
          
          resolve(imageData);
        } catch (error) {
          reject(new Error(`Failed to extract image data: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): {
    memoryUsage: number;
    memoryLimit: number;
    maxDimensions: { width: number; height: number };
    isMemoryMonitoringSupported: boolean;
  } {
    const memoryStats = this.performanceMonitor.getMemoryStats();
    
    return {
      memoryUsage: memoryStats.current,
      memoryLimit: this.memoryLimit,
      maxDimensions: this.maxDimensions,
      isMemoryMonitoringSupported: memoryStats.isSupported
    };
  }

  /**
   * Update processing limits based on system capabilities
   */
  updateLimits(options: {
    maxDimensions?: { width: number; height: number };
    memoryLimit?: number;
  }): void {
    if (options.maxDimensions) {
      this.maxDimensions = options.maxDimensions;
    }
    
    if (options.memoryLimit) {
      this.memoryLimit = options.memoryLimit;
    }
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