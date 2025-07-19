import { VectorizationConfig } from '../types/converter';
import { EdgeData, ColorPalette, VectorPath } from '../types/vectorization';
import { 
  ShapeProcessor, 
  PhotoProcessor, 
  LineArtProcessor, 
  createAlgorithmProcessor 
} from './algorithmProcessors';

/**
 * Algorithm selector service that chooses the appropriate processing mode
 * based on image characteristics and user configuration
 */
export class AlgorithmSelector {
  /**
   * Process image using the specified or auto-detected algorithm
   */
  async processWithAlgorithm(
    imageData: ImageData,
    config: VectorizationConfig
  ): Promise<{
    palette: ColorPalette;
    edges: EdgeData;
    paths: VectorPath[];
    algorithmUsed: 'shapes' | 'photo' | 'lineart';
  }> {
    let algorithmToUse: 'shapes' | 'photo' | 'lineart';

    if (config.algorithm === 'auto') {
      algorithmToUse = this.detectBestAlgorithm(imageData);
    } else {
      algorithmToUse = config.algorithm as 'shapes' | 'photo' | 'lineart';
    }

    const processor = createAlgorithmProcessor(algorithmToUse);
    const result = await processor.processImage(imageData, config);

    return {
      ...result,
      algorithmUsed: algorithmToUse
    };
  }

  /**
   * Automatically detect the best algorithm for the given image
   */
  private detectBestAlgorithm(imageData: ImageData): 'shapes' | 'photo' | 'lineart' {
    const analysis = this.analyzeImageCharacteristics(imageData);

    // Decision logic based on image characteristics
    // Prioritize line art detection over simple graphics for better accuracy
    if (analysis.isLineArt) {
      return 'lineart';
    } else if (analysis.isSimpleGraphic) {
      return 'shapes';
    } else {
      return 'photo';
    }
  }

  /**
   * Analyze image characteristics to determine the best processing algorithm
   */
  private analyzeImageCharacteristics(imageData: ImageData): {
    colorCount: number;
    edgeDensity: number;
    contrastLevel: number;
    hasTransparency: boolean;
    isSimpleGraphic: boolean;
    isLineArt: boolean;
    isPhoto: boolean;
    monochromaticRatio: number;
  } {
    const { data, width, height } = imageData;
    const pixelCount = width * height;
    
    // Analyze color distribution
    const colorAnalysis = this.analyzeColors(data);
    
    // Analyze edge characteristics
    const edgeAnalysis = this.analyzeEdges(data, width, height);
    
    // Analyze contrast
    const contrastLevel = this.calculateContrast(data);
    
    // Check for transparency
    const hasTransparency = this.hasTransparency(data);

    // Decision criteria
    const isSimpleGraphic = (
      colorAnalysis.uniqueColors <= 16 &&
      edgeAnalysis.sharpEdgeRatio > 0.7 &&
      contrastLevel > 0.6 &&
      colorAnalysis.monochromaticRatio < 0.8 // Not predominantly monochromatic
    );

    const isLineArt = (
      colorAnalysis.uniqueColors <= 32 &&
      edgeAnalysis.edgeDensity > 0.05 &&
      edgeAnalysis.edgeDensity < 0.6 &&
      contrastLevel > 0.3 &&
      colorAnalysis.monochromaticRatio > 0.6 // Predominantly monochromatic
    );

    const isPhoto = !isSimpleGraphic && !isLineArt;

    return {
      colorCount: colorAnalysis.uniqueColors,
      edgeDensity: edgeAnalysis.edgeDensity,
      contrastLevel,
      hasTransparency,
      isSimpleGraphic,
      isLineArt,
      isPhoto,
      monochromaticRatio: colorAnalysis.monochromaticRatio
    };
  }

  /**
   * Analyze color characteristics of the image
   */
  private analyzeColors(data: Uint8ClampedArray): {
    uniqueColors: number;
    monochromaticRatio: number;
    dominantColorRatio: number;
  } {
    const colorMap = new Map<string, number>();
    let monochromaticPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Count unique colors (with some tolerance for compression artifacts)
      const quantizedR = Math.floor(r / 8) * 8;
      const quantizedG = Math.floor(g / 8) * 8;
      const quantizedB = Math.floor(b / 8) * 8;
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);

      // Check if pixel is monochromatic (grayscale)
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      if (maxDiff < 20) { // Increased tolerance for monochromatic detection
        monochromaticPixels++;
      }
    }

    const uniqueColors = colorMap.size;
    const monochromaticRatio = monochromaticPixels / totalPixels;
    
    // Find dominant color ratio
    const colorCounts = Array.from(colorMap.values()).sort((a, b) => b - a);
    const dominantColorRatio = colorCounts.length > 0 ? colorCounts[0] / totalPixels : 0;

    return {
      uniqueColors,
      monochromaticRatio,
      dominantColorRatio
    };
  }

  /**
   * Analyze edge characteristics of the image
   */
  private analyzeEdges(data: Uint8ClampedArray, width: number, height: number): {
    edgeDensity: number;
    sharpEdgeRatio: number;
    averageEdgeStrength: number;
  } {
    let edgePixels = 0;
    let sharpEdges = 0;
    let totalEdgeStrength = 0;
    const totalPixels = width * height;

    // Simple edge detection using gradient magnitude
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4;
        
        // Calculate gradient using neighboring pixels
        const centerGray = this.rgbToGray(data[index], data[index + 1], data[index + 2]);
        
        const rightIndex = (y * width + (x + 1)) * 4;
        const rightGray = this.rgbToGray(data[rightIndex], data[rightIndex + 1], data[rightIndex + 2]);
        
        const bottomIndex = ((y + 1) * width + x) * 4;
        const bottomGray = this.rgbToGray(data[bottomIndex], data[bottomIndex + 1], data[bottomIndex + 2]);
        
        const gx = rightGray - centerGray;
        const gy = bottomGray - centerGray;
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        if (magnitude > 10) { // Edge threshold
          edgePixels++;
          totalEdgeStrength += magnitude;
          
          if (magnitude > 50) { // Sharp edge threshold
            sharpEdges++;
          }
        }
      }
    }

    const edgeDensity = edgePixels / totalPixels;
    const sharpEdgeRatio = edgePixels > 0 ? sharpEdges / edgePixels : 0;
    const averageEdgeStrength = edgePixels > 0 ? totalEdgeStrength / edgePixels : 0;

    return {
      edgeDensity,
      sharpEdgeRatio,
      averageEdgeStrength
    };
  }

  /**
   * Calculate overall contrast level of the image
   */
  private calculateContrast(data: Uint8ClampedArray): number {
    let min = 255;
    let max = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray = this.rgbToGray(data[i], data[i + 1], data[i + 2]);
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }

    return (max - min) / 255;
  }

  /**
   * Check if image has transparency
   */
  private hasTransparency(data: Uint8ClampedArray): boolean {
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  }

  /**
   * Convert RGB to grayscale
   */
  private rgbToGray(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  /**
   * Get algorithm recommendations for an image
   */
  getAlgorithmRecommendations(imageData: ImageData): {
    recommended: 'shapes' | 'photo' | 'lineart';
    confidence: number;
    alternatives: Array<{
      algorithm: 'shapes' | 'photo' | 'lineart';
      confidence: number;
      reason: string;
    }>;
    analysis: ReturnType<typeof this.analyzeImageCharacteristics>;
  } {
    const analysis = this.analyzeImageCharacteristics(imageData);
    const recommended = this.detectBestAlgorithm(imageData);
    
    // Calculate confidence based on how clearly the image fits the category
    let confidence = 0.5; // Base confidence
    
    if (analysis.isSimpleGraphic && recommended === 'shapes') {
      confidence = 0.9;
    } else if (analysis.isLineArt && recommended === 'lineart') {
      confidence = 0.8;
    } else if (analysis.isPhoto && recommended === 'photo') {
      confidence = 0.7;
    }

    // Generate alternatives
    const alternatives: Array<{
      algorithm: 'shapes' | 'photo' | 'lineart';
      confidence: number;
      reason: string;
    }> = [];

    if (recommended !== 'shapes') {
      alternatives.push({
        algorithm: 'shapes',
        confidence: analysis.isSimpleGraphic ? 0.6 : 0.3,
        reason: analysis.colorCount <= 16 ? 'Low color count suggests simple graphics' : 'May work for geometric elements'
      });
    }

    if (recommended !== 'lineart') {
      alternatives.push({
        algorithm: 'lineart',
        confidence: analysis.isLineArt ? 0.6 : 0.3,
        reason: analysis.monochromaticRatio > 0.5 ? 'High monochromatic ratio suggests line art' : 'May work for sketches'
      });
    }

    if (recommended !== 'photo') {
      alternatives.push({
        algorithm: 'photo',
        confidence: analysis.isPhoto ? 0.6 : 0.4,
        reason: 'Complex color gradients suggest photographic content'
      });
    }

    return {
      recommended,
      confidence,
      alternatives: alternatives.sort((a, b) => b.confidence - a.confidence),
      analysis
    };
  }
}

export default AlgorithmSelector;