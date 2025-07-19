/**
 * Algorithm-specific type definitions for vectorization
 */

export interface ColorPalette {
  /** Array of RGB color values */
  colors: Array<{r: number, g: number, b: number, a?: number}>;
  /** Color frequency/weight information */
  weights?: number[];
}

export interface EdgeData {
  /** Edge magnitude values */
  magnitude: Float32Array;
  /** Edge direction values in radians */
  direction: Float32Array;
  /** Image dimensions */
  width: number;
  height: number;
  /** Edge detection algorithm used */
  algorithm?: 'sobel' | 'canny';
  /** Processing parameters used */
  parameters?: {
    threshold?: number;
    lowThreshold?: number;
    highThreshold?: number;
    gaussianKernelSize?: number;
  };
}

export interface VectorPath {
  /** SVG path data string */
  pathData: string;
  /** Fill color for this path */
  fillColor: string;
  /** Stroke color if applicable */
  strokeColor?: string;
  /** Stroke width if applicable */
  strokeWidth?: number;
  /** Path complexity score */
  complexity: number;
}

export interface ContourPoint {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Whether this is a curve control point */
  isControlPoint?: boolean;
}

export interface Contour {
  /** Array of points defining the contour */
  points: ContourPoint[];
  /** Whether the contour is closed */
  closed: boolean;
  /** Contour length in pixels */
  length: number;
  /** Bounding box of the contour */
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface ProcessingOptions {
  /** Maximum image dimensions for processing */
  maxDimensions: {width: number, height: number};
  /** Memory usage limits */
  memoryLimit: number;
  /** Processing timeout in milliseconds */
  timeout: number;
  /** Whether to use Web Workers */
  useWebWorkers: boolean;
}

export interface AlgorithmMetrics {
  /** Processing time for each stage */
  timings: {
    preprocessing: number;
    quantization: number;
    edgeDetection: number;
    vectorization: number;
    svgGeneration: number;
  };
  /** Memory usage statistics */
  memoryUsage: {
    peak: number;
    average: number;
  };
  /** Quality metrics */
  quality: {
    colorAccuracy: number;
    edgePreservation: number;
    pathEfficiency: number;
  };
}