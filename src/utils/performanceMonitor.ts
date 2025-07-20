/**
 * Performance monitoring utilities for tracking memory usage and processing times
 */

interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  processingTime: number;
  imageSize: {
    width: number;
    height: number;
    pixels: number;
    bytes: number;
  };
  conversionStats: {
    originalSize: number;
    vectorSize: number;
    compressionRatio: number;
    colorCount: number;
    pathCount: number;
  };
}

interface ProcessingBenchmark {
  stage: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
}

export class PerformanceMonitor {
  private benchmarks: ProcessingBenchmark[] = [];
  private startTime: number = 0;
  private memoryBaseline: number = 0;

  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Start monitoring a processing session
   */
  startSession(): void {
    this.startTime = performance.now();
    this.benchmarks = [];
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Start timing a specific processing stage
   */
  startStage(stage: string): void {
    const benchmark: ProcessingBenchmark = {
      stage,
      startTime: performance.now(),
      memoryBefore: this.getCurrentMemoryUsage()
    };
    
    this.benchmarks.push(benchmark);
  }

  /**
   * End timing a specific processing stage
   */
  endStage(stage: string): void {
    const benchmark = this.benchmarks.find(b => b.stage === stage && !b.endTime);
    
    if (benchmark) {
      benchmark.endTime = performance.now();
      benchmark.duration = benchmark.endTime - benchmark.startTime;
      benchmark.memoryAfter = this.getCurrentMemoryUsage();
      benchmark.memoryDelta = benchmark.memoryAfter - (benchmark.memoryBefore || 0);
    }
  }

  /**
   * Get current memory usage (approximation)
   */
  getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      // Chrome/Edge specific
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    
    // Fallback estimation based on typical usage patterns
    return 0;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: number;
    peak: number;
    baseline: number;
    delta: number;
    isSupported: boolean;
  } {
    const current = this.getCurrentMemoryUsage();
    const peak = Math.max(...this.benchmarks.map(b => b.memoryAfter || 0));
    
    return {
      current,
      peak,
      baseline: this.memoryBaseline,
      delta: current - this.memoryBaseline,
      isSupported: 'memory' in performance
    };
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculateMetrics(
    imageData: ImageData,
    result: {
      svgContent: string;
      originalSize: number;
      vectorSize: number;
      colorCount: number;
      pathCount: number;
    }
  ): PerformanceMetrics {
    const totalTime = performance.now() - this.startTime;
    const memoryStats = this.getMemoryStats();
    
    return {
      memoryUsage: {
        used: memoryStats.current,
        total: memoryStats.peak,
        percentage: memoryStats.isSupported 
          ? (memoryStats.delta / memoryStats.baseline) * 100 
          : 0
      },
      processingTime: totalTime,
      imageSize: {
        width: imageData.width,
        height: imageData.height,
        pixels: imageData.width * imageData.height,
        bytes: imageData.data.length
      },
      conversionStats: {
        originalSize: result.originalSize,
        vectorSize: result.vectorSize,
        compressionRatio: result.originalSize > 0 ? result.vectorSize / result.originalSize : 0,
        colorCount: result.colorCount,
        pathCount: result.pathCount
      }
    };
  }

  /**
   * Get detailed benchmark results
   */
  getBenchmarkResults(): {
    stages: ProcessingBenchmark[];
    totalTime: number;
    slowestStage: string | null;
    memoryPeak: number;
    memoryEfficiency: number;
  } {
    const totalTime = performance.now() - this.startTime;
    const completedStages = this.benchmarks.filter(b => b.duration !== undefined);
    
    const slowestStage = completedStages.reduce((slowest, current) => {
      return (current.duration || 0) > (slowest?.duration || 0) ? current : slowest;
    }, null as ProcessingBenchmark | null);

    const memoryPeak = Math.max(...this.benchmarks.map(b => b.memoryAfter || 0));
    const memoryEfficiency = this.memoryBaseline > 0 
      ? (memoryPeak - this.memoryBaseline) / this.memoryBaseline 
      : 0;

    return {
      stages: completedStages,
      totalTime,
      slowestStage: slowestStage?.stage || null,
      memoryPeak,
      memoryEfficiency
    };
  }

  /**
   * Generate performance report
   */
  generateReport(imageData: ImageData, result: any): string {
    const metrics = this.calculateMetrics(imageData, result);
    const benchmarks = this.getBenchmarkResults();
    
    let report = '=== Performance Report ===\n\n';
    
    // Image info
    report += `Image: ${metrics.imageSize.width}x${metrics.imageSize.height} (${metrics.imageSize.pixels.toLocaleString()} pixels)\n`;
    report += `Original size: ${(metrics.imageSize.bytes / 1024).toFixed(1)} KB\n`;
    report += `Vector size: ${(metrics.conversionStats.vectorSize / 1024).toFixed(1)} KB\n`;
    report += `Compression ratio: ${(metrics.conversionStats.compressionRatio * 100).toFixed(1)}%\n\n`;
    
    // Processing time
    report += `Total processing time: ${metrics.processingTime.toFixed(0)}ms\n`;
    if (benchmarks.slowestStage) {
      report += `Slowest stage: ${benchmarks.slowestStage}\n`;
    }
    report += '\n';
    
    // Stage breakdown
    report += 'Stage breakdown:\n';
    for (const stage of benchmarks.stages) {
      const percentage = ((stage.duration || 0) / benchmarks.totalTime * 100).toFixed(1);
      report += `  ${stage.stage}: ${(stage.duration || 0).toFixed(0)}ms (${percentage}%)\n`;
    }
    report += '\n';
    
    // Memory usage
    if (metrics.memoryUsage.percentage > 0) {
      report += `Memory usage: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)} MB\n`;
      report += `Memory peak: ${(metrics.memoryUsage.total / 1024 / 1024).toFixed(1)} MB\n`;
      report += `Memory efficiency: ${benchmarks.memoryEfficiency.toFixed(2)}x baseline\n`;
    } else {
      report += 'Memory monitoring not supported in this browser\n';
    }
    
    return report;
  }

  /**
   * Check if current processing is within performance thresholds
   */
  checkPerformanceThresholds(imageData: ImageData): {
    memoryOk: boolean;
    sizeOk: boolean;
    complexityOk: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const pixels = imageData.width * imageData.height;
    const memoryUsage = this.getCurrentMemoryUsage();
    
    // Memory threshold (100MB)
    const memoryOk = memoryUsage < 100 * 1024 * 1024;
    if (!memoryOk) {
      warnings.push(`High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // Image size threshold (4MP)
    const sizeOk = pixels < 4 * 1024 * 1024;
    if (!sizeOk) {
      warnings.push(`Large image: ${(pixels / 1024 / 1024).toFixed(1)}MP`);
    }
    
    // Complexity threshold (based on image dimensions)
    const complexityOk = imageData.width < 2048 && imageData.height < 2048;
    if (!complexityOk) {
      warnings.push(`High resolution: ${imageData.width}x${imageData.height}`);
    }
    
    return {
      memoryOk,
      sizeOk,
      complexityOk,
      warnings
    };
  }

  /**
   * Suggest optimizations based on performance metrics
   */
  suggestOptimizations(metrics: PerformanceMetrics): string[] {
    const suggestions: string[] = [];
    
    // Processing time optimizations
    if (metrics.processingTime > 10000) { // > 10 seconds
      suggestions.push('Consider reducing image resolution for faster processing');
    }
    
    // Memory optimizations
    if (metrics.memoryUsage.percentage > 200) { // > 200% of baseline
      suggestions.push('High memory usage detected - try processing smaller images');
    }
    
    // Size optimizations
    if (metrics.imageSize.pixels > 2 * 1024 * 1024) { // > 2MP
      suggestions.push('Large image detected - consider resizing before conversion');
    }
    
    // Quality vs performance trade-offs
    if (metrics.conversionStats.pathCount > 1000) {
      suggestions.push('High path count - increase path simplification for better performance');
    }
    
    if (metrics.conversionStats.colorCount > 64) {
      suggestions.push('High color count - reduce colors for faster processing');
    }
    
    return suggestions;
  }

  /**
   * Reset monitoring state
   */
  reset(): void {
    this.benchmarks = [];
    this.startTime = 0;
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }
}

// Utility functions for performance testing
export const measureAsync = async <T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number; memoryDelta: number }> => {
  const monitor = new PerformanceMonitor();
  monitor.startSession();
  monitor.startStage(label);
  
  const memoryBefore = monitor.getCurrentMemoryUsage();
  const result = await fn();
  const memoryAfter = monitor.getCurrentMemoryUsage();
  
  monitor.endStage(label);
  const benchmarks = monitor.getBenchmarkResults();
  const stage = benchmarks.stages.find(s => s.stage === label);
  
  return {
    result,
    duration: stage?.duration || 0,
    memoryDelta: memoryAfter - memoryBefore
  };
};

export const createPerformanceMonitor = (): PerformanceMonitor => {
  return new PerformanceMonitor();
};

export default PerformanceMonitor;