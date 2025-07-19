import { ColorPalette } from "../types/vectorization";

/**
 * Color quantization algorithms for reducing color palette in images
 */
export class ColorQuantizer {
  /**
   * Quantize colors using k-means clustering algorithm
   * @param imageData - Input image data
   * @param colorCount - Target number of colors (2-256)
   * @param maxIterations - Maximum iterations for k-means convergence
   * @returns Quantized color palette
   */
  async quantizeKMeans(
    imageData: ImageData,
    colorCount: number,
    maxIterations: number = 20 // Reduced from 50 to prevent hanging
  ): Promise<ColorPalette> {
    const pixels = this.extractPixels(imageData);

    // Limit pixel count for performance
    const maxPixels = 10000;
    const sampledPixels = pixels.length > maxPixels 
      ? this.samplePixels(pixels, maxPixels)
      : pixels;

    // Initialize centroids randomly
    let centroids = this.initializeRandomCentroids(sampledPixels, colorCount);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const clusters = this.assignPixelsToClusters(sampledPixels, centroids);
      const newCentroids = this.updateCentroids(clusters);

      // Check for convergence
      if (this.centroidsConverged(centroids, newCentroids)) {
        break;
      }

      centroids = newCentroids;

      // Yield control to prevent blocking
      if (iteration % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Calculate weights based on cluster sizes
    const weights = centroids.map((_, index) =>
      this.getClusterSize(sampledPixels, centroids, index)
    );

    return {
      colors: centroids.map((c) => ({ r: c.r, g: c.g, b: c.b, a: c.a })),
      weights,
    };
  }

  /**
   * Quantize colors using median cut algorithm
   * @param imageData - Input image data
   * @param colorCount - Target number of colors (must be power of 2)
   * @returns Quantized color palette
   */
  async quantizeMedianCut(
    imageData: ImageData,
    colorCount: number
  ): Promise<ColorPalette> {
    const pixels = this.extractPixels(imageData);

    // Ensure colorCount is power of 2 for median cut
    const targetColors = Math.pow(2, Math.floor(Math.log2(colorCount)));

    const buckets = this.medianCutRecursive([pixels], targetColors);
    const colors = buckets.map((bucket) => this.calculateBucketAverage(bucket));
    const weights = buckets.map((bucket) => bucket.length);

    return {
      colors: colors.map((c) => ({ r: c.r, g: c.g, b: c.b, a: c.a })),
      weights,
    };
  }

  /**
   * Extract color palette from image without quantization
   * @param imageData - Input image data
   * @param maxColors - Maximum number of unique colors to extract
   * @returns Color palette with frequency information
   */
  extractPalette(imageData: ImageData, maxColors: number = 256): ColorPalette {
    const colorMap = new Map<string, { color: Color; count: number }>();
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const key = `${r},${g},${b},${a}`;
      const existing = colorMap.get(key);

      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, {
          color: { r, g, b, a },
          count: 1,
        });
      }
    }

    // Sort by frequency and take top colors
    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxColors);

    return {
      colors: sortedColors.map((item) => ({
        r: item.color.r,
        g: item.color.g,
        b: item.color.b,
        a: item.color.a,
      })),
      weights: sortedColors.map((item) => item.count),
    };
  }

  /**
   * Map image pixels to quantized palette
   * @param imageData - Original image data
   * @param palette - Quantized color palette
   * @returns New ImageData with quantized colors
   */
  mapToQuantizedPalette(
    imageData: ImageData,
    palette: ColorPalette
  ): ImageData {
    const newImageData = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const newData = newImageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const originalColor = {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a: data[i + 3],
      };

      const closestColor = this.findClosestColor(originalColor, palette.colors);

      newData[i] = closestColor.r;
      newData[i + 1] = closestColor.g;
      newData[i + 2] = closestColor.b;
      newData[i + 3] = closestColor.a || 255;
    }

    return newImageData;
  }

  // Private helper methods
  private extractPixels(imageData: ImageData): Color[] {
    const pixels: Color[] = [];
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a: data[i + 3],
      });
    }

    return pixels;
  }

  private samplePixels(pixels: Color[], maxCount: number): Color[] {
    if (pixels.length <= maxCount) return pixels;
    
    const step = Math.floor(pixels.length / maxCount);
    const sampled: Color[] = [];
    
    for (let i = 0; i < pixels.length; i += step) {
      sampled.push(pixels[i]);
      if (sampled.length >= maxCount) break;
    }
    
    return sampled;
  }

  private initializeRandomCentroids(pixels: Color[], count: number): Color[] {
    const centroids: Color[] = [];

    // If we have fewer unique colors than requested centroids, handle specially
    const uniqueColors = this.getUniqueColors(pixels);

    if (uniqueColors.length <= count) {
      // Use all unique colors and add slight variations for remaining centroids
      centroids.push(...uniqueColors);

      for (let i = uniqueColors.length; i < count; i++) {
        const baseColor = uniqueColors[i % uniqueColors.length];
        centroids.push({
          r: Math.max(
            0,
            Math.min(255, baseColor.r + (Math.random() - 0.5) * 4)
          ),
          g: Math.max(
            0,
            Math.min(255, baseColor.g + (Math.random() - 0.5) * 4)
          ),
          b: Math.max(
            0,
            Math.min(255, baseColor.b + (Math.random() - 0.5) * 4)
          ),
          a: baseColor.a,
        });
      }
    } else {
      // Normal random initialization
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * pixels.length);
        centroids.push({ ...pixels[randomIndex] });
      }
    }

    return centroids;
  }

  private getUniqueColors(pixels: Color[]): Color[] {
    const uniqueMap = new Map<string, Color>();

    for (const pixel of pixels) {
      const key = `${pixel.r},${pixel.g},${pixel.b},${pixel.a}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, pixel);
      }
    }

    return Array.from(uniqueMap.values());
  }

  private assignPixelsToClusters(
    pixels: Color[],
    centroids: Color[]
  ): Color[][] {
    const clusters: Color[][] = centroids.map(() => []);

    for (const pixel of pixels) {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < centroids.length; i++) {
        const distance = this.colorDistance(pixel, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      clusters[closestCluster].push(pixel);
    }

    return clusters;
  }

  private updateCentroids(clusters: Color[][]): Color[] {
    return clusters.map((cluster) => {
      if (cluster.length === 0) {
        return { r: 0, g: 0, b: 0, a: 255 };
      }

      const sum = cluster.reduce(
        (acc, color) => ({
          r: acc.r + color.r,
          g: acc.g + color.g,
          b: acc.b + color.b,
          a: acc.a + color.a,
        }),
        { r: 0, g: 0, b: 0, a: 0 }
      );

      return {
        r: Math.round(sum.r / cluster.length),
        g: Math.round(sum.g / cluster.length),
        b: Math.round(sum.b / cluster.length),
        a: Math.round(sum.a / cluster.length),
      };
    });
  }

  private centroidsConverged(
    old: Color[],
    new_: Color[],
    threshold: number = 1
  ): boolean {
    for (let i = 0; i < old.length; i++) {
      if (this.colorDistance(old[i], new_[i]) > threshold) {
        return false;
      }
    }
    return true;
  }

  private getClusterSize(
    pixels: Color[],
    centroids: Color[],
    clusterIndex: number
  ): number {
    let count = 0;

    for (const pixel of pixels) {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < centroids.length; i++) {
        const distance = this.colorDistance(pixel, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      if (closestCluster === clusterIndex) {
        count++;
      }
    }

    return Math.max(1, count); // Ensure at least 1 to avoid zero weights
  }

  private medianCutRecursive(
    buckets: Color[][],
    targetBuckets: number
  ): Color[][] {
    if (buckets.length >= targetBuckets) {
      return buckets;
    }

    // Find bucket with largest range
    let maxRange = 0;
    let bucketToSplit = 0;

    for (let i = 0; i < buckets.length; i++) {
      const range = this.calculateColorRange(buckets[i]);
      if (range > maxRange) {
        maxRange = range;
        bucketToSplit = i;
      }
    }

    // Split the bucket
    const [bucket1, bucket2] = this.splitBucket(buckets[bucketToSplit]);
    const newBuckets = [
      ...buckets.slice(0, bucketToSplit),
      bucket1,
      bucket2,
      ...buckets.slice(bucketToSplit + 1),
    ];

    return this.medianCutRecursive(newBuckets, targetBuckets);
  }

  private calculateColorRange(colors: Color[]): number {
    if (colors.length === 0) return 0;

    const ranges = {
      r: { min: 255, max: 0 },
      g: { min: 255, max: 0 },
      b: { min: 255, max: 0 },
    };

    for (const color of colors) {
      ranges.r.min = Math.min(ranges.r.min, color.r);
      ranges.r.max = Math.max(ranges.r.max, color.r);
      ranges.g.min = Math.min(ranges.g.min, color.g);
      ranges.g.max = Math.max(ranges.g.max, color.g);
      ranges.b.min = Math.min(ranges.b.min, color.b);
      ranges.b.max = Math.max(ranges.b.max, color.b);
    }

    return Math.max(
      ranges.r.max - ranges.r.min,
      ranges.g.max - ranges.g.min,
      ranges.b.max - ranges.b.min
    );
  }

  private splitBucket(colors: Color[]): [Color[], Color[]] {
    if (colors.length <= 1) {
      return [colors, []];
    }

    // Find dimension with largest range
    const ranges = {
      r: { min: 255, max: 0 },
      g: { min: 255, max: 0 },
      b: { min: 255, max: 0 },
    };

    for (const color of colors) {
      ranges.r.min = Math.min(ranges.r.min, color.r);
      ranges.r.max = Math.max(ranges.r.max, color.r);
      ranges.g.min = Math.min(ranges.g.min, color.g);
      ranges.g.max = Math.max(ranges.g.max, color.g);
      ranges.b.min = Math.min(ranges.b.min, color.b);
      ranges.b.max = Math.max(ranges.b.max, color.b);
    }

    const rRange = ranges.r.max - ranges.r.min;
    const gRange = ranges.g.max - ranges.g.min;
    const bRange = ranges.b.max - ranges.b.min;

    let sortKey: keyof Color;
    if (rRange >= gRange && rRange >= bRange) {
      sortKey = "r";
    } else if (gRange >= bRange) {
      sortKey = "g";
    } else {
      sortKey = "b";
    }

    // Sort by the dimension with largest range
    const sortedColors = [...colors].sort((a, b) => a[sortKey] - b[sortKey]);
    const midpoint = Math.floor(sortedColors.length / 2);

    return [sortedColors.slice(0, midpoint), sortedColors.slice(midpoint)];
  }

  private calculateBucketAverage(colors: Color[]): Color {
    if (colors.length === 0) {
      return { r: 0, g: 0, b: 0, a: 255 };
    }

    const sum = colors.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
        a: acc.a + color.a,
      }),
      { r: 0, g: 0, b: 0, a: 0 }
    );

    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
      a: Math.round(sum.a / colors.length),
    };
  }

  private colorDistance(color1: Color, color2: Color): number {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    const da = (color1.a || 255) - (color2.a || 255);

    return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
  }

  private findClosestColor(
    target: Color,
    palette: Array<{ r: number; g: number; b: number; a?: number }>
  ): Color {
    let minDistance = Infinity;
    let closestColor = palette[0];

    for (const color of palette) {
      const colorWithAlpha: Color = {
        r: color.r,
        g: color.g,
        b: color.b,
        a: color.a || 255,
      };
      const distance = this.colorDistance(target, colorWithAlpha);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = colorWithAlpha;
      }
    }

    return closestColor;
  }
}

// Helper interface for color representation
interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export default ColorQuantizer;
