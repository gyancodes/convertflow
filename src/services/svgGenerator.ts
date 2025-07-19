import { VectorPath, ColorPalette } from '../types/vectorization';
import { ProcessingResult } from '../types/converter';

/**
 * SVG generation and optimization service
 * Converts vector paths to optimized SVG markup
 */
export class SvgGenerator {
  private enableOptimization: boolean = true;
  private groupByColor: boolean = true;
  private removeRedundantPointsEnabled: boolean = true;
  private mergePaths: boolean = true;
  private precision: number = 2; // Decimal places for coordinates

  constructor(options?: {
    enableOptimization?: boolean;
    groupByColor?: boolean;
    removeRedundantPoints?: boolean;
    mergePaths?: boolean;
    precision?: number;
  }) {
    if (options) {
      this.enableOptimization = options.enableOptimization ?? true;
      this.groupByColor = options.groupByColor ?? true;
      this.removeRedundantPointsEnabled = options.removeRedundantPoints ?? true;
      this.mergePaths = options.mergePaths ?? true;
      this.precision = options.precision ?? 2;
    }
  }

  /**
   * Generate SVG from vector paths
   */
  async generateSVG(
    paths: VectorPath[],
    width: number,
    height: number,
    palette?: ColorPalette
  ): Promise<ProcessingResult> {
    const startTime = performance.now();

    // Optimize paths if enabled
    const optimizedPaths = this.enableOptimization 
      ? this.optimizePaths(paths)
      : paths;

    // Group paths by color for efficient structure
    const groupedPaths = this.groupByColor 
      ? this.groupPathsByColor(optimizedPaths)
      : new Map(optimizedPaths.map((path, index) => [`path-${index}`, [path]]));

    // Generate SVG content
    const svgContent = this.createSVGMarkup(groupedPaths, width, height, palette);

    const processingTime = performance.now() - startTime;
    const originalSize = this.estimateOriginalSize(width, height);
    const vectorSize = new Blob([svgContent]).size;

    return {
      svgContent,
      originalSize,
      vectorSize,
      processingTime,
      colorCount: groupedPaths.size,
      pathCount: optimizedPaths.length
    };
  }

  /**
   * Optimize vector paths for better SVG output
   */
  private optimizePaths(paths: VectorPath[]): VectorPath[] {
    let optimized = [...paths];

    if (this.removeRedundantPointsEnabled) {
      optimized = optimized.map(path => this.removeRedundantPoints(path));
    }

    if (this.mergePaths) {
      optimized = this.mergeCompatiblePaths(optimized);
    }

    return optimized.map(path => ({
      ...path,
      pathData: this.roundCoordinates(path.pathData)
    }));
  }

  /**
   * Remove redundant points from path data
   */
  private removeRedundantPoints(path: VectorPath): VectorPath {
    const pathData = path.pathData;
    
    // Parse path commands and coordinates
    const commands = this.parsePathData(pathData);
    const optimizedCommands = this.removeRedundantCommands(commands);
    const optimizedPathData = this.commandsToPathData(optimizedCommands);

    return {
      ...path,
      pathData: optimizedPathData,
      complexity: this.calculatePathComplexity(optimizedPathData)
    };
  }

  /**
   * Parse SVG path data into commands and coordinates
   */
  private parsePathData(pathData: string): PathCommand[] {
    const commands: PathCommand[] = [];
    const regex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = regex.exec(pathData)) !== null) {
      const command = match[1].toUpperCase();
      const coordString = match[2].trim();
      const coords = coordString ? coordString.split(/[\s,]+/).map(Number).filter(n => !isNaN(n)) : [];
      
      commands.push({ command, coordinates: coords });
    }

    return commands;
  }

  /**
   * Remove redundant commands (consecutive identical moves, zero-length lines, etc.)
   */
  private removeRedundantCommands(commands: PathCommand[]): PathCommand[] {
    const optimized: PathCommand[] = [];
    let lastPoint = { x: 0, y: 0 };

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      
      switch (cmd.command) {
        case 'M':
          if (cmd.coordinates.length >= 2) {
            const newPoint = { x: cmd.coordinates[0], y: cmd.coordinates[1] };
            // Skip redundant moves to same position
            if (i === 0 || newPoint.x !== lastPoint.x || newPoint.y !== lastPoint.y) {
              optimized.push(cmd);
              lastPoint = newPoint;
            }
          }
          break;
          
        case 'L':
          if (cmd.coordinates.length >= 2) {
            const newPoint = { x: cmd.coordinates[0], y: cmd.coordinates[1] };
            // Skip zero-length lines
            if (newPoint.x !== lastPoint.x || newPoint.y !== lastPoint.y) {
              optimized.push(cmd);
              lastPoint = newPoint;
            }
          }
          break;
          
        case 'C':
          if (cmd.coordinates.length >= 6) {
            const newPoint = { x: cmd.coordinates[4], y: cmd.coordinates[5] };
            optimized.push(cmd);
            lastPoint = newPoint;
          }
          break;
          
        case 'Q':
          if (cmd.coordinates.length >= 4) {
            const newPoint = { x: cmd.coordinates[2], y: cmd.coordinates[3] };
            optimized.push(cmd);
            lastPoint = newPoint;
          }
          break;
          
        case 'Z':
          optimized.push(cmd);
          break;
          
        default:
          optimized.push(cmd);
      }
    }

    return optimized;
  }

  /**
   * Convert commands back to path data string
   */
  private commandsToPathData(commands: PathCommand[]): string {
    return commands.map(cmd => {
      if (cmd.coordinates.length === 0) {
        return cmd.command;
      }
      return `${cmd.command} ${cmd.coordinates.join(' ')}`;
    }).join(' ');
  }

  /**
   * Merge compatible paths with same color and style
   */
  private mergeCompatiblePaths(paths: VectorPath[]): VectorPath[] {
    const merged: VectorPath[] = [];
    const pathsByColor = new Map<string, VectorPath[]>();

    // Group paths by color
    for (const path of paths) {
      const key = `${path.fillColor}-${path.strokeColor || ''}-${path.strokeWidth || 0}`;
      if (!pathsByColor.has(key)) {
        pathsByColor.set(key, []);
      }
      pathsByColor.get(key)!.push(path);
    }

    // Merge paths with same styling
    for (const [, colorPaths] of pathsByColor) {
      if (colorPaths.length === 1) {
        merged.push(colorPaths[0]);
      } else {
        // Combine multiple paths into one
        const combinedPathData = colorPaths.map(p => p.pathData).join(' ');
        const combinedComplexity = colorPaths.reduce((sum, p) => sum + p.complexity, 0);
        
        merged.push({
          pathData: combinedPathData,
          fillColor: colorPaths[0].fillColor,
          strokeColor: colorPaths[0].strokeColor,
          strokeWidth: colorPaths[0].strokeWidth,
          complexity: combinedComplexity
        });
      }
    }

    return merged;
  }

  /**
   * Round coordinates to specified precision
   */
  private roundCoordinates(pathData: string): string {
    return pathData.replace(/[-+]?[0-9]*\.?[0-9]+/g, (match) => {
      const num = parseFloat(match);
      return num.toFixed(this.precision).replace(/\.?0+$/, '');
    });
  }

  /**
   * Group paths by color for efficient SVG structure
   */
  private groupPathsByColor(paths: VectorPath[]): Map<string, VectorPath[]> {
    const groups = new Map<string, VectorPath[]>();

    for (const path of paths) {
      const colorKey = path.fillColor;
      if (!groups.has(colorKey)) {
        groups.set(colorKey, []);
      }
      groups.get(colorKey)!.push(path);
    }

    return groups;
  }

  /**
   * Create complete SVG markup
   */
  private createSVGMarkup(
    groupedPaths: Map<string, VectorPath[]>,
    width: number,
    height: number,
    palette?: ColorPalette
  ): string {
    const svgHeader = this.createSVGHeader(width, height);
    const svgContent = this.createSVGContent(groupedPaths);
    const svgFooter = '</svg>';

    return `${svgHeader}\n${svgContent}\n${svgFooter}`;
  }

  /**
   * Create SVG header with proper dimensions and metadata
   */
  private createSVGHeader(width: number, height: number): string {
    const timestamp = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by PNG to SVG Converter on ${timestamp} -->
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">`;
  }

  /**
   * Create SVG content with grouped paths
   */
  private createSVGContent(groupedPaths: Map<string, VectorPath[]>): string {
    const groups: string[] = [];

    for (const [key, paths] of groupedPaths) {
      if (this.groupByColor && key.startsWith('#')) {
        // Color-based grouping
        const groupContent = this.createColorGroup(key, paths);
        groups.push(groupContent);
      } else {
        // Individual paths without grouping
        for (const path of paths) {
          const pathElement = this.createPathElement(path, key);
          groups.push(`  ${pathElement}`);
        }
      }
    }

    return groups.join('\n');
  }

  /**
   * Create a color group with all paths of the same color
   */
  private createColorGroup(color: string, paths: VectorPath[]): string {
    if (paths.length === 0) return '';

    const groupId = `color-${color.replace('#', '')}`;
    const pathElements = paths.map((path, index) => 
      this.createPathElement(path, `${groupId}-${index}`)
    ).join('\n    ');

    return `  <g id="${groupId}" fill="${color}">
    ${pathElements}
  </g>`;
  }

  /**
   * Create individual path element
   */
  private createPathElement(path: VectorPath, id: string): string {
    let pathElement = `<path id="${id}" d="${path.pathData}" fill="${path.fillColor}"`;
    
    if (path.strokeColor) {
      pathElement += ` stroke="${path.strokeColor}"`;
    }
    
    if (path.strokeWidth) {
      pathElement += ` stroke-width="${path.strokeWidth}"`;
    }
    
    pathElement += '/>';
    
    return pathElement;
  }

  /**
   * Calculate path complexity score
   */
  private calculatePathComplexity(pathData: string): number {
    const commands = pathData.match(/[MLHVCSQTAZ]/gi) || [];
    const coordinates = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g) || [];
    
    return commands.length + coordinates.length * 0.1;
  }

  /**
   * Estimate original PNG size for comparison
   */
  private estimateOriginalSize(width: number, height: number): number {
    // Rough estimate: 4 bytes per pixel (RGBA) plus PNG overhead
    return width * height * 4 + 1024;
  }

  /**
   * Validate generated SVG content
   */
  validateSVG(svgContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation checks
    if (!svgContent.includes('<svg')) {
      errors.push('Missing SVG root element');
    }

    if (!svgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
      errors.push('Missing SVG namespace declaration');
    }

    if (!svgContent.includes('</svg>')) {
      errors.push('Missing SVG closing tag');
    }

    // Check for valid path data
    const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
    if (pathMatches) {
      for (const pathMatch of pathMatches) {
        const pathData = pathMatch.match(/d="([^"]*)"/)?.[1];
        if (pathData && !this.isValidPathData(pathData)) {
          errors.push(`Invalid path data: ${pathData.substring(0, 50)}...`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if path data is valid SVG path syntax
   */
  private isValidPathData(pathData: string): boolean {
    // Basic validation - check for valid commands and coordinate format
    const validCommands = /^[MLHVCSQTAZ\s\d\.,\-+]*$/i;
    return validCommands.test(pathData);
  }

  /**
   * Get file size optimization statistics
   */
  getOptimizationStats(originalPaths: VectorPath[], optimizedPaths: VectorPath[]): {
    pathReduction: number;
    complexityReduction: number;
    estimatedSizeReduction: number;
  } {
    const originalComplexity = originalPaths.reduce((sum, p) => sum + p.complexity, 0);
    const optimizedComplexity = optimizedPaths.reduce((sum, p) => sum + p.complexity, 0);
    
    const pathReduction = ((originalPaths.length - optimizedPaths.length) / originalPaths.length) * 100;
    const complexityReduction = ((originalComplexity - optimizedComplexity) / originalComplexity) * 100;
    const estimatedSizeReduction = (pathReduction + complexityReduction) / 2;

    return {
      pathReduction: Math.max(0, pathReduction),
      complexityReduction: Math.max(0, complexityReduction),
      estimatedSizeReduction: Math.max(0, estimatedSizeReduction)
    };
  }
}

// Helper interfaces
interface PathCommand {
  command: string;
  coordinates: number[];
}

export default SvgGenerator;