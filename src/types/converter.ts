/**
 * Core type definitions for PNG to SVG converter
 */

export interface VectorizationConfig {
  /** Number of colors to reduce to (2-256) */
  colorCount: number;
  /** Smoothing level for path generation */
  smoothingLevel: 'low' | 'medium' | 'high';
  /** Path simplification tolerance (0.1-10.0) */
  pathSimplification: number;
  /** Whether to preserve transparency information */
  preserveTransparency: boolean;
  /** Algorithm selection for different image types */
  algorithm: 'auto' | 'shapes' | 'photo' | 'lineart';
}

export interface ProcessingResult {
  /** Generated SVG content as string */
  svgContent: string;
  /** Original PNG file size in bytes */
  originalSize: number;
  /** Generated SVG size in bytes */
  vectorSize: number;
  /** Time taken for processing in milliseconds */
  processingTime: number;
  /** Number of colors in the final output */
  colorCount: number;
  /** Number of paths generated */
  pathCount: number;
}

export interface ConversionJob {
  /** Unique identifier for the job */
  id: string;
  /** Original PNG file */
  file: File;
  /** Configuration settings for this job */
  config: VectorizationConfig;
  /** Current status of the conversion */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Result data if completed successfully */
  result?: ProcessingResult;
  /** Error message if failed */
  error?: string;
}

export interface ConverterState {
  /** Array of conversion jobs */
  files: ConversionJob[];
  /** ID of currently processing job */
  currentJob: string | null;
  /** Global configuration settings */
  globalConfig: VectorizationConfig;
  /** Whether any processing is currently active */
  isProcessing: boolean;
  /** Whether batch mode is enabled */
  batchMode: boolean;
}

export interface ProcessingProgress {
  /** Current processing stage */
  stage: 'upload' | 'preprocess' | 'quantize' | 'vectorize' | 'generate';
  /** Progress percentage for current stage (0-100) */
  progress: number;
  /** Human-readable status message */
  message: string;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
}