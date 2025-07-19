import { ContourPoint, VectorPath } from '../types/vectorization';

/**
 * Utility functions for path manipulation and optimization
 */

/**
 * Optimize SVG path by removing redundant points and commands
 */
export function optimizeSVGPath(pathData: string): string {
  // Remove unnecessary whitespace
  let optimized = pathData.replace(/\s+/g, ' ').trim();
  
  // Remove redundant consecutive identical coordinates
  optimized = optimized.replace(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+L\s+\1\s+\2/g, '');
  
  // Simplify consecutive line commands
  optimized = optimized.replace(/L\s+([\d.-]+\s+[\d.-]+)(\s+L\s+[\d.-]+\s+[\d.-]+)+/g, (match) => {
    return match.replace(/\s+L\s+/g, ' ');
  });
  
  return optimized;
}

/**
 * Calculate the area of a polygon defined by points
 */
export function calculatePolygonArea(points: ContourPoint[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Check if a polygon is clockwise or counter-clockwise
 */
export function isClockwise(points: ContourPoint[]): boolean {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += (points[j].x - points[i].x) * (points[j].y + points[i].y);
  }
  return sum > 0;
}

/**
 * Reverse the order of points in a contour
 */
export function reverseContour(points: ContourPoint[]): ContourPoint[] {
  return [...points].reverse();
}

/**
 * Smooth a path using moving average
 */
export function smoothPath(points: ContourPoint[], windowSize: number = 3): ContourPoint[] {
  if (points.length <= windowSize) return points;
  
  const smoothed: ContourPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < points.length; i++) {
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - halfWindow); j <= Math.min(points.length - 1, i + halfWindow); j++) {
      sumX += points[j].x;
      sumY += points[j].y;
      count++;
    }
    
    smoothed.push({
      x: sumX / count,
      y: sumY / count
    });
  }
  
  return smoothed;
}

/**
 * Remove duplicate consecutive points
 */
export function removeDuplicatePoints(points: ContourPoint[], tolerance: number = 0.1): ContourPoint[] {
  if (points.length <= 1) return points;
  
  const filtered: ContourPoint[] = [points[0]];
  
  for (let i = 1; i < points.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = points[i];
    
    const distance = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
    
    if (distance > tolerance) {
      filtered.push(curr);
    }
  }
  
  return filtered;
}

/**
 * Convert relative path commands to absolute
 */
export function pathToAbsolute(pathData: string): string {
  const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
  let currentX = 0;
  let currentY = 0;
  let result = '';
  
  for (const command of commands) {
    const type = command[0];
    const coords = command.slice(1).trim().split(/[\s,]+/).map(Number);
    
    switch (type.toLowerCase()) {
      case 'm':
        if (type === 'm') {
          currentX += coords[0];
          currentY += coords[1];
        } else {
          currentX = coords[0];
          currentY = coords[1];
        }
        result += `M ${currentX} ${currentY}`;
        break;
        
      case 'l':
        if (type === 'l') {
          currentX += coords[0];
          currentY += coords[1];
        } else {
          currentX = coords[0];
          currentY = coords[1];
        }
        result += ` L ${currentX} ${currentY}`;
        break;
        
      case 'h':
        if (type === 'h') {
          currentX += coords[0];
        } else {
          currentX = coords[0];
        }
        result += ` L ${currentX} ${currentY}`;
        break;
        
      case 'v':
        if (type === 'v') {
          currentY += coords[0];
        } else {
          currentY = coords[0];
        }
        result += ` L ${currentX} ${currentY}`;
        break;
        
      case 'z':
        result += ' Z';
        break;
        
      default:
        // For other commands (C, Q, etc.), just append as-is for now
        result += ` ${command}`;
    }
  }
  
  return result.trim();
}

/**
 * Merge paths that share the same color and are adjacent
 */
export function mergeSimilarPaths(paths: VectorPath[], colorTolerance: number = 0): VectorPath[] {
  if (paths.length <= 1) return paths;
  
  const merged: VectorPath[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < paths.length; i++) {
    if (processed.has(i)) continue;
    
    const currentPath = paths[i];
    const similarPaths = [currentPath];
    processed.add(i);
    
    // Find paths with similar colors
    for (let j = i + 1; j < paths.length; j++) {
      if (processed.has(j)) continue;
      
      if (colorsAreSimilar(currentPath.fillColor, paths[j].fillColor, colorTolerance)) {
        similarPaths.push(paths[j]);
        processed.add(j);
      }
    }
    
    if (similarPaths.length === 1) {
      merged.push(currentPath);
    } else {
      // Merge similar paths
      const mergedPath = combinePaths(similarPaths);
      merged.push(mergedPath);
    }
  }
  
  return merged;
}

/**
 * Check if two colors are similar within tolerance
 */
function colorsAreSimilar(color1: string, color2: string, tolerance: number): boolean {
  if (tolerance === 0) return color1 === color2;
  
  // Simple hex color comparison - could be enhanced for other formats
  if (color1 === color2) return true;
  
  // For now, just do exact match - could implement RGB distance calculation
  return false;
}

/**
 * Combine multiple paths into a single path
 */
function combinePaths(paths: VectorPath[]): VectorPath {
  if (paths.length === 1) return paths[0];
  
  let combinedPathData = '';
  let totalComplexity = 0;
  
  for (const path of paths) {
    if (combinedPathData) {
      combinedPathData += ' ';
    }
    combinedPathData += path.pathData;
    totalComplexity += path.complexity;
  }
  
  return {
    pathData: combinedPathData,
    fillColor: paths[0].fillColor,
    strokeColor: paths[0].strokeColor,
    strokeWidth: paths[0].strokeWidth,
    complexity: totalComplexity
  };
}

/**
 * Validate SVG path syntax
 */
export function isValidSVGPath(pathData: string): boolean {
  try {
    // Handle empty path
    if (!pathData || pathData.trim().length === 0) return false;
    
    const trimmed = pathData.trim();
    
    // Basic validation - check for valid SVG path commands
    const validCommands = /^[MmLlHhVvCcSsQqTtAaZz\s\d.-]+$/;
    if (!validCommands.test(trimmed)) return false;
    
    // Check that path starts with a move command
    if (!/^M/i.test(trimmed)) return false;
    
    // Check for balanced coordinates (basic check)
    const commands = trimmed.match(/[MmLlHhVvCcSsQqTtAaZz]/g) || [];
    const numbers = trimmed.match(/[-+]?[0-9]*\.?[0-9]+/g) || [];
    
    // Very basic validation - should have some numbers if there are commands
    if (commands.length > 0 && numbers.length === 0) return false;
    
    // Check for incomplete commands (commands at the end without coordinates)
    const lastCommand = trimmed.match(/[MmLlHhVvCcSsQqTtAaZz](?!\s*[\d.-])/g);
    if (lastCommand && lastCommand.length > 0) {
      // Allow Z/z commands without coordinates
      const allowedWithoutCoords = /^[Zz]$/;
      if (!allowedWithoutCoords.test(lastCommand[lastCommand.length - 1])) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}