import { EdgeData, ContourPoint } from "../types/vectorization";

/**
 * Edge detection algorithms for image processing
 */
export class EdgeDetector {
  /**
   * Apply Sobel edge detection algorithm
   * @param imageData - Input image data
   * @param threshold - Edge threshold (0-255)
   * @returns Edge data with magnitude and direction
   */
  async detectEdgesSobel(
    imageData: ImageData,
    threshold: number = 50
  ): Promise<EdgeData> {
    const { width, height } = imageData;
    const grayscale = this.convertToGrayscale(imageData);
    
    const magnitude = new Float32Array(width * height);
    const direction = new Float32Array(width * height);

    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        // Apply Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = (y + ky) * width + (x + kx);
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            
            gx += grayscale[pixelIndex] * sobelX[kernelIndex];
            gy += grayscale[pixelIndex] * sobelY[kernelIndex];
          }
        }

        const index = y * width + x;
        const mag = Math.sqrt(gx * gx + gy * gy);
        
        magnitude[index] = mag > threshold ? mag : 0;
        direction[index] = Math.atan2(gy, gx);
      }
    }

    return { 
      magnitude, 
      direction, 
      width, 
      height,
      algorithm: 'sobel',
      parameters: { threshold }
    };
  }

  /**
   * Apply Canny edge detection algorithm
   * @param imageData - Input image data
   * @param lowThreshold - Low threshold for hysteresis
   * @param highThreshold - High threshold for hysteresis
   * @param gaussianKernelSize - Size of Gaussian blur kernel
   * @returns Edge data with magnitude and direction
   */
  async detectEdgesCanny(
    imageData: ImageData,
    lowThreshold: number = 50,
    highThreshold: number = 150,
    gaussianKernelSize: number = 5
  ): Promise<EdgeData> {
    const { width, height } = imageData;
    
    // Step 1: Apply Gaussian blur
    const blurred = this.applyGaussianBlur(imageData, gaussianKernelSize);
    const grayscale = this.convertToGrayscale(blurred);

    // Step 2: Calculate gradients using Sobel
    const { magnitude: gradMag, direction: gradDir } = await this.calculateGradients(grayscale, width, height);

    // Step 3: Non-maximum suppression
    const suppressed = this.nonMaximumSuppression(gradMag, gradDir, width, height);

    // Step 4: Double threshold and hysteresis
    const edges = this.hysteresisThresholding(suppressed, width, height, lowThreshold, highThreshold);

    return {
      magnitude: edges,
      direction: gradDir,
      width,
      height,
      algorithm: 'canny',
      parameters: { 
        lowThreshold, 
        highThreshold, 
        gaussianKernelSize 
      }
    };
  }

  /**
   * Follow contours to trace boundaries
   * @param edgeData - Edge detection results
   * @param minContourLength - Minimum contour length to keep
   * @returns Array of contour paths
   */
  followContours(
    edgeData: EdgeData,
    minContourLength: number = 10
  ): ContourPoint[][] {
    const { magnitude, width, height } = edgeData;
    const visited = new Array(width * height).fill(false);
    const contours: ContourPoint[][] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        
        if (magnitude[index] > 0 && !visited[index]) {
          const contour = this.traceContour(magnitude, visited, x, y, width, height);
          
          if (contour.length >= minContourLength) {
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  /**
   * Simplify contours using Douglas-Peucker algorithm
   * @param contour - Input contour points
   * @param tolerance - Simplification tolerance
   * @returns Simplified contour
   */
  simplifyContour(contour: ContourPoint[], tolerance: number = 1.0): ContourPoint[] {
    if (contour.length <= 2) {
      return contour;
    }

    return this.douglasPeucker(contour, tolerance);
  }

  // Private helper methods

  private convertToGrayscale(imageData: ImageData): Float32Array {
    const { width, height, data } = imageData;
    const grayscale = new Float32Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      grayscale[i / 4] = gray;
    }

    return grayscale;
  }

  private applyGaussianBlur(imageData: ImageData, kernelSize: number): ImageData {
    const { width, height, data } = imageData;
    const newImageData = new ImageData(width, height);
    const newData = newImageData.data;

    // Generate Gaussian kernel
    const kernel = this.generateGaussianKernel(kernelSize);
    const radius = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let weightSum = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const pixelIndex = (py * width + px) * 4;
            const kernelIndex = (ky + radius) * kernelSize + (kx + radius);
            const weight = kernel[kernelIndex];

            r += data[pixelIndex] * weight;
            g += data[pixelIndex + 1] * weight;
            b += data[pixelIndex + 2] * weight;
            a += data[pixelIndex + 3] * weight;
            weightSum += weight;
          }
        }

        const outputIndex = (y * width + x) * 4;
        newData[outputIndex] = r / weightSum;
        newData[outputIndex + 1] = g / weightSum;
        newData[outputIndex + 2] = b / weightSum;
        newData[outputIndex + 3] = a / weightSum;
      }
    }

    return newImageData;
  }

  private generateGaussianKernel(size: number): Float32Array {
    const kernel = new Float32Array(size * size);
    const sigma = size / 3;
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        kernel[y * size + x] = value;
        sum += value;
      }
    }

    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  private async calculateGradients(
    grayscale: Float32Array,
    width: number,
    height: number
  ): Promise<{ magnitude: Float32Array; direction: Float32Array }> {
    const magnitude = new Float32Array(width * height);
    const direction = new Float32Array(width * height);

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = (y + ky) * width + (x + kx);
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            
            gx += grayscale[pixelIndex] * sobelX[kernelIndex];
            gy += grayscale[pixelIndex] * sobelY[kernelIndex];
          }
        }

        const index = y * width + x;
        magnitude[index] = Math.sqrt(gx * gx + gy * gy);
        direction[index] = Math.atan2(gy, gx);
      }
    }

    return { magnitude, direction };
  }

  private nonMaximumSuppression(
    magnitude: Float32Array,
    direction: Float32Array,
    width: number,
    height: number
  ): Float32Array {
    const suppressed = new Float32Array(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const angle = direction[index];
        const mag = magnitude[index];

        // Convert angle to 0-180 degrees
        let normalizedAngle = (angle * 180 / Math.PI) % 180;
        if (normalizedAngle < 0) normalizedAngle += 180;

        let neighbor1Index, neighbor2Index;

        // Determine neighbors based on gradient direction
        if ((normalizedAngle >= 0 && normalizedAngle < 22.5) || (normalizedAngle >= 157.5 && normalizedAngle <= 180)) {
          // Horizontal edge
          neighbor1Index = y * width + (x - 1);
          neighbor2Index = y * width + (x + 1);
        } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
          // Diagonal edge (/)
          neighbor1Index = (y - 1) * width + (x + 1);
          neighbor2Index = (y + 1) * width + (x - 1);
        } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
          // Vertical edge
          neighbor1Index = (y - 1) * width + x;
          neighbor2Index = (y + 1) * width + x;
        } else {
          // Diagonal edge (\)
          neighbor1Index = (y - 1) * width + (x - 1);
          neighbor2Index = (y + 1) * width + (x + 1);
        }

        // Suppress if not local maximum
        if (mag >= magnitude[neighbor1Index] && mag >= magnitude[neighbor2Index]) {
          suppressed[index] = mag;
        }
      }
    }

    return suppressed;
  }

  private hysteresisThresholding(
    magnitude: Float32Array,
    width: number,
    height: number,
    lowThreshold: number,
    highThreshold: number
  ): Float32Array {
    const edges = new Float32Array(width * height);
    const visited = new Array(width * height).fill(false);

    // Mark strong edges
    for (let i = 0; i < magnitude.length; i++) {
      if (magnitude[i] >= highThreshold) {
        edges[i] = magnitude[i];
      }
    }

    // Follow weak edges connected to strong edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        
        if (edges[index] > 0 && !visited[index]) {
          this.followWeakEdges(magnitude, edges, visited, x, y, width, height, lowThreshold);
        }
      }
    }

    return edges;
  }

  private followWeakEdges(
    magnitude: Float32Array,
    edges: Float32Array,
    visited: boolean[],
    x: number,
    y: number,
    width: number,
    height: number,
    lowThreshold: number
  ): void {
    const stack: Array<{ x: number; y: number }> = [{ x, y }];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const index = current.y * width + current.x;

      if (visited[index]) continue;
      visited[index] = true;

      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = current.x + dx;
          const ny = current.y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborIndex = ny * width + nx;
            
            if (!visited[neighborIndex] && magnitude[neighborIndex] >= lowThreshold) {
              edges[neighborIndex] = magnitude[neighborIndex];
              stack.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
  }

  private traceContour(
    magnitude: Float32Array,
    visited: boolean[],
    startX: number,
    startY: number,
    width: number,
    height: number
  ): ContourPoint[] {
    const contour: ContourPoint[] = [];
    const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const index = current.y * width + current.x;

      if (visited[index]) continue;
      visited[index] = true;

      contour.push({ x: current.x, y: current.y });

      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = current.x + dx;
          const ny = current.y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborIndex = ny * width + nx;
            
            if (!visited[neighborIndex] && magnitude[neighborIndex] > 0) {
              stack.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    return contour;
  }

  private douglasPeucker(points: ContourPoint[], tolerance: number): ContourPoint[] {
    if (points.length <= 2) {
      return points;
    }

    // Find the point with maximum distance from line between first and last points
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
      const leftSegment = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const rightSegment = this.douglasPeucker(points.slice(maxIndex), tolerance);
      
      // Combine segments (remove duplicate point at junction)
      return [...leftSegment.slice(0, -1), ...rightSegment];
    } else {
      // All points are within tolerance, return just endpoints
      return [start, end];
    }
  }

  private pointToLineDistance(point: ContourPoint, lineStart: ContourPoint, lineEnd: ContourPoint): number {
    const A = lineEnd.x - lineStart.x;
    const B = lineEnd.y - lineStart.y;
    const C = point.x - lineStart.x;
    const D = point.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = A * A + B * B;
    
    if (lenSq === 0) {
      // Line start and end are the same point
      return Math.sqrt(C * C + D * D);
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
      xx = lineStart.x + param * A;
      yy = lineStart.y + param * B;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get edge statistics for analysis
   * @param edgeData - Edge detection results
   * @returns Statistics about the detected edges
   */
  getEdgeStatistics(edgeData: EdgeData): {
    totalEdgePixels: number;
    averageMagnitude: number;
    maxMagnitude: number;
    edgeDensity: number;
  } {
    const { magnitude, width, height } = edgeData;
    let totalEdgePixels = 0;
    let totalMagnitude = 0;
    let maxMagnitude = 0;

    for (let i = 0; i < magnitude.length; i++) {
      if (magnitude[i] > 0) {
        totalEdgePixels++;
        totalMagnitude += magnitude[i];
        maxMagnitude = Math.max(maxMagnitude, magnitude[i]);
      }
    }

    const averageMagnitude = totalEdgePixels > 0 ? totalMagnitude / totalEdgePixels : 0;
    const edgeDensity = totalEdgePixels / (width * height);

    return {
      totalEdgePixels,
      averageMagnitude,
      maxMagnitude,
      edgeDensity
    };
  }

  /**
   * Convert edge data to binary edge map
   * @param edgeData - Edge detection results
   * @param threshold - Threshold for binary conversion
   * @returns Binary edge map as ImageData
   */
  toBinaryEdgeMap(edgeData: EdgeData, threshold: number = 0): ImageData {
    const { magnitude, width, height } = edgeData;
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < magnitude.length; i++) {
      const isEdge = magnitude[i] > threshold;
      const color = isEdge ? 255 : 0;
      
      data[i * 4] = color;     // R
      data[i * 4 + 1] = color; // G
      data[i * 4 + 2] = color; // B
      data[i * 4 + 3] = 255;   // A
    }

    return imageData;
  }
}

export default EdgeDetector;