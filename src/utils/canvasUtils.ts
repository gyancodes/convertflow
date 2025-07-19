/**
 * Canvas manipulation utilities for image processing
 * Provides functions for loading PNG data, extracting ImageData, and basic preprocessing
 */

/**
 * Loads a PNG file into a canvas and returns ImageData
 */
export const loadImageToCanvas = async (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      } catch (error) {
        reject(new Error(`Failed to extract image data: ${error}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Extracts ImageData from an existing canvas
 */
export const extractImageData = (canvas: HTMLCanvasElement): ImageData => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Creates a canvas from ImageData
 */
export const createCanvasFromImageData = (imageData: ImageData): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
};

/**
 * Resizes ImageData to specified dimensions
 */
export const resizeImageData = (
  imageData: ImageData, 
  newWidth: number, 
  newHeight: number
): ImageData => {
  const canvas = createCanvasFromImageData(imageData);
  const ctx = canvas.getContext('2d')!;
  
  // Create new canvas with target dimensions
  const resizedCanvas = document.createElement('canvas');
  const resizedCtx = resizedCanvas.getContext('2d')!;
  
  resizedCanvas.width = newWidth;
  resizedCanvas.height = newHeight;
  
  // Use high-quality scaling
  resizedCtx.imageSmoothingEnabled = true;
  resizedCtx.imageSmoothingQuality = 'high';
  
  resizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
  
  return resizedCtx.getImageData(0, 0, newWidth, newHeight);
};

/**
 * Normalizes image data by adjusting brightness and contrast
 */
export const normalizeImageData = (imageData: ImageData): ImageData => {
  const data = new Uint8ClampedArray(imageData.data);
  const pixels = data.length / 4;
  
  // Calculate histogram for each channel
  const histR = new Array(256).fill(0);
  const histG = new Array(256).fill(0);
  const histB = new Array(256).fill(0);
  
  for (let i = 0; i < pixels; i++) {
    const idx = i * 4;
    histR[data[idx]]++;
    histG[data[idx + 1]]++;
    histB[data[idx + 2]]++;
  }
  
  // Find min and max values for each channel
  const findMinMax = (hist: number[]) => {
    let min = 0, max = 255;
    for (let i = 0; i < 256; i++) {
      if (hist[i] > 0) {
        min = i;
        break;
      }
    }
    for (let i = 255; i >= 0; i--) {
      if (hist[i] > 0) {
        max = i;
        break;
      }
    }
    return { min, max };
  };
  
  const { min: minR, max: maxR } = findMinMax(histR);
  const { min: minG, max: maxG } = findMinMax(histG);
  const { min: minB, max: maxB } = findMinMax(histB);
  
  // Normalize each channel
  for (let i = 0; i < pixels; i++) {
    const idx = i * 4;
    
    if (maxR > minR) {
      data[idx] = Math.round(((data[idx] - minR) / (maxR - minR)) * 255);
    }
    if (maxG > minG) {
      data[idx + 1] = Math.round(((data[idx + 1] - minG) / (maxG - minG)) * 255);
    }
    if (maxB > minB) {
      data[idx + 2] = Math.round(((data[idx + 2] - minB) / (maxB - minB)) * 255);
    }
  }
  
  return new ImageData(data, imageData.width, imageData.height);
};

/**
 * Handles alpha channel processing
 */
export const processAlphaChannel = (
  imageData: ImageData, 
  options: { 
    preserveTransparency?: boolean;
    backgroundColor?: { r: number; g: number; b: number };
  } = {}
): ImageData => {
  const { preserveTransparency = true, backgroundColor = { r: 255, g: 255, b: 255 } } = options;
  const data = new Uint8ClampedArray(imageData.data);
  const pixels = data.length / 4;
  
  if (!preserveTransparency) {
    // Blend with background color
    for (let i = 0; i < pixels; i++) {
      const idx = i * 4;
      const alpha = data[idx + 3] / 255;
      
      data[idx] = Math.round(data[idx] * alpha + backgroundColor.r * (1 - alpha));
      data[idx + 1] = Math.round(data[idx + 1] * alpha + backgroundColor.g * (1 - alpha));
      data[idx + 2] = Math.round(data[idx + 2] * alpha + backgroundColor.b * (1 - alpha));
      data[idx + 3] = 255; // Set alpha to fully opaque
    }
  }
  
  return new ImageData(data, imageData.width, imageData.height);
};

/**
 * Gets pixel value at specific coordinates
 */
export const getPixel = (imageData: ImageData, x: number, y: number): [number, number, number, number] => {
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
    return [0, 0, 0, 0];
  }
  
  const idx = (y * imageData.width + x) * 4;
  return [
    imageData.data[idx],     // R
    imageData.data[idx + 1], // G
    imageData.data[idx + 2], // B
    imageData.data[idx + 3]  // A
  ];
};

/**
 * Sets pixel value at specific coordinates
 */
export const setPixel = (
  imageData: ImageData, 
  x: number, 
  y: number, 
  r: number, 
  g: number, 
  b: number, 
  a: number = 255
): void => {
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
    return;
  }
  
  const idx = (y * imageData.width + x) * 4;
  imageData.data[idx] = r;
  imageData.data[idx + 1] = g;
  imageData.data[idx + 2] = b;
  imageData.data[idx + 3] = a;
};

/**
 * Converts RGB to HSL color space
 */
export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }
  
  return [h * 360, s * 100, l * 100];
};

/**
 * Converts HSL to RGB color space
 */
export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/**
 * Converts RGB to LAB color space
 */
export const rgbToLab = (r: number, g: number, b: number): [number, number, number] => {
  // Convert RGB to XYZ
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;
  
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;
  
  rNorm *= 100;
  gNorm *= 100;
  bNorm *= 100;
  
  // Observer = 2°, Illuminant = D65
  let x = rNorm * 0.4124 + gNorm * 0.3576 + bNorm * 0.1805;
  let y = rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722;
  let z = rNorm * 0.0193 + gNorm * 0.1192 + bNorm * 0.9505;
  
  x /= 95.047;
  y /= 100.000;
  z /= 108.883;
  
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
  
  const L = (116 * y) - 16;
  const A = 500 * (x - y);
  const B = 200 * (y - z);
  
  return [L, A, B];
};

/**
 * Calculates color distance in LAB color space
 */
export const colorDistance = (
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number => {
  const [l1, a1, b1Lab] = rgbToLab(r1, g1, b1);
  const [l2, a2, b2Lab] = rgbToLab(r2, g2, b2);
  
  const deltaL = l1 - l2;
  const deltaA = a1 - a2;
  const deltaB = b1Lab - b2Lab;
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
};

export default {
  loadImageToCanvas,
  extractImageData,
  createCanvasFromImageData,
  resizeImageData,
  normalizeImageData,
  processAlphaChannel,
  getPixel,
  setPixel,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  colorDistance,
};