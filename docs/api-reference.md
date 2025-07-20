# API Reference

This document provides technical reference for developers who want to understand or contribute to ConvertFlow.

## Core Types

### VectorizationConfig

Configuration object for the conversion process.

```typescript
interface VectorizationConfig {
  /** Number of colors to use in quantization (2-256) */
  colorCount: number;
  
  /** Level of path smoothing */
  smoothingLevel: 'low' | 'medium' | 'high';
  
  /** Path simplification tolerance (0.1-10.0) */
  pathSimplification: number;
  
  /** Whether to preserve PNG transparency */
  preserveTransparency: boolean;
  
  /** Algorithm to use for processing */
  algorithm: 'auto' | 'shapes' | 'photo' | 'lineart';
}
```

### ProcessingResult

Result object returned after successful conversion.

```typescript
interface ProcessingResult {
  /** Generated SVG content as string */
  svgContent: string;
  
  /** Original PNG file size in bytes */
  originalSize: number;
  
  /** Generated SVG size in bytes */
  vectorSize: number;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Number of colors used in final output */
  colorCount: number;
  
  /** Number of vector paths generated */
  pathCount: number;
}
```

### ConversionJob

Represents a single conversion task.

```typescript
interface ConversionJob {
  /** Unique identifier for the job */
  id: string;
  
  /** Source PNG file */
  file: File;
  
  /** Configuration for this job */
  config: VectorizationConfig;
  
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Result data (available when status is 'completed') */
  result?: ProcessingResult;
  
  /** Error message (available when status is 'failed') */
  error?: string;
}
```

## Core Services

### ImageProcessor

Handles image loading and preprocessing.

```typescript
class ImageProcessor {
  constructor(options?: {
    maxDimensions?: { width: number; height: number };
    memoryLimit?: number;
  });
  
  /** Extract ImageData from a File */
  async extractImageData(file: File): Promise<ImageData>;
  
  /** Resize image if it exceeds maximum dimensions */
  resizeImage(imageData: ImageData, maxWidth: number, maxHeight: number): ImageData;
  
  /** Apply preprocessing filters */
  preprocess(imageData: ImageData, algorithm: AlgorithmType): ImageData;
}
```

**Usage Example:**
```typescript
const processor = new ImageProcessor({
  maxDimensions: { width: 2048, height: 2048 },
  memoryLimit: 100 * 1024 * 1024 // 100MB
});

const imageData = await processor.extractImageData(file);
const preprocessed = processor.preprocess(imageData, 'shapes');
```

### ColorQuantizer

Reduces image colors using clustering algorithms.

```typescript
class ColorQuantizer {
  /** Quantize colors using K-means clustering */
  async quantizeKMeans(imageData: ImageData, colorCount: number): Promise<ColorPalette>;
  
  /** Quantize colors using median cut algorithm */
  quantizeMedianCut(imageData: ImageData, colorCount: number): ColorPalette;
  
  /** Map image pixels to quantized palette */
  mapToQuantizedPalette(imageData: ImageData, palette: ColorPalette): ImageData;
}
```

**Usage Example:**
```typescript
const quantizer = new ColorQuantizer();
const palette = await quantizer.quantizeKMeans(imageData, 16);
const quantizedImage = quantizer.mapToQuantizedPalette(imageData, palette);
```

### EdgeDetector

Detects edges in images using computer vision algorithms.

```typescript
class EdgeDetector {
  /** Detect edges using Sobel operator */
  detectEdgesSobel(imageData: ImageData, threshold: number): EdgeData;
  
  /** Detect edges using Canny algorithm */
  detectEdgesCanny(
    imageData: ImageData, 
    lowThreshold: number, 
    highThreshold: number, 
    kernelSize?: number
  ): EdgeData;
  
  /** Apply non-maximum suppression */
  nonMaximumSuppression(gradients: GradientData): EdgeData;
}
```

**Usage Example:**
```typescript
const detector = new EdgeDetector();
const edges = detector.detectEdgesSobel(imageData, 50);
// or
const cannyEdges = detector.detectEdgesCanny(imageData, 50, 150, 3);
```

### Vectorizer

Converts edge data to vector paths.

```typescript
class Vectorizer {
  constructor(options?: {
    simplificationTolerance?: number;
    enableBezierFitting?: boolean;
  });
  
  /** Convert edge data to vector paths */
  async vectorizeEdges(edgeData: EdgeData, colorMap: Map<string, string>): Promise<VectorPath[]>;
  
  /** Trace contours from edge data */
  traceContours(edgeData: EdgeData): Contour[];
  
  /** Simplify path using Douglas-Peucker algorithm */
  simplifyPath(points: Point[], tolerance: number): Point[];
  
  /** Fit Bézier curves to path points */
  fitBezierCurves(points: Point[]): BezierCurve[];
}
```

**Usage Example:**
```typescript
const vectorizer = new Vectorizer({
  simplificationTolerance: 1.0,
  enableBezierFitting: true
});

const colorMap = new Map([
  ['color-0', 'rgb(255,0,0)'],
  ['color-1', 'rgb(0,255,0)']
]);

const paths = await vectorizer.vectorizeEdges(edgeData, colorMap);
```

### SvgGenerator

Generates SVG markup from vector paths.

```typescript
class SvgGenerator {
  constructor(options?: {
    enableOptimization?: boolean;
    groupByColor?: boolean;
    precision?: number;
  });
  
  /** Generate SVG from vector paths */
  async generateSVG(
    paths: VectorPath[], 
    width: number, 
    height: number, 
    palette: ColorPalette
  ): Promise<ProcessingResult>;
  
  /** Generate path data string from curves */
  generatePathData(curves: BezierCurve[]): string;
  
  /** Optimize SVG markup */
  optimizeSVG(svgContent: string): string;
}
```

**Usage Example:**
```typescript
const generator = new SvgGenerator({
  enableOptimization: true,
  groupByColor: true,
  precision: 2
});

const result = await generator.generateSVG(paths, 800, 600, palette);
console.log(result.svgContent);
```

## Utility Functions

### File Validation

```typescript
/** Validate PNG files */
function validatePngFiles(
  files: File[], 
  options?: {
    maxFiles?: number;
    maxFileSize?: number;
  }
): ValidationResult;

/** Check PNG file integrity */
async function checkPngIntegrity(file: File): Promise<boolean>;

/** Format file size for display */
function formatFileSize(bytes: number): string;
```

### Error Handling

```typescript
/** Higher-order function for file validation */
function withFileValidation<T>(
  fn: () => Promise<T>, 
  file?: File
): Promise<T>;

/** Higher-order function for image processing */
function withImageProcessing<T>(
  fn: () => Promise<T>,
  context: ProcessingContext
): Promise<T>;

/** Higher-order function for SVG generation */
function withSvgGeneration<T>(
  fn: () => Promise<T>,
  context: GenerationContext
): Promise<T>;

/** Check browser compatibility */
function checkBrowserCompatibility(): ConversionError | null;
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  /** Start monitoring a process */
  startMonitoring(processName: string): void;
  
  /** End monitoring and record metrics */
  endMonitoring(processName: string): PerformanceMetrics;
  
  /** Generate performance report */
  generateReport(imageData: ImageData, result: ProcessingResult): string;
  
  /** Get memory usage information */
  getMemoryUsage(): MemoryInfo | null;
}
```

## Web Worker Integration

### WorkerManager

```typescript
class WorkerManager {
  /** Check if Web Workers are supported */
  isWorkerSupported(): boolean;
  
  /** Process image in Web Worker */
  async processImage(
    imageData: ImageData,
    config: VectorizationConfig,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ProcessingResult>;
  
  /** Terminate all active workers */
  terminateWorkers(): void;
}
```

### Worker Messages

Messages sent to/from Web Workers:

```typescript
// Message to worker
interface WorkerRequest {
  type: 'process';
  imageData: ImageData;
  config: VectorizationConfig;
}

// Message from worker
interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  result?: ProcessingResult;
  progress?: { stage: string; percentage: number };
  error?: string;
}
```

## Error Types

### ConversionError

```typescript
class ConversionError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public recoverable: boolean = true,
    public context?: any
  );
}

type ErrorType = 
  | 'file_validation'
  | 'image_processing' 
  | 'memory_limit'
  | 'browser_compatibility'
  | 'processing_timeout'
  | 'svg_generation';
```

## Configuration Constants

```typescript
// Default configuration
const DEFAULT_CONFIG: VectorizationConfig = {
  colorCount: 16,
  smoothingLevel: 'medium',
  pathSimplification: 1.0,
  preserveTransparency: true,
  algorithm: 'auto'
};

// Processing limits
const PROCESSING_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BATCH_SIZE: 20,
  MAX_DIMENSIONS: { width: 4096, height: 4096 },
  MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB
  PROCESSING_TIMEOUT: 60000 // 60 seconds
};

// Algorithm settings
const ALGORITHM_SETTINGS = {
  shapes: {
    edgeThreshold: 50,
    colorReduction: 'aggressive',
    pathSimplification: 'high'
  },
  photo: {
    edgeThreshold: 30,
    colorReduction: 'gentle',
    pathSimplification: 'low'
  },
  lineart: {
    edgeThreshold: 80,
    colorReduction: 'minimal',
    pathSimplification: 'medium'
  }
};
```

## Event System

### Progress Events

```typescript
interface ProgressEvent {
  stage: 'upload' | 'preprocess' | 'quantize' | 'vectorize' | 'generate';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
}
```

### Error Events

```typescript
interface ErrorEvent {
  error: ConversionError;
  jobId: string;
  recoverable: boolean;
  context?: any;
}
```

## Testing Utilities

### Mock Data Generators

```typescript
/** Generate test ImageData */
function createTestImageData(width: number, height: number, pattern?: 'solid' | 'gradient' | 'noise'): ImageData;

/** Generate test configuration */
function createTestConfig(overrides?: Partial<VectorizationConfig>): VectorizationConfig;

/** Generate test file */
function createTestFile(name: string, size: number, type?: string): File;
```

### Test Helpers

```typescript
/** Wait for processing to complete */
async function waitForProcessing(job: ConversionJob, timeout?: number): Promise<ProcessingResult>;

/** Validate SVG output */
function validateSvgOutput(svgContent: string): ValidationResult;

/** Compare processing results */
function compareResults(result1: ProcessingResult, result2: ProcessingResult): ComparisonResult;
```

## Browser Compatibility

### Required APIs

- **Canvas API**: For image processing
- **Web Workers**: For background processing (optional)
- **File API**: For file handling
- **Blob API**: For file downloads
- **Promise API**: For async operations

### Feature Detection

```typescript
function checkFeatureSupport(): FeatureSupport {
  return {
    canvas: typeof HTMLCanvasElement !== 'undefined',
    webWorkers: typeof Worker !== 'undefined',
    fileApi: typeof File !== 'undefined',
    blobApi: typeof Blob !== 'undefined',
    imageData: typeof ImageData !== 'undefined'
  };
}
```

## Performance Considerations

### Memory Management

- Images are processed in chunks to prevent memory overflow
- Automatic garbage collection triggers for large operations
- Memory usage monitoring with warnings

### Processing Optimization

- Web Workers prevent UI blocking
- Progressive rendering for large images
- Intelligent algorithm selection based on image characteristics

### File Size Optimization

- Path simplification reduces SVG complexity
- Color quantization minimizes palette size
- Optional SVG optimization removes redundant data

## Contributing

### Adding New Algorithms

1. Implement the algorithm interface:
```typescript
interface VectorizationAlgorithm {
  name: string;
  process(imageData: ImageData, config: VectorizationConfig): Promise<VectorPath[]>;
}
```

2. Register the algorithm:
```typescript
AlgorithmRegistry.register('myAlgorithm', new MyAlgorithm());
```

3. Add tests and documentation

### Extending Configuration

1. Update the `VectorizationConfig` interface
2. Add validation logic
3. Update the UI components
4. Add tests for new options

For more details, see the [Contributing Guide](./contributing.md).