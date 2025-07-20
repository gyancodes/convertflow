# ConvertFlow Algorithms

This document explains the technical details of the vectorization algorithms used in ConvertFlow.

## Overview

ConvertFlow uses a multi-stage pipeline to convert PNG images to SVG vectors:

1. **Image Preprocessing**: Loading and preparing the image data
2. **Color Quantization**: Reducing colors using clustering algorithms
3. **Edge Detection**: Finding boundaries using computer vision techniques
4. **Path Generation**: Converting edges to vector paths
5. **SVG Optimization**: Creating optimized SVG markup

## Algorithm Selection

### Auto Algorithm

The Auto algorithm analyzes image characteristics to choose the optimal processing method:

```typescript
function selectAlgorithm(imageData: ImageData): AlgorithmType {
  const analysis = analyzeImage(imageData);
  
  if (analysis.hasSharpEdges && analysis.colorCount < 16) {
    return 'shapes';
  } else if (analysis.hasGradients && analysis.colorCount > 32) {
    return 'photo';
  } else if (analysis.isLineArt) {
    return 'lineart';
  }
  
  return 'shapes'; // Default fallback
}
```

**Analysis Factors:**
- Edge sharpness and clarity
- Color distribution and count
- Gradient presence
- Line art characteristics
- Image complexity metrics

### Shapes Algorithm

Optimized for logos, icons, and geometric graphics.

**Key Features:**
- Aggressive edge detection
- Color clustering with K-means
- Path simplification emphasis
- Clean geometric path generation

**Processing Pipeline:**
1. **Preprocessing**: Noise reduction and contrast enhancement
2. **Color Quantization**: K-means clustering (typically 8-16 colors)
3. **Edge Detection**: Sobel operator with high threshold
4. **Contour Tracing**: Moore neighborhood tracing
5. **Path Simplification**: Douglas-Peucker algorithm
6. **Curve Fitting**: Bézier curve approximation

### Photo Algorithm

Designed for photographic content and complex images.

**Key Features:**
- Gentle edge detection
- Preserves color gradients
- Higher color fidelity
- Smooth path generation

**Processing Pipeline:**
1. **Preprocessing**: Gaussian blur for noise reduction
2. **Color Quantization**: Modified K-means with perceptual weighting
3. **Edge Detection**: Canny edge detection with adaptive thresholds
4. **Multi-scale Processing**: Different scales for different detail levels
5. **Path Generation**: Smooth curve fitting
6. **Color Interpolation**: Gradient preservation techniques

### LineArt Algorithm

Specialized for drawings, sketches, and technical diagrams.

**Key Features:**
- High-contrast edge detection
- Minimal color processing
- Emphasis on line continuity
- Stroke-based vectorization

**Processing Pipeline:**
1. **Preprocessing**: Contrast enhancement and binarization
2. **Skeletonization**: Thinning algorithm for line extraction
3. **Line Tracing**: Specialized line following algorithms
4. **Junction Detection**: Handling line intersections
5. **Stroke Reconstruction**: Converting pixels to strokes
6. **Path Optimization**: Stroke-aware simplification

## Core Algorithms

### Color Quantization

#### K-Means Clustering

```typescript
class ColorQuantizer {
  quantizeKMeans(imageData: ImageData, k: number): ColorPalette {
    // Initialize centroids
    let centroids = this.initializeCentroids(imageData, k);
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Assign pixels to nearest centroid
      const assignments = this.assignPixels(imageData, centroids);
      
      // Update centroids
      const newCentroids = this.updateCentroids(assignments);
      
      // Check convergence
      if (this.hasConverged(centroids, newCentroids)) {
        break;
      }
      
      centroids = newCentroids;
    }
    
    return this.createPalette(centroids);
  }
}
```

**Features:**
- Perceptual color distance (LAB color space)
- Smart initialization (K-means++)
- Convergence detection
- Outlier handling

#### Median Cut Algorithm

Alternative quantization method for specific use cases:

```typescript
medianCut(colors: Color[], depth: number): Color[] {
  if (depth === 0 || colors.length <= 1) {
    return [this.averageColor(colors)];
  }
  
  // Find dimension with largest range
  const dimension = this.findLargestDimension(colors);
  
  // Sort by that dimension
  colors.sort((a, b) => a[dimension] - b[dimension]);
  
  // Split at median
  const median = Math.floor(colors.length / 2);
  const left = colors.slice(0, median);
  const right = colors.slice(median);
  
  // Recursively quantize
  return [
    ...this.medianCut(left, depth - 1),
    ...this.medianCut(right, depth - 1)
  ];
}
```

### Edge Detection

#### Sobel Operator

```typescript
class EdgeDetector {
  detectEdgesSobel(imageData: ImageData, threshold: number): EdgeData {
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];
    
    const sobelY = [
      [-1, -2, -1],
      [ 0,  0,  0],
      [ 1,  2,  1]
    ];
    
    const edges = new Float32Array(imageData.width * imageData.height);
    
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const gx = this.convolve(imageData, x, y, sobelX);
        const gy = this.convolve(imageData, x, y, sobelY);
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * imageData.width + x] = magnitude > threshold ? magnitude : 0;
      }
    }
    
    return { edges, width: imageData.width, height: imageData.height };
  }
}
```

#### Canny Edge Detection

More sophisticated edge detection for the Photo algorithm:

```typescript
detectEdgesCanny(imageData: ImageData, lowThreshold: number, highThreshold: number): EdgeData {
  // 1. Gaussian blur
  const blurred = this.gaussianBlur(imageData, 1.4);
  
  // 2. Gradient calculation
  const gradients = this.calculateGradients(blurred);
  
  // 3. Non-maximum suppression
  const suppressed = this.nonMaximumSuppression(gradients);
  
  // 4. Double thresholding
  const thresholded = this.doubleThreshold(suppressed, lowThreshold, highThreshold);
  
  // 5. Edge tracking by hysteresis
  return this.hysteresisTracking(thresholded);
}
```

### Path Generation

#### Contour Tracing

```typescript
class Vectorizer {
  traceContours(edgeData: EdgeData): Contour[] {
    const contours: Contour[] = [];
    const visited = new Set<string>();
    
    for (let y = 0; y < edgeData.height; y++) {
      for (let x = 0; x < edgeData.width; x++) {
        const key = `${x},${y}`;
        
        if (edgeData.edges[y * edgeData.width + x] > 0 && !visited.has(key)) {
          const contour = this.traceContour(edgeData, x, y, visited);
          if (contour.length > minContourLength) {
            contours.push(contour);
          }
        }
      }
    }
    
    return contours;
  }
  
  traceContour(edgeData: EdgeData, startX: number, startY: number, visited: Set<string>): Point[] {
    const contour: Point[] = [];
    const directions = [
      [0, -1], [1, -1], [1, 0], [1, 1],
      [0, 1], [-1, 1], [-1, 0], [-1, -1]
    ];
    
    let x = startX, y = startY;
    let direction = 0;
    
    do {
      contour.push({ x, y });
      visited.add(`${x},${y}`);
      
      // Find next edge pixel
      const next = this.findNextEdgePixel(edgeData, x, y, direction, directions);
      if (!next) break;
      
      x = next.x;
      y = next.y;
      direction = next.direction;
      
    } while (x !== startX || y !== startY);
    
    return contour;
  }
}
```

#### Path Simplification

Douglas-Peucker algorithm for reducing path complexity:

```typescript
simplifyPath(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;
  
  // Find the point with maximum distance from line segment
  let maxDistance = 0;
  let maxIndex = 0;
  
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = this.perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = this.simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = this.simplifyPath(points.slice(maxIndex), tolerance);
    
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}
```

#### Bézier Curve Fitting

Converting simplified paths to smooth curves:

```typescript
fitBezierCurves(points: Point[]): BezierCurve[] {
  const curves: BezierCurve[] = [];
  
  for (let i = 0; i < points.length - 1; i += 3) {
    const p0 = points[i];
    const p1 = points[i + 1] || this.interpolatePoint(points[i], points[i + 2] || points[i], 0.33);
    const p2 = points[i + 2] || this.interpolatePoint(points[i], points[i + 3] || points[i], 0.67);
    const p3 = points[i + 3] || points[points.length - 1];
    
    curves.push({ p0, p1, p2, p3 });
  }
  
  return this.optimizeCurves(curves);
}
```

### SVG Generation

#### Path Data Generation

```typescript
class SvgGenerator {
  generatePathData(curves: BezierCurve[]): string {
    if (curves.length === 0) return '';
    
    let pathData = `M ${curves[0].p0.x} ${curves[0].p0.y}`;
    
    for (const curve of curves) {
      if (this.isLinear(curve)) {
        pathData += ` L ${curve.p3.x} ${curve.p3.y}`;
      } else {
        pathData += ` C ${curve.p1.x} ${curve.p1.y} ${curve.p2.x} ${curve.p2.y} ${curve.p3.x} ${curve.p3.y}`;
      }
    }
    
    return pathData + ' Z';
  }
  
  generateSVG(paths: VectorPath[], width: number, height: number, palette: ColorPalette): string {
    const pathElements = paths.map(path => 
      `<path d="${this.generatePathData(path.curves)}" fill="${path.color}" />`
    ).join('\n  ');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${pathElements}
</svg>`;
  }
}
```

## Performance Optimizations

### Memory Management

```typescript
class MemoryManager {
  private memoryThreshold = 100 * 1024 * 1024; // 100MB
  
  checkMemoryUsage(): boolean {
    if ('memory' in performance) {
      const used = (performance as any).memory.usedJSHeapSize;
      return used < this.memoryThreshold;
    }
    return true; // Assume OK if can't measure
  }
  
  optimizeForMemory(imageData: ImageData): ImageData {
    const maxDimension = 2048;
    if (imageData.width > maxDimension || imageData.height > maxDimension) {
      return this.resizeImage(imageData, maxDimension);
    }
    return imageData;
  }
}
```

### Web Worker Integration

```typescript
class WorkerManager {
  async processImage(imageData: ImageData, config: VectorizationConfig): Promise<ProcessingResult> {
    if (!this.isWorkerSupported()) {
      return this.processInMainThread(imageData, config);
    }
    
    return new Promise((resolve, reject) => {
      const worker = new Worker('/workers/vectorization-worker.js');
      
      worker.postMessage({
        imageData: imageData,
        config: config
      });
      
      worker.onmessage = (event) => {
        if (event.data.type === 'result') {
          resolve(event.data.result);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.error));
        }
      };
      
      worker.onerror = (error) => {
        reject(error);
      };
    });
  }
}
```

## Algorithm Comparison

| Feature | Shapes | Photo | LineArt |
|---------|--------|-------|---------|
| **Best For** | Logos, Icons | Photos, Complex Images | Drawings, Sketches |
| **Edge Detection** | Sobel (High Threshold) | Canny (Adaptive) | High Contrast |
| **Color Handling** | Aggressive Quantization | Gradient Preservation | Minimal Colors |
| **Path Style** | Geometric, Sharp | Smooth, Organic | Linear, Precise |
| **File Size** | Small | Medium-Large | Small-Medium |
| **Processing Speed** | Fast | Slow | Medium |
| **Detail Level** | Low-Medium | High | Medium |

## Future Improvements

### Planned Algorithm Enhancements

1. **Machine Learning Integration**
   - Neural network-based edge detection
   - Learned color quantization
   - Automatic parameter optimization

2. **Advanced Vectorization**
   - Gradient mesh support
   - Pattern recognition
   - Text detection and preservation

3. **Performance Optimizations**
   - GPU acceleration (WebGL)
   - Streaming processing for large images
   - Progressive rendering

4. **Quality Improvements**
   - Better curve fitting algorithms
   - Perceptual quality metrics
   - Adaptive processing based on image content

## Technical References

- **Douglas-Peucker Algorithm**: Ramer, U. (1972). "An iterative procedure for the polygonal approximation of plane curves"
- **K-Means Clustering**: Lloyd, S. (1982). "Least squares quantization in PCM"
- **Canny Edge Detection**: Canny, J. (1986). "A computational approach to edge detection"
- **Bézier Curves**: Bézier, P. (1970). "Emploi des machines à commande numérique"

For more technical details, see the source code in the `/src/services/` directory.