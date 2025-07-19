import { VectorizationConfig } from '../types/converter';
import { EdgeData, ColorPalette, VectorPath } from '../types/vectorization';
import { ColorQuantizer } from './colorQuantizer';
import { EdgeDetector } from './edgeDetector';
import { Vectorizer } from './vectorizer';

/**
 * Base class for algorithm-specific processors
 */
abstract class AlgorithmProcessor {
  protected colorQuantizer: ColorQuantizer;
  protected edgeDetector: EdgeDetector;
  protected vectorizer: Vectorizer;

  constructor() {
    this.colorQuantizer = new ColorQuantizer();
    this.edgeDetector = new EdgeDetector();
    this.vectorizer = new Vectorizer();
  }

  abstract processImage(
    imageData: ImageData,
    config: VectorizationConfig
  ): Promise<{
    palette: ColorPalette;
    edges: EdgeData;
    paths: VectorPath[];
  }>;
}

/**
 * Shape detection algorithm for simple graphics with geometric shape recognition
 */
export class ShapeProcessor extends AlgorithmProcessor {
  constructor() {
    super();
    // Configure for shape detection
    this.vectorizer = new Vectorizer({
      simplificationTolerance: 2.0, // Higher tolerance for cleaner shapes
      enableBezierFitting: false, // Use linear paths for geometric shapes
      minContourLength: 8 // Longer minimum for meaningful shapes
    });
  }

  async processImage(
    imageData: ImageData,
    config: VectorizationConfig
  ): Promise<{
    palette: ColorPalette;
    edges: EdgeData;
    paths: VectorPath[];
  }> {
    // Step 1: Aggressive color quantization for simple graphics
    const palette = await this.colorQuantizer.quantizeColors(
      imageData,
      Math.min(config.colorCount, 16) // Limit colors for shape detection
    );

    // Step 2: Apply color quantization to image
    const quantizedImage = this.applyColorQuantization(imageData, palette);

    // Step 3: Edge detection optimized for shapes
    const edges = await this.edgeDetector.detectEdges(quantizedImage, {
      algorithm: 'sobel',
      threshold: 0.3, // Higher threshold for cleaner edges
      gaussianBlur: false // Skip blur for sharp edges
    });

    // Step 4: Detect geometric shapes
    const enhancedEdges = this.enhanceShapeEdges(edges);

    // Step 5: Vectorize with shape-specific settings
    const colorMap = this.createColorMap(palette);
    const paths = await this.vectorizer.vectorizeEdges(enhancedEdges, colorMap);

    // Step 6: Post-process paths for shape optimization
    const optimizedPaths = this.optimizeShapePaths(paths);

    return {
      palette,
      edges: enhancedEdges,
      paths: optimizedPaths
    };
  }

  /**
   * Enhance edges for better shape detection
   */
  private enhanceShapeEdges(edges: EdgeData): EdgeData {
    const { magnitude, direction, width, height } = edges;
    const enhanced = new Float32Array(magnitude.length);

    // Apply morphological operations to clean up edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        
        // Check for strong horizontal/vertical edges (typical in shapes)
        const angle = direction[index];
        const isCardinal = this.isCardinalDirection(angle);
        
        if (isCardinal) {
          enhanced[index] = Math.min(magnitude[index] * 1.2, 1.0);
        } else {
          enhanced[index] = magnitude[index] * 0.8;
        }
      }
    }

    return {
      magnitude: enhanced,
      direction,
      width,
      height,
      algorithm: 'sobel',
      parameters: { threshold: 0.3 }
    };
  }

  /**
   * Check if angle is close to cardinal directions (0, 90, 180, 270 degrees)
   */
  private isCardinalDirection(angle: number): boolean {
    const normalizedAngle = ((angle * 180 / Math.PI) + 360) % 360;
    const tolerance = 15; // degrees
    
    return (
      Math.abs(normalizedAngle) < tolerance ||
      Math.abs(normalizedAngle - 90) < tolerance ||
      Math.abs(normalizedAngle - 180) < tolerance ||
      Math.abs(normalizedAngle - 270) < tolerance ||
      Math.abs(normalizedAngle - 360) < tolerance
    );
  }

  /**
   * Optimize paths for geometric shapes
   */
  private optimizeShapePaths(paths: VectorPath[]): VectorPath[] {
    return paths.map(path => {
      // Detect and optimize common geometric shapes
      const optimizedPathData = this.detectAndOptimizeShapes(path.pathData);
      
      return {
        ...path,
        pathData: optimizedPathData,
        complexity: this.calculateShapeComplexity(optimizedPathData)
      };
    });
  }

  /**
   * Detect and optimize common geometric shapes
   */
  private detectAndOptimizeShapes(pathData: string): string {
    // Simple rectangle detection and optimization
    if (this.isRectanglePath(pathData)) {
      return this.optimizeRectangle(pathData);
    }
    
    // Simple circle detection and optimization
    if (this.isCirclePath(pathData)) {
      return this.optimizeCircle(pathData);
    }
    
    return pathData;
  }

  /**
   * Check if path represents a rectangle
   */
  private isRectanglePath(pathData: string): boolean {
    const commands = pathData.match(/[MLHVCSQTAZ]/gi) || [];
    const coordinates = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g) || [];
    
    // Simple heuristic: 4-5 commands (M + 3-4 L + Z) with 8 coordinates
    return commands.length >= 4 && commands.length <= 5 && coordinates.length === 8;
  }

  /**
   * Check if path represents a circle
   */
  private isCirclePath(pathData: string): boolean {
    // Look for multiple curve commands which might indicate a circle
    const curveCommands = (pathData.match(/[CSQ]/gi) || []).length;
    return curveCommands >= 3;
  }

  /**
   * Optimize rectangle path
   */
  private optimizeRectangle(pathData: string): string {
    // Extract coordinates and create clean rectangle
    const coords = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g) || [];
    if (coords.length >= 8) {
      const x1 = parseFloat(coords[0]);
      const y1 = parseFloat(coords[1]);
      const x2 = parseFloat(coords[2]);
      const y2 = parseFloat(coords[3]);
      const x3 = parseFloat(coords[4]);
      const y3 = parseFloat(coords[5]);
      const x4 = parseFloat(coords[6]);
      const y4 = parseFloat(coords[7]);
      
      // Create clean rectangle
      const minX = Math.min(x1, x2, x3, x4);
      const maxX = Math.max(x1, x2, x3, x4);
      const minY = Math.min(y1, y2, y3, y4);
      const maxY = Math.max(y1, y2, y3, y4);
      
      return `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
    }
    
    return pathData;
  }

  /**
   * Optimize circle path
   */
  private optimizeCircle(pathData: string): string {
    // For now, return original path - circle optimization is complex
    // In a full implementation, this would detect center and radius
    return pathData;
  }

  /**
   * Calculate shape-specific complexity
   */
  private calculateShapeComplexity(pathData: string): number {
    const commands = pathData.match(/[MLHVCSQTAZ]/gi) || [];
    // Shapes should have low complexity scores
    return commands.length * 0.5;
  }

  /**
   * Apply color quantization to image data
   */
  private applyColorQuantization(imageData: ImageData, palette: ColorPalette): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Find closest color in palette
      const closestColor = this.findClosestColor({ r, g, b, a }, palette);
      
      data[i] = closestColor.r;
      data[i + 1] = closestColor.g;
      data[i + 2] = closestColor.b;
      data[i + 3] = closestColor.a || 255;
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Find closest color in palette
   */
  private findClosestColor(
    color: { r: number; g: number; b: number; a?: number },
    palette: ColorPalette
  ): { r: number; g: number; b: number; a?: number } {
    let minDistance = Infinity;
    let closestColor = palette.colors[0];
    
    for (const paletteColor of palette.colors) {
      const distance = Math.sqrt(
        Math.pow(color.r - paletteColor.r, 2) +
        Math.pow(color.g - paletteColor.g, 2) +
        Math.pow(color.b - paletteColor.b, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = paletteColor;
      }
    }
    
    return closestColor;
  }

  /**
   * Create color map for vectorization
   */
  private createColorMap(palette: ColorPalette): Map<string, string> {
    const colorMap = new Map<string, string>();
    
    palette.colors.forEach((color, index) => {
      const key = `${color.r},${color.g},${color.b}`;
      const value = `rgb(${color.r},${color.g},${color.b})`;
      colorMap.set(key, value);
    });
    
    return colorMap;
  }
}

/**
 * Photo processing mode with enhanced color quantization and edge detection
 */
export class PhotoProcessor extends AlgorithmProcessor {
  constructor() {
    super();
    // Configure for photo processing
    this.vectorizer = new Vectorizer({
      simplificationTolerance: 0.5, // Lower tolerance for detail preservation
      enableBezierFitting: true, // Use curves for smooth gradients
      minContourLength: 3 // Shorter minimum for fine details
    });
  }

  async processImage(
    imageData: ImageData,
    config: VectorizationConfig
  ): Promise<{
    palette: ColorPalette;
    edges: EdgeData;
    paths: VectorPath[];
  }> {
    // Step 1: Enhanced color quantization for photos
    const palette = await this.colorQuantizer.quantizeColors(
      imageData,
      config.colorCount, // Use full color range for photos
      'kmeans' // K-means is better for natural color distributions
    );

    // Step 2: Apply sophisticated color quantization
    const quantizedImage = this.applyPhotoColorQuantization(imageData, palette);

    // Step 3: Multi-scale edge detection for photos
    const edges = await this.detectPhotoEdges(quantizedImage);

    // Step 4: Vectorize with photo-specific settings
    const colorMap = this.createColorMap(palette);
    const paths = await this.vectorizer.vectorizeEdges(edges, colorMap);

    // Step 5: Post-process paths for photo optimization
    const optimizedPaths = this.optimizePhotoPaths(paths);

    return {
      palette,
      edges,
      paths: optimizedPaths
    };
  }

  /**
   * Apply sophisticated color quantization for photos
   */
  private applyPhotoColorQuantization(imageData: ImageData, palette: ColorPalette): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    
    // Apply dithering for better photo quality
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const index = (y * imageData.width + x) * 4;
        
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        // Find closest color with error diffusion
        const closestColor = this.findClosestColor({ r, g, b, a }, palette);
        
        // Calculate quantization error
        const errorR = r - closestColor.r;
        const errorG = g - closestColor.g;
        const errorB = b - closestColor.b;
        
        // Apply Floyd-Steinberg dithering
        this.diffuseError(data, imageData.width, imageData.height, x, y, errorR, errorG, errorB);
        
        data[index] = closestColor.r;
        data[index + 1] = closestColor.g;
        data[index + 2] = closestColor.b;
        data[index + 3] = closestColor.a || 255;
      }
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Apply Floyd-Steinberg error diffusion
   */
  private diffuseError(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    errorR: number,
    errorG: number,
    errorB: number
  ): void {
    const diffusionMatrix = [
      { dx: 1, dy: 0, weight: 7/16 },
      { dx: -1, dy: 1, weight: 3/16 },
      { dx: 0, dy: 1, weight: 5/16 },
      { dx: 1, dy: 1, weight: 1/16 }
    ];

    for (const { dx, dy, weight } of diffusionMatrix) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        const index = (newY * width + newX) * 4;
        
        data[index] = Math.max(0, Math.min(255, data[index] + errorR * weight));
        data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + errorG * weight));
        data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + errorB * weight));
      }
    }
  }

  /**
   * Multi-scale edge detection for photos
   */
  private async detectPhotoEdges(imageData: ImageData): Promise<EdgeData> {
    // Use Canny edge detection for better photo edges
    const edges = await this.edgeDetector.detectEdges(imageData, {
      algorithm: 'canny',
      lowThreshold: 0.1,
      highThreshold: 0.2,
      gaussianKernelSize: 3,
      gaussianBlur: true
    });

    // Enhance edges with gradient information
    return this.enhancePhotoEdges(edges, imageData);
  }

  /**
   * Enhance edges for photo processing
   */
  private enhancePhotoEdges(edges: EdgeData, originalImage: ImageData): EdgeData {
    const { magnitude, direction, width, height } = edges;
    const enhanced = new Float32Array(magnitude.length);
    
    // Calculate local contrast to enhance important edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const contrast = this.calculateLocalContrast(originalImage, x, y);
        
        // Enhance edges in high-contrast areas
        enhanced[index] = magnitude[index] * (1 + contrast * 0.5);
      }
    }

    return {
      magnitude: enhanced,
      direction,
      width,
      height,
      algorithm: 'canny',
      parameters: { lowThreshold: 0.1, highThreshold: 0.2 }
    };
  }

  /**
   * Calculate local contrast around a pixel
   */
  private calculateLocalContrast(imageData: ImageData, x: number, y: number): number {
    const { data, width } = imageData;
    const windowSize = 3;
    const halfWindow = Math.floor(windowSize / 2);
    
    let min = 255;
    let max = 0;
    
    for (let dy = -halfWindow; dy <= halfWindow; dy++) {
      for (let dx = -halfWindow; dx <= halfWindow; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < imageData.height) {
          const index = (ny * width + nx) * 4;
          const gray = (data[index] + data[index + 1] + data[index + 2]) / 3;
          min = Math.min(min, gray);
          max = Math.max(max, gray);
        }
      }
    }
    
    return (max - min) / 255;
  }

  /**
   * Optimize paths for photo processing
   */
  private optimizePhotoPaths(paths: VectorPath[]): VectorPath[] {
    return paths.map(path => {
      // Group similar colors and merge adjacent paths
      const optimizedPathData = this.optimizePhotoPath(path.pathData);
      
      return {
        ...path,
        pathData: optimizedPathData,
        complexity: this.calculatePhotoComplexity(optimizedPathData)
      };
    });
  }

  /**
   * Optimize individual photo path
   */
  private optimizePhotoPath(pathData: string): string {
    // Smooth curves for better photo representation
    return this.smoothPathCurves(pathData);
  }

  /**
   * Smooth path curves for photo quality
   */
  private smoothPathCurves(pathData: string): string {
    // Simple smoothing - in a full implementation this would be more sophisticated
    return pathData.replace(/L/g, 'Q'); // Convert lines to quadratic curves where appropriate
  }

  /**
   * Calculate photo-specific complexity
   */
  private calculatePhotoComplexity(pathData: string): number {
    const commands = pathData.match(/[MLHVCSQTAZ]/gi) || [];
    const curves = pathData.match(/[CSQ]/gi) || [];
    
    // Photos can have higher complexity due to detail
    return commands.length * 0.8 + curves.length * 0.2;
  }

  /**
   * Find closest color with perceptual weighting
   */
  private findClosestColor(
    color: { r: number; g: number; b: number; a?: number },
    palette: ColorPalette
  ): { r: number; g: number; b: number; a?: number } {
    let minDistance = Infinity;
    let closestColor = palette.colors[0];
    
    for (const paletteColor of palette.colors) {
      // Use perceptual color distance (weighted RGB)
      const distance = Math.sqrt(
        Math.pow((color.r - paletteColor.r) * 0.3, 2) +
        Math.pow((color.g - paletteColor.g) * 0.59, 2) +
        Math.pow((color.b - paletteColor.b) * 0.11, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = paletteColor;
      }
    }
    
    return closestColor;
  }

  /**
   * Create color map for vectorization
   */
  private createColorMap(palette: ColorPalette): Map<string, string> {
    const colorMap = new Map<string, string>();
    
    palette.colors.forEach((color, index) => {
      const key = `${color.r},${color.g},${color.b}`;
      const value = `rgb(${color.r},${color.g},${color.b})`;
      colorMap.set(key, value);
    });
    
    return colorMap;
  }
}

/**
 * Line art processing mode with optimized path tracing and curve fitting
 */
export class LineArtProcessor extends AlgorithmProcessor {
  constructor() {
    super();
    // Configure for line art processing
    this.vectorizer = new Vectorizer({
      simplificationTolerance: 1.5, // Medium tolerance for clean lines
      enableBezierFitting: true, // Use curves for smooth artistic lines
      minContourLength: 6 // Medium minimum for artistic strokes
    });
  }

  async processImage(
    imageData: ImageData,
    config: VectorizationConfig
  ): Promise<{
    palette: ColorPalette;
    edges: EdgeData;
    paths: VectorPath[];
  }> {
    // Step 1: Optimized color quantization for line art
    const palette = await this.colorQuantizer.quantizeColors(
      imageData,
      Math.min(config.colorCount, 32), // Moderate color count for line art
      'mediancut' // Median cut works well for line art
    );

    // Step 2: Preprocess for line art characteristics
    const preprocessedImage = this.preprocessLineArt(imageData);

    // Step 3: Apply color quantization
    const quantizedImage = this.applyLineArtColorQuantization(preprocessedImage, palette);

    // Step 4: Specialized edge detection for line art
    const edges = await this.detectLineArtEdges(quantizedImage);

    // Step 5: Vectorize with line art-specific settings
    const colorMap = this.createColorMap(palette);
    const paths = await this.vectorizer.vectorizeEdges(edges, colorMap);

    // Step 6: Post-process paths for line art optimization
    const optimizedPaths = this.optimizeLineArtPaths(paths);

    return {
      palette,
      edges,
      paths: optimizedPaths
    };
  }

  /**
   * Preprocess image for line art characteristics
   */
  private preprocessLineArt(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    
    // Enhance contrast for better line detection
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert to grayscale and enhance contrast
      const gray = (r * 0.299 + g * 0.587 + b * 0.114);
      const enhanced = this.enhanceContrast(gray);
      
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
      // Alpha remains unchanged
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Enhance contrast for line art
   */
  private enhanceContrast(value: number): number {
    // Apply S-curve for contrast enhancement
    const normalized = value / 255;
    const enhanced = 1 / (1 + Math.exp(-12 * (normalized - 0.5)));
    return Math.round(enhanced * 255);
  }

  /**
   * Apply color quantization optimized for line art
   */
  private applyLineArtColorQuantization(imageData: ImageData, palette: ColorPalette): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Find closest color with emphasis on preserving line integrity
      const closestColor = this.findClosestLineArtColor({ r, g, b, a }, palette);
      
      data[i] = closestColor.r;
      data[i + 1] = closestColor.g;
      data[i + 2] = closestColor.b;
      data[i + 3] = closestColor.a || 255;
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Detect edges optimized for line art
   */
  private async detectLineArtEdges(imageData: ImageData): Promise<EdgeData> {
    // Use Sobel with specific parameters for line art
    const edges = await this.edgeDetector.detectEdges(imageData, {
      algorithm: 'sobel',
      threshold: 0.2,
      gaussianBlur: true,
      gaussianKernelSize: 1 // Minimal blur to preserve line sharpness
    });

    // Enhance line continuity
    return this.enhanceLineArtEdges(edges);
  }

  /**
   * Enhance edges for line art processing
   */
  private enhanceLineArtEdges(edges: EdgeData): EdgeData {
    const { magnitude, direction, width, height } = edges;
    const enhanced = new Float32Array(magnitude.length);
    
    // Apply line continuation and gap filling
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        
        // Check for line continuation
        const continuity = this.calculateLineContinuity(magnitude, width, height, x, y);
        
        // Enhance pixels that are part of continuous lines
        enhanced[index] = magnitude[index] * (1 + continuity * 0.3);
      }
    }

    return {
      magnitude: enhanced,
      direction,
      width,
      height,
      algorithm: 'sobel',
      parameters: { threshold: 0.2 }
    };
  }

  /**
   * Calculate line continuity at a point
   */
  private calculateLineContinuity(
    magnitude: Float32Array,
    width: number,
    height: number,
    x: number,
    y: number
  ): number {
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];
    
    let continuityScore = 0;
    const threshold = 0.1;
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndex = ny * width + nx;
        if (magnitude[neighborIndex] > threshold) {
          continuityScore += 1;
        }
      }
    }
    
    return continuityScore / 8; // Normalize to 0-1
  }

  /**
   * Optimize paths for line art
   */
  private optimizeLineArtPaths(paths: VectorPath[]): VectorPath[] {
    return paths.map(path => {
      // Optimize for smooth artistic curves
      const optimizedPathData = this.optimizeLineArtPath(path.pathData);
      
      return {
        ...path,
        pathData: optimizedPathData,
        complexity: this.calculateLineArtComplexity(optimizedPathData)
      };
    });
  }

  /**
   * Optimize individual line art path
   */
  private optimizeLineArtPath(pathData: string): string {
    // Convert sharp corners to smooth curves where appropriate
    return this.smoothLineArtCurves(pathData);
  }

  /**
   * Smooth curves for line art quality
   */
  private smoothLineArtCurves(pathData: string): string {
    // Replace sharp line segments with smooth curves
    return pathData.replace(/L\s+([\d.-]+)\s+([\d.-]+)\s+L\s+([\d.-]+)\s+([\d.-]+)/g, 
      (match, x1, y1, x2, y2) => {
        // Create a smooth curve through the three points
        const cpX = (parseFloat(x1) + parseFloat(x2)) / 2;
        const cpY = (parseFloat(y1) + parseFloat(y2)) / 2;
        return `Q ${cpX} ${cpY} ${x2} ${y2}`;
      });
  }

  /**
   * Calculate line art-specific complexity
   */
  private calculateLineArtComplexity(pathData: string): number {
    const commands = pathData.match(/[MLHVCSQTAZ]/gi) || [];
    const curves = pathData.match(/[CSQ]/gi) || [];
    
    // Line art should balance detail with smoothness
    return commands.length * 0.6 + curves.length * 0.4;
  }

  /**
   * Find closest color optimized for line art
   */
  private findClosestLineArtColor(
    color: { r: number; g: number; b: number; a?: number },
    palette: ColorPalette
  ): { r: number; g: number; b: number; a?: number } {
    let minDistance = Infinity;
    let closestColor = palette.colors[0];
    
    for (const paletteColor of palette.colors) {
      // Simple Euclidean distance for line art
      const distance = Math.sqrt(
        Math.pow(color.r - paletteColor.r, 2) +
        Math.pow(color.g - paletteColor.g, 2) +
        Math.pow(color.b - paletteColor.b, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = paletteColor;
      }
    }
    
    return closestColor;
  }

  /**
   * Create color map for vectorization
   */
  private createColorMap(palette: ColorPalette): Map<string, string> {
    const colorMap = new Map<string, string>();
    
    palette.colors.forEach((color, index) => {
      const key = `${color.r},${color.g},${color.b}`;
      const value = `rgb(${color.r},${color.g},${color.b})`;
      colorMap.set(key, value);
    });
    
    return colorMap;
  }
}

/**
 * Factory function to create appropriate algorithm processor
 */
export function createAlgorithmProcessor(algorithm: 'shapes' | 'photo' | 'lineart'): AlgorithmProcessor {
  switch (algorithm) {
    case 'shapes':
      return new ShapeProcessor();
    case 'photo':
      return new PhotoProcessor();
    case 'lineart':
      return new LineArtProcessor();
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}