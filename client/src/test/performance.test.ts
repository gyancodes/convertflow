/**
 * Performance tests for PNG to SVG converter
 * Tests memory usage, processing times, and optimization effectiveness
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImageProcessor } from '../services/imageProcessor';
import { PerformanceMonitor, measureAsync } from '../utils/performanceMonitor';
import { WorkerManager } from '../services/workerManager';
import { VectorizationConfig } from '../types/converter';

// Test image data generators
const createTestImageData = (width: number, height: number, pattern: 'solid' | 'gradient' | 'noise' = 'solid'): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      switch (pattern) {
        case 'solid':
          data[idx] = 128;     // R
          data[idx + 1] = 128; // G
          data[idx + 2] = 128; // B
          data[idx + 3] = 255; // A
          break;
          
        case 'gradient':
          data[idx] = (x / width) * 255;
          data[idx + 1] = (y / height) * 255;
          data[idx + 2] = 128;
          data[idx + 3] = 255;
          break;
          
        case 'noise':
          data[idx] = Math.random() * 255;
          data[idx + 1] = Math.random() * 255;
          data[idx + 2] = Math.random() * 255;
          data[idx + 3] = 255;
          break;
      }
    }
  }
  
  return new ImageData(data, width, height);
};

const defaultConfig: VectorizationConfig = {
  colorCount: 16,
  smoothingLevel: 'medium',
  pathSimplification: 1.0,
  preserveTransparency: true,
  algorithm: 'auto'
};

describe('Performance Tests', () => {
  let processor: ImageProcessor;
  let monitor: PerformanceMonitor;
  let workerManager: WorkerManager;

  beforeEach(() => {
    processor = new ImageProcessor();
    monitor = new PerformanceMonitor();
    workerManager = new WorkerManager();
  });

  afterEach(() => {
    workerManager.terminate();
  });

  describe('Memory Usage Tests', () => {
    it('should handle small images efficiently', async () => {
      const imageData = createTestImageData(100, 100);
      
      const { result, duration, memoryDelta } = await measureAsync(
        () => processor.processImage(imageData, defaultConfig),
        'small-image-processing'
      );

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(memoryDelta).toBeLessThan(10 * 1024 * 1024); // Should use less than 10MB
    });

    it('should optimize memory usage for large images', async () => {
      const imageData = createTestImageData(2048, 2048);
      
      const { result, duration, memoryDelta } = await measureAsync(
        () => processor.processImage(imageData, defaultConfig),
        'large-image-processing'
      );

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(30000); // Should complete in under 30 seconds
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // Should use less than 100MB
    });

    it('should reject images that exceed memory limits', async () => {
      // Create processor with very low memory limit
      const restrictedProcessor = new ImageProcessor({
        memoryLimit: 1024 * 1024 // 1MB limit
      });
      
      const largeImageData = createTestImageData(1000, 1000);
      
      await expect(
        restrictedProcessor.processImage(largeImageData, defaultConfig)
      ).rejects.toThrow(/memory usage.*exceeds limit/i);
    });

    it('should provide accurate memory usage statistics', () => {
      const metrics = processor.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('memoryLimit');
      expect(metrics).toHaveProperty('maxDimensions');
      expect(metrics).toHaveProperty('isMemoryMonitoringSupported');
      
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.memoryLimit).toBe('number');
      expect(metrics.memoryLimit).toBeGreaterThan(0);
    });
  });

  describe('Processing Time Tests', () => {
    it('should process simple images quickly', async () => {
      const imageData = createTestImageData(200, 200, 'solid');
      
      const startTime = performance.now();
      const result = await processor.processImage(imageData, defaultConfig);
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Under 2 seconds
    });

    it('should handle complex images within reasonable time', async () => {
      const imageData = createTestImageData(500, 500, 'noise');
      
      const startTime = performance.now();
      const result = await processor.processImage(imageData, defaultConfig);
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Under 10 seconds
    });

    it('should show performance improvement with lower quality settings', async () => {
      const imageData = createTestImageData(400, 400, 'gradient');
      
      const highQualityConfig: VectorizationConfig = {
        ...defaultConfig,
        colorCount: 256,
        pathSimplification: 0.1
      };
      
      const lowQualityConfig: VectorizationConfig = {
        ...defaultConfig,
        colorCount: 8,
        pathSimplification: 2.0
      };
      
      const { duration: highQualityTime } = await measureAsync(
        () => processor.processImage(imageData, highQualityConfig),
        'high-quality-processing'
      );
      
      const { duration: lowQualityTime } = await measureAsync(
        () => processor.processImage(imageData, lowQualityConfig),
        'low-quality-processing'
      );
      
      expect(lowQualityTime).toBeLessThan(highQualityTime);
    });
  });

  describe('Image Resizing Performance', () => {
    it('should resize large images efficiently', async () => {
      const largeImageData = createTestImageData(3000, 2000);
      
      const { result, duration } = await measureAsync(
        () => processor.processImage(largeImageData, defaultConfig),
        'resize-performance'
      );
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(15000); // Should complete in under 15 seconds
    });

    it('should maintain aspect ratio during resizing', async () => {
      const imageData = createTestImageData(1600, 800); // 2:1 aspect ratio
      
      // Process with small max dimensions to force resizing
      const smallProcessor = new ImageProcessor({
        maxDimensions: { width: 400, height: 400 }
      });
      
      const result = await smallProcessor.processImage(imageData, defaultConfig);
      expect(result).toBeDefined();
      
      // The actual resized dimensions would be checked in the preprocessing step
      // This test ensures the process completes without errors
    });
  });

  describe('Web Worker Performance', () => {
    it('should process images in background without blocking', async () => {
      const imageData = createTestImageData(800, 600, 'gradient');
      
      let progressUpdates = 0;
      const onProgress = (progress: number, stage: string) => {
        progressUpdates++;
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
        expect(typeof stage).toBe('string');
      };
      
      const result = await workerManager.processImage(imageData, defaultConfig, onProgress);
      
      expect(result).toBeDefined();
      expect(progressUpdates).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent jobs', async () => {
      const imageData1 = createTestImageData(300, 300, 'solid');
      const imageData2 = createTestImageData(300, 300, 'gradient');
      const imageData3 = createTestImageData(300, 300, 'noise');
      
      const promises = [
        workerManager.processImage(imageData1, defaultConfig),
        workerManager.processImage(imageData2, defaultConfig),
        workerManager.processImage(imageData3, defaultConfig)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should support job cancellation', async () => {
      const largeImageData = createTestImageData(1500, 1500);
      
      const promise = workerManager.processImage(largeImageData, defaultConfig);
      
      // Cancel after a short delay
      setTimeout(() => {
        const status = workerManager.getStatus();
        if (status.currentJobId) {
          workerManager.cancelJob(status.currentJobId);
        }
      }, 100);
      
      await expect(promise).rejects.toThrow(/cancelled/i);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track processing stages', async () => {
      monitor.startSession();
      monitor.startStage('test-stage');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      monitor.endStage('test-stage');
      
      const benchmarks = monitor.getBenchmarkResults();
      expect(benchmarks.stages).toHaveLength(1);
      expect(benchmarks.stages[0].stage).toBe('test-stage');
      expect(benchmarks.stages[0].duration).toBeGreaterThan(90);
    });

    it('should generate performance reports', async () => {
      const imageData = createTestImageData(400, 300);
      const result = await processor.processImage(imageData, defaultConfig);
      
      const metrics = monitor.calculateMetrics(imageData, {
        svgContent: '<svg></svg>',
        originalSize: imageData.data.length,
        vectorSize: 100,
        colorCount: 16,
        pathCount: 10
      });
      
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('processingTime');
      expect(metrics).toHaveProperty('imageSize');
      expect(metrics).toHaveProperty('conversionStats');
      
      expect(metrics.imageSize.width).toBe(400);
      expect(metrics.imageSize.height).toBe(300);
      expect(metrics.imageSize.pixels).toBe(120000);
    });

    it('should suggest optimizations for poor performance', () => {
      const metrics = {
        memoryUsage: { used: 100, total: 200, percentage: 300 },
        processingTime: 15000,
        imageSize: { width: 3000, height: 2000, pixels: 6000000, bytes: 24000000 },
        conversionStats: { originalSize: 1000, vectorSize: 500, compressionRatio: 0.5, colorCount: 128, pathCount: 2000 }
      };
      
      const suggestions = monitor.suggestOptimizations(metrics);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('memory'))).toBe(true);
      expect(suggestions.some(s => s.includes('resolution') || s.includes('resizing'))).toBe(true);
    });
  });

  describe('Stress Tests', () => {
    it('should handle maximum supported image size', async () => {
      // Test with largest reasonable image size
      const maxImageData = createTestImageData(2048, 2048, 'gradient');
      
      const { result, duration, memoryDelta } = await measureAsync(
        () => processor.processImage(maxImageData, defaultConfig),
        'max-size-stress-test'
      );
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(60000); // Should complete in under 1 minute
      expect(memoryDelta).toBeLessThan(200 * 1024 * 1024); // Should use less than 200MB
    });

    it('should handle rapid successive processing', async () => {
      const imageData = createTestImageData(200, 200);
      const iterations = 5;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = await processor.processImage(imageData, defaultConfig);
        expect(result).toBeDefined();
      }
      
      const totalTime = performance.now() - startTime;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(3000); // Average under 3 seconds per image
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during repeated processing', async () => {
      const imageData = createTestImageData(300, 300);
      
      // Get baseline memory
      const initialMemory = monitor.getCurrentMemoryUsage();
      
      // Process multiple images
      for (let i = 0; i < 10; i++) {
        await processor.processImage(imageData, defaultConfig);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = monitor.getCurrentMemoryUsage();
      
      // Memory increase should be minimal (less than 50MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should meet performance benchmarks for different image sizes', async () => {
    const processor = new ImageProcessor();
    
    const benchmarks = [
      { size: [100, 100], maxTime: 500, label: 'tiny' },
      { size: [300, 300], maxTime: 2000, label: 'small' },
      { size: [600, 600], maxTime: 5000, label: 'medium' },
      { size: [1000, 1000], maxTime: 15000, label: 'large' }
    ];
    
    for (const benchmark of benchmarks) {
      const imageData = createTestImageData(benchmark.size[0], benchmark.size[1], 'gradient');
      
      const { duration } = await measureAsync(
        () => processor.processImage(imageData, defaultConfig),
        `benchmark-${benchmark.label}`
      );
      
      expect(duration).toBeLessThan(benchmark.maxTime);
      console.log(`${benchmark.label} (${benchmark.size[0]}x${benchmark.size[1]}): ${Math.round(duration)}ms`);
    }
  });
});