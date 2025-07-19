import { VectorPath, Contour, ContourPoint, EdgeData } from '../types/vectorization';

/**
 * Core vectorization engine that converts raster data to vector paths
 */
export class Vectorizer {
  private simplificationTolerance: number = 1.0;
  private enableBezierFitting: boolean = true;
  private minContourLength: number = 4;

  constructor(options?: {
    simplificationTolerance?: number;
    enableBezierFitting?: boolean;
    minContourLength?: number;
  }) {
    if (options) {
      this.simplificationTolerance = options.simplificationTolerance ?? 1.0;
      this.enableBezierFitting = options.enableBezierFitting ?? true;
      this.minContourLength = options.minContourLength ?? 4;
    }
  }

  /**
   * Convert edge data to vector paths
   */
  async vectorizeEdges(edgeData: EdgeData, colorMap: Map<string, string>): Promise<VectorPath[]> {
    const contours = this.traceContours(edgeData);
    const paths: VectorPath[] = [];

    for (const contour of contours) {
      if (contour.points.length < this.minContourLength) continue;

      const simplifiedContour = this.simplifyContour(contour, this.simplificationTolerance);
      const pathData = this.enableBezierFitting 
        ? this.contourToBezierPath(simplifiedContour)
        : this.contourToLinearPath(simplifiedContour);

      const fillColor = this.determineContourColor(contour, colorMap);
      
      paths.push({
        pathData,
        fillColor,
        complexity: this.calculatePathComplexity(pathData)
      });
    }

    return paths;
  }

  /**
   * Trace contours from edge data using boundary following algorithm
   */
  private traceContours(edgeData: EdgeData): Contour[] {
    const { magnitude, width, height } = edgeData;
    const visited = new Set<number>();
    const contours: Contour[] = [];
    const threshold = 0.1; // Edge magnitude threshold

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        
        if (visited.has(index) || magnitude[index] < threshold) continue;

        const contour = this.followBoundary(x, y, magnitude, width, height, visited, threshold);
        if (contour.points.length >= this.minContourLength) {
          contours.push(contour);
        }
      }
    }

    return contours;
  }

  /**
   * Follow boundary using Moore neighborhood tracing
   */
  private followBoundary(
    startX: number, 
    startY: number, 
    magnitude: Float32Array, 
    width: number, 
    height: number,
    visited: Set<number>,
    threshold: number
  ): Contour {
    const points: ContourPoint[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [1, 0], [1, 1], [0, 1],
      [-1, 1], [-1, 0]
    ];

    let x = startX;
    let y = startY;
    let direction = 0;
    const startIndex = y * width + x;
    
    do {
      const index = y * width + x;
      visited.add(index);
      points.push({ x, y });

      // Find next boundary point
      let found = false;
      for (let i = 0; i < 8; i++) {
        const checkDir = (direction + i) % 8;
        const [dx, dy] = directions[checkDir];
        const nextX = x + dx;
        const nextY = y + dy;

        if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
          const nextIndex = nextY * width + nextX;
          if (magnitude[nextIndex] >= threshold) {
            x = nextX;
            y = nextY;
            direction = (checkDir + 6) % 8; // Turn left for next search
            found = true;
            break;
          }
        }
      }

      if (!found) break;
    } while (!(x === startX && y === startY) && points.length < 10000);

    const bounds = this.calculateBounds(points);
    const length = this.calculateContourLength(points);
    const closed = (x === startX && y === startY);

    return { points, closed, length, bounds };
  }

  /**
   * Simplify contour using Douglas-Peucker algorithm
   */
  private simplifyContour(contour: Contour, tolerance: number): Contour {
    if (contour.points.length <= 2) return contour;

    const simplified = this.douglasPeucker(contour.points, tolerance);
    const bounds = this.calculateBounds(simplified);
    const length = this.calculateContourLength(simplified);

    return {
      points: simplified,
      closed: contour.closed,
      length,
      bounds
    };
  }

  /**
   * Douglas-Peucker line simplification algorithm
   */
  private douglasPeucker(points: ContourPoint[], tolerance: number): ContourPoint[] {
    if (points.length <= 2) return points;

    // Find the point with maximum distance from line between first and last points
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
      const leftSegment = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const rightSegment = this.douglasPeucker(points.slice(maxIndex), tolerance);
      
      // Combine segments, removing duplicate point at junction
      return [...leftSegment.slice(0, -1), ...rightSegment];
    }

    // If max distance is within tolerance, return simplified line
    return [start, end];
  }

  /**
   * Calculate perpendicular distance from point to line
   */
  private perpendicularDistance(point: ContourPoint, lineStart: ContourPoint, lineEnd: ContourPoint): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    
    if (dx === 0 && dy === 0) {
      // Line start and end are the same point
      return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
    }

    const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
    const denominator = Math.sqrt(dx * dx + dy * dy);
    
    return numerator / denominator;
  }

  /**
   * Convert contour to Bézier curve path
   */
  private contourToBezierPath(contour: Contour): string {
    if (contour.points.length < 2) return '';

    const points = contour.points;
    let pathData = `M ${points[0].x} ${points[0].y}`;

    // Fit Bézier curves to segments
    for (let i = 0; i < points.length - 1; i += 3) {
      const segmentEnd = Math.min(i + 3, points.length - 1);
      const segment = points.slice(i, segmentEnd + 1);
      
      if (segment.length >= 4) {
        // Cubic Bézier curve
        const bezier = this.fitCubicBezier(segment);
        pathData += ` C ${bezier.cp1.x} ${bezier.cp1.y} ${bezier.cp2.x} ${bezier.cp2.y} ${bezier.end.x} ${bezier.end.y}`;
      } else if (segment.length === 3) {
        // Quadratic Bézier curve
        const bezier = this.fitQuadraticBezier(segment);
        pathData += ` Q ${bezier.cp.x} ${bezier.cp.y} ${bezier.end.x} ${bezier.end.y}`;
      } else if (segment.length === 2) {
        // Linear segment
        pathData += ` L ${segment[1].x} ${segment[1].y}`;
      }
    }

    if (contour.closed) {
      pathData += ' Z';
    }

    return pathData;
  }

  /**
   * Convert contour to linear path
   */
  private contourToLinearPath(contour: Contour): string {
    if (contour.points.length < 2) return '';

    const points = contour.points;
    let pathData = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }

    if (contour.closed) {
      pathData += ' Z';
    }

    return pathData;
  }

  /**
   * Fit cubic Bézier curve to point segment
   */
  private fitCubicBezier(points: ContourPoint[]): {
    cp1: ContourPoint;
    cp2: ContourPoint;
    end: ContourPoint;
  } {
    const start = points[0];
    const end = points[points.length - 1];
    
    // Simple approximation - use 1/3 and 2/3 points as control points
    const t1 = 1/3;
    const t2 = 2/3;
    
    const cp1 = {
      x: start.x + t1 * (end.x - start.x),
      y: start.y + t1 * (end.y - start.y)
    };
    
    const cp2 = {
      x: start.x + t2 * (end.x - start.x),
      y: start.y + t2 * (end.y - start.y)
    };

    return { cp1, cp2, end };
  }

  /**
   * Fit quadratic Bézier curve to point segment
   */
  private fitQuadraticBezier(points: ContourPoint[]): {
    cp: ContourPoint;
    end: ContourPoint;
  } {
    const start = points[0];
    const middle = points[1];
    const end = points[2];
    
    // Control point is approximately the middle point
    const cp = {
      x: 2 * middle.x - 0.5 * (start.x + end.x),
      y: 2 * middle.y - 0.5 * (start.y + end.y)
    };

    return { cp, end };
  }

  /**
   * Calculate bounding box for points
   */
  private calculateBounds(points: ContourPoint[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    if (points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Calculate contour length
   */
  private calculateContourLength(points: ContourPoint[]): number {
    if (points.length < 2) return 0;

    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }

    return length;
  }

  /**
   * Determine color for contour based on color map
   */
  private determineContourColor(contour: Contour, colorMap: Map<string, string>): string {
    // Simple implementation - return first color from map or default
    const colors = Array.from(colorMap.values());
    return colors.length > 0 ? colors[0] : '#000000';
  }

  /**
   * Calculate path complexity score
   */
  private calculatePathComplexity(pathData: string): number {
    // Simple complexity metric based on path length and command count
    const commands = pathData.match(/[MLHVCSQTAZ]/gi) || [];
    const coordinates = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g) || [];
    
    return commands.length + coordinates.length * 0.1;
  }
}

export default Vectorizer;