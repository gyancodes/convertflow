/**
 * Web Worker for background image processing
 * Handles CPU-intensive operations without blocking the main thread
 */

import { VectorizationConfig, ProcessingResult } from '../types/converter';

// Worker message types
interface WorkerMessage {
  type: 'process' | 'cancel';
  data?: {
    imageData: ImageData;
    config: VectorizationConfig;
    jobId: string;
  };
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: {
    jobId: string;
    progress?: number;
    stage?: string;
    result?: ProcessingResult;
    error?: string;
  };
}

// Processing stages for progress tracking
const PROCESSING_STAGES = [
  'preprocessing',
  'color-quantization',
  'edge-detection',
  'vectorization',
  'svg-generation'
] as const;

class ImageProcessingWorker {
  private currentJobId: string | null = null;
  private cancelled = false;

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent<WorkerMessage>) {
    const { type, data } = event.data;

    switch (type) {
      case 'process':
        if (data) {
          this.processImage(data.imageData, data.config, data.jobId);
        }
        break;
      case 'cancel':
        this.cancelled = true;
        break;
    }
  }

  private async processImage(
    imageData: ImageData,
    config: VectorizationConfig,
    jobId: string
  ) {
    this.currentJobId = jobId;
    this.cancelled = false;

    try {
      const startTime = performance.now();
      let currentStage = 0;

      // Stage 1: Preprocessing
      this.sendProgress(jobId, 0, PROCESSING_STAGES[currentStage]);
      const preprocessed = await this.preprocessImage(imageData, config);
      if (this.cancelled) return;
      
      currentStage++;
      this.sendProgress(jobId, 20, PROCESSING_STAGES[currentStage]);

      // Stage 2: Color quantization
      const quantized = await this.quantizeColors(preprocessed, config.colorCount);
      if (this.cancelled) return;
      
      currentStage++;
      this.sendProgress(jobId, 40, PROCESSING_STAGES[currentStage]);

      // Stage 3: Edge detection
      const edges = await this.detectEdges(quantized);
      if (this.cancelled) return;
      
      currentStage++;
      this.sendProgress(jobId, 60, PROCESSING_STAGES[currentStage]);

      // Stage 4: Vectorization
      const paths = await this.vectorize(edges, config);
      if (this.cancelled) return;
      
      currentStage++;
      this.sendProgress(jobId, 80, PROCESSING_STAGES[currentStage]);

      // Stage 5: SVG generation
      const svgContent = await this.generateSVG(paths, imageData.width, imageData.height);
      if (this.cancelled) return;

      const processingTime = performance.now() - startTime;

      const result: ProcessingResult = {
        svgContent,
        originalSize: imageData.data.length,
        vectorSize: svgContent.length,
        processingTime,
        colorCount: quantized.colors.length,
        pathCount: paths.length
      };

      this.sendComplete(jobId, result);
    } catch (error) {
      this.sendError(jobId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async preprocessImage(imageData: ImageData, config: VectorizationConfig): Promise<ImageData> {
    // Implement memory-efficient preprocessing
    const maxDimension = 1024; // Reduced from 2048 for better performance
    
    if (imageData.width > maxDimension || imageData.height > maxDimension) {
      return this.resizeImageDataEfficient(imageData, maxDimension);
    }

    return this.normalizeImageDataEfficient(imageData);
  }

  private resizeImageDataEfficient(imageData: ImageData, maxDimension: number): ImageData {
    const { width, height } = imageData;
    const aspectRatio = width / height;
    
    let newWidth = width;
    let newHeight = height;

    if (width > height) {
      newWidth = Math.min(width, maxDimension);
      newHeight = Math.round(newWidth / aspectRatio);
    } else {
      newHeight = Math.min(height, maxDimension);
      newWidth = Math.round(newHeight * aspectRatio);
    }

    // Use bilinear interpolation for better quality
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

        for (let c = 0; c < 4; c++) {
          const p1 = imageData.data[(y1 * width + x1) * 4 + c];
          const p2 = imageData.data[(y1 * width + x2) * 4 + c];
          const p3 = imageData.data[(y2 * width + x1) * 4 + c];
          const p4 = imageData.data[(y2 * width + x2) * 4 + c];

          const interpolated = p1 * (1 - dx) * (1 - dy) +
                             p2 * dx * (1 - dy) +
                             p3 * (1 - dx) * dy +
                             p4 * dx * dy;

          newData[(y * newWidth + x) * 4 + c] = Math.round(interpolated);
        }
      }
    }

    return new ImageData(newData, newWidth, newHeight);
  }

  private normalizeImageDataEfficient(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const pixels = data.length / 4;
    
    // Use sampling for large images to improve performance
    const sampleSize = Math.min(pixels, 10000);
    const step = Math.max(1, Math.floor(pixels / sampleSize));
    
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    // Sample pixels to find min/max values
    for (let i = 0; i < pixels; i += step) {
      const idx = i * 4;
      minR = Math.min(minR, data[idx]);
      maxR = Math.max(maxR, data[idx]);
      minG = Math.min(minG, data[idx + 1]);
      maxG = Math.max(maxG, data[idx + 1]);
      minB = Math.min(minB, data[idx + 2]);
      maxB = Math.max(maxB, data[idx + 2]);
    }

    // Apply normalization
    const rangeR = maxR - minR;
    const rangeG = maxG - minG;
    const rangeB = maxB - minB;

    if (rangeR > 10 || rangeG > 10 || rangeB > 10) {
      for (let i = 0; i < pixels; i++) {
        const idx = i * 4;
        
        if (rangeR > 10) {
          data[idx] = Math.round(((data[idx] - minR) / rangeR) * 255);
        }
        if (rangeG > 10) {
          data[idx + 1] = Math.round(((data[idx + 1] - minG) / rangeG) * 255);
        }
        if (rangeB > 10) {
          data[idx + 2] = Math.round(((data[idx + 2] - minB) / rangeB) * 255);
        }
      }
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  private async quantizeColors(imageData: ImageData, colorCount: number): Promise<{
    imageData: ImageData;
    colors: Array<{ r: number; g: number; b: number; count: number }>;
  }> {
    // Implement optimized k-means clustering
    const data = imageData.data;
    const pixels = data.length / 4;
    
    // Sample pixels for initial centroids (performance optimization)
    const sampleSize = Math.min(pixels, 5000);
    const step = Math.max(1, Math.floor(pixels / sampleSize));
    const samples: Array<[number, number, number]> = [];
    
    for (let i = 0; i < pixels; i += step) {
      const idx = i * 4;
      samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }

    // Initialize centroids using k-means++
    const centroids = this.initializeCentroids(samples, colorCount);
    
    // Run k-means clustering
    const finalCentroids = this.runKMeans(samples, centroids, 10); // Max 10 iterations
    
    // Quantize the full image
    const quantizedData = new Uint8ClampedArray(data);
    const colorCounts = new Array(finalCentroids.length).fill(0);
    
    for (let i = 0; i < pixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Find closest centroid
      let minDistance = Infinity;
      let closestIndex = 0;
      
      for (let j = 0; j < finalCentroids.length; j++) {
        const [cr, cg, cb] = finalCentroids[j];
        const distance = Math.sqrt(
          (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = j;
        }
      }
      
      // Assign pixel to closest centroid
      const [cr, cg, cb] = finalCentroids[closestIndex];
      quantizedData[idx] = cr;
      quantizedData[idx + 1] = cg;
      quantizedData[idx + 2] = cb;
      colorCounts[closestIndex]++;
    }
    
    const colors = finalCentroids.map(([r, g, b], index) => ({
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
      count: colorCounts[index]
    }));
    
    return {
      imageData: new ImageData(quantizedData, imageData.width, imageData.height),
      colors
    };
  }

  private initializeCentroids(
    samples: Array<[number, number, number]>, 
    k: number
  ): Array<[number, number, number]> {
    const centroids: Array<[number, number, number]> = [];
    
    // Choose first centroid randomly
    centroids.push(samples[Math.floor(Math.random() * samples.length)]);
    
    // Choose remaining centroids using k-means++
    for (let i = 1; i < k; i++) {
      const distances = samples.map(sample => {
        let minDistance = Infinity;
        for (const centroid of centroids) {
          const distance = Math.sqrt(
            (sample[0] - centroid[0]) ** 2 +
            (sample[1] - centroid[1]) ** 2 +
            (sample[2] - centroid[2]) ** 2
          );
          minDistance = Math.min(minDistance, distance);
        }
        return minDistance ** 2;
      });
      
      const totalDistance = distances.reduce((sum, d) => sum + d, 0);
      const threshold = Math.random() * totalDistance;
      
      let cumulativeDistance = 0;
      for (let j = 0; j < samples.length; j++) {
        cumulativeDistance += distances[j];
        if (cumulativeDistance >= threshold) {
          centroids.push(samples[j]);
          break;
        }
      }
    }
    
    return centroids;
  }

  private runKMeans(
    samples: Array<[number, number, number]>,
    initialCentroids: Array<[number, number, number]>,
    maxIterations: number
  ): Array<[number, number, number]> {
    let centroids = [...initialCentroids];
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign samples to clusters
      const clusters: Array<Array<[number, number, number]>> = 
        new Array(centroids.length).fill(null).map(() => []);
      
      for (const sample of samples) {
        let minDistance = Infinity;
        let closestIndex = 0;
        
        for (let i = 0; i < centroids.length; i++) {
          const distance = Math.sqrt(
            (sample[0] - centroids[i][0]) ** 2 +
            (sample[1] - centroids[i][1]) ** 2 +
            (sample[2] - centroids[i][2]) ** 2
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        }
        
        clusters[closestIndex].push(sample);
      }
      
      // Update centroids
      const newCentroids: Array<[number, number, number]> = [];
      let converged = true;
      
      for (let i = 0; i < centroids.length; i++) {
        if (clusters[i].length === 0) {
          newCentroids.push(centroids[i]);
          continue;
        }
        
        const sumR = clusters[i].reduce((sum, [r]) => sum + r, 0);
        const sumG = clusters[i].reduce((sum, [, g]) => sum + g, 0);
        const sumB = clusters[i].reduce((sum, [, , b]) => sum + b, 0);
        const count = clusters[i].length;
        
        const newCentroid: [number, number, number] = [
          sumR / count,
          sumG / count,
          sumB / count
        ];
        
        // Check for convergence
        const distance = Math.sqrt(
          (newCentroid[0] - centroids[i][0]) ** 2 +
          (newCentroid[1] - centroids[i][1]) ** 2 +
          (newCentroid[2] - centroids[i][2]) ** 2
        );
        
        if (distance > 1) {
          converged = false;
        }
        
        newCentroids.push(newCentroid);
      }
      
      centroids = newCentroids;
      
      if (converged) {
        break;
      }
    }
    
    return centroids;
  }

  private async detectEdges(quantizedResult: {
    imageData: ImageData;
    colors: Array<{ r: number; g: number; b: number; count: number }>;
  }): Promise<ImageData> {
    // Implement optimized Sobel edge detection
    const { imageData } = quantizedResult;
    const { width, height, data } = imageData;
    const edgeData = new Uint8ClampedArray(width * height * 4);
    
    // Sobel kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Apply Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            
            gx += gray * sobelX[ky + 1][kx + 1];
            gy += gray * sobelY[ky + 1][kx + 1];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const edgeValue = Math.min(255, magnitude);
        
        const outputIdx = (y * width + x) * 4;
        edgeData[outputIdx] = edgeValue;
        edgeData[outputIdx + 1] = edgeValue;
        edgeData[outputIdx + 2] = edgeValue;
        edgeData[outputIdx + 3] = 255;
      }
    }
    
    return new ImageData(edgeData, width, height);
  }

  private async vectorize(edgeData: ImageData, config: VectorizationConfig): Promise<Array<{
    path: string;
    color: string;
  }>> {
    // Simplified vectorization for performance
    const paths: Array<{ path: string; color: string }> = [];
    const { width, height, data } = edgeData;
    const visited = new Array(width * height).fill(false);
    
    // Find contours
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (visited[idx]) continue;
        
        const pixelIdx = idx * 4;
        const edgeStrength = data[pixelIdx];
        
        if (edgeStrength > 128) { // Edge threshold
          const contour = this.traceContour(data, width, height, x, y, visited);
          if (contour.length > 3) { // Minimum contour length
            const pathData = this.contourToPath(contour, config.pathSimplification);
            paths.push({
              path: pathData,
              color: '#000000'
            });
          }
        }
      }
    }
    
    return paths;
  }

  private traceContour(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: boolean[]
  ): Array<{ x: number; y: number }> {
    const contour: Array<{ x: number; y: number }> = [];
    const stack = [{ x: startX, y: startY }];
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) {
        continue;
      }
      
      const pixelIdx = idx * 4;
      if (data[pixelIdx] <= 128) continue; // Not an edge
      
      visited[idx] = true;
      contour.push({ x, y });
      
      // Add neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          stack.push({ x: x + dx, y: y + dy });
        }
      }
    }
    
    return contour;
  }

  private contourToPath(
    contour: Array<{ x: number; y: number }>,
    simplificationTolerance: number
  ): string {
    if (contour.length === 0) return '';
    
    // Apply Douglas-Peucker simplification
    const simplified = this.douglasPeucker(contour, simplificationTolerance);
    
    if (simplified.length === 0) return '';
    
    let pathData = `M ${simplified[0].x} ${simplified[0].y}`;
    
    for (let i = 1; i < simplified.length; i++) {
      pathData += ` L ${simplified[i].x} ${simplified[i].y}`;
    }
    
    pathData += ' Z';
    return pathData;
  }

  private douglasPeucker(
    points: Array<{ x: number; y: number }>,
    tolerance: number
  ): Array<{ x: number; y: number }> {
    if (points.length <= 2) return points;
    
    // Find the point with maximum distance from the line
    let maxDistance = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.pointToLineDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      
      return [...left.slice(0, -1), ...right];
    } else {
      return [start, end];
    }
  }

  private pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }
    
    const param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  private async generateSVG(
    paths: Array<{ path: string; color: string }>,
    width: number,
    height: number
  ): Promise<string> {
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    for (const { path, color } of paths) {
      svg += `<path d="${path}" fill="${color}" stroke="${color}" stroke-width="1"/>`;
    }
    
    svg += '</svg>';
    return svg;
  }

  private sendProgress(jobId: string, progress: number, stage: string) {
    const response: WorkerResponse = {
      type: 'progress',
      data: { jobId, progress, stage }
    };
    self.postMessage(response);
  }

  private sendComplete(jobId: string, result: ProcessingResult) {
    const response: WorkerResponse = {
      type: 'complete',
      data: { jobId, result }
    };
    self.postMessage(response);
  }

  private sendError(jobId: string, error: string) {
    const response: WorkerResponse = {
      type: 'error',
      data: { jobId, error }
    };
    self.postMessage(response);
  }
}

// Initialize worker
new ImageProcessingWorker();