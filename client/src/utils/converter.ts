import { apiService, ConversionRequest } from "../services/apiService";

export interface ConversionOptions {
  mode: "wrapper" | "vectorize";
  engine?: "potrace" | "imagetracer";
  preset?: string;
  scale?: number;
  strokeWidth?: number;
  numberOfColors?: number;
  ltres?: number;
  qtres?: number;
  // Potrace-specific options
  threshold?: number;
  turdSize?: number;
  alphaMax?: number;
  optCurve?: boolean;
  optTolerance?: number;
  turnPolicy?: string;
}

import ImageTracer from "imagetracerjs";

export const convertImageToSvg = async (
  file: File,
  options: ConversionOptions = { mode: "vectorize", engine: "potrace" },
): Promise<string> => {
  try {
    if (options.mode === "wrapper") {
      // Legacy wrapper mode - create SVG wrapper around image
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const base64Data = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
  <image width="${img.width}" height="${img.height}" xlink:href="${base64Data}"/>
</svg>`;
              resolve(svgContent);
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = base64Data;
          } catch (error) {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    } else if (options.engine === "imagetracer") {
      // Client-side ImageTracer conversion
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;

          // Map options to ImageTracer format
          const presetOptions = getPresetOptions(
            options.preset || "default",
            "imagetracer",
          );

          const tracerOptions = {
            ...presetOptions,
            scale: options.scale || 1,
            ltres: options.ltres,
            qtres: options.qtres,
            strokewidth: options.strokeWidth,
            numberofcolors: options.numberOfColors,
            viewbox: true, // Ensure viewBox is added
          };

          // ImageTracer.imageToSVG expects a URL or DataURL
          ImageTracer.imageToSVG(
            base64Data,
            (svgstr) => {
              if (svgstr) {
                resolve(svgstr);
              } else {
                reject(new Error("ImageTracer returned empty SVG"));
              }
            },
            tracerOptions,
          );
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    } else {
      // Server-side vectorization using backend API (Potrace)
      const conversionRequest: ConversionRequest = {
        engine: options.engine || "potrace",
        options: {
          // Potrace options
          threshold: options.threshold,
          turdSize: options.turdSize,
          alphaMax: options.alphaMax,
          optCurve: options.optCurve,
          optTolerance: options.optTolerance,
          turnPolicy: options.turnPolicy,
          // ImageTracer options (legacy fallback)
          ltres: options.ltres,
          qtres: options.qtres,
          scale: options.scale,
          strokewidth: options.strokeWidth,
          numberofcolors: options.numberOfColors,
          ...getPresetOptions(
            options.preset || "default",
            options.engine || "potrace",
          ),
        },
      };

      const response = await apiService.convertSingleImage(
        file,
        conversionRequest,
      );

      if (!response.success || !response.svgContent) {
        throw new Error(response.error || "Conversion failed");
      }

      return response.svgContent;
    }
  } catch (error) {
    throw new Error(
      `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

const getPresetOptions = (
  preset: string,
  engine: "potrace" | "imagetracer" = "potrace",
) => {
  if (engine === "potrace") {
    // Potrace presets
    const potracePresets: { [key: string]: any } = {
      default: {
        threshold: 128,
        turdSize: 2,
        optCurve: true,
        optTolerance: 0.2,
      },
      detailed: {
        threshold: 100,
        turdSize: 1,
        optCurve: true,
        optTolerance: 0.1,
      },
      smooth: {
        threshold: 150,
        turdSize: 4,
        optCurve: true,
        optTolerance: 0.3,
      },
      sharp: {
        threshold: 80,
        turdSize: 1,
        optCurve: false,
        optTolerance: 0.05,
      },
      posterized1: {
        threshold: 200,
        turdSize: 8,
        optCurve: true,
        optTolerance: 0.4,
      },
      posterized2: {
        threshold: 160,
        turdSize: 6,
        optCurve: true,
        optTolerance: 0.3,
      },
      posterized3: {
        threshold: 120,
        turdSize: 4,
        optCurve: true,
        optTolerance: 0.2,
      },
      artistic1: {
        threshold: 140,
        turdSize: 3,
        optCurve: true,
        optTolerance: 0.25,
      },
      artistic2: {
        threshold: 110,
        turdSize: 2,
        optCurve: true,
        optTolerance: 0.15,
      },
      artistic3: {
        threshold: 90,
        turdSize: 1,
        optCurve: true,
        optTolerance: 0.1,
      },
      artistic4: {
        threshold: 70,
        turdSize: 1,
        optCurve: false,
        optTolerance: 0.05,
      },
    };
    return potracePresets[preset] || potracePresets["default"];
  } else {
    // ImageTracer presets
    const imageTracerPresets: { [key: string]: any } = {
      default: { numberofcolors: 16, ltres: 1, qtres: 1 },
      posterized1: { numberofcolors: 2, ltres: 1, qtres: 1 },
      posterized2: { numberofcolors: 4, ltres: 1, qtres: 1 },
      posterized3: { numberofcolors: 8, ltres: 1, qtres: 1 },
      curvy: { numberofcolors: 16, ltres: 0.1, qtres: 1 },
      sharp: { numberofcolors: 16, ltres: 1, qtres: 0.01 },
      detailed: { numberofcolors: 64, ltres: 0.5, qtres: 0.5 },
      smoothed: { numberofcolors: 16, ltres: 0.1, qtres: 1 },
      grayscale: { numberofcolors: 7, ltres: 1, qtres: 1 },
      artistic1: { numberofcolors: 8, ltres: 0.1, qtres: 1 },
      artistic2: { numberofcolors: 16, ltres: 0.5, qtres: 0.5 },
      artistic3: { numberofcolors: 32, ltres: 0.1, qtres: 0.1 },
      artistic4: { numberofcolors: 64, ltres: 0.01, qtres: 0.01 },
    };
    return imageTracerPresets[preset] || imageTracerPresets["default"];
  }
};

// Keep the old function name for backward compatibility
export const convertPngToSvg = convertImageToSvg;

export const downloadSvg = (svgContent: string, fileName: string) => {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.replace(/\.[^/.]+$/, "") + ".svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateImageFile = (file: File): string | null => {
  const validTypes = ["image/png", "image/jpeg", "image/jpg"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return "Please select a PNG or JPEG file only.";
  }

  if (file.size > maxSize) {
    return "File size must be less than 10MB.";
  }

  return null;
};
