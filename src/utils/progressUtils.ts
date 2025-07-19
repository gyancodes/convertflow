/**
 * Utilities for processing progress tracking and time estimation
 */

import { ProcessingProgress } from '../types/converter';

export interface ImageComplexity {
  /** Image dimensions */
  width: number;
  height: number;
  /** Total pixel count */
  pixelCount: number;
  /** Estimated color count */
  colorCount: number;
  /** Complexity score (0-1) */
  complexityScore: number;
}

export interface StageTimings {
  /** Base time for each stage in milliseconds */
  upload: number;
  preprocess: number;
  quantize: number;
  vectorize: number;
  generate: number;
}

/**
 * Default stage timings for average complexity images
 */
const DEFAULT_STAGE_TIMINGS: StageTimings = {
  upload: 500,
  preprocess: 1000,
  quantize: 2000,
  vectorize: 5000,
  generate: 1500
};

/**
 * Calculate image complexity based on dimensions and estimated properties
 */
export function calculateImageComplexity(
  width: number,
  height: number,
  estimatedColorCount?: number
): ImageComplexity {
  const pixelCount = width * height;
  const colorCount = estimatedColorCount || Math.min(256, Math.sqrt(pixelCount) * 2);
  
  // Complexity factors
  const sizeComplexity = Math.min(1, pixelCount / (1920 * 1080)); // Normalize to 1080p
  const colorComplexity = Math.min(1, colorCount / 256); // Normalize to max colors
  const aspectRatioComplexity = Math.abs(width / height - 1) * 0.1; // Penalty for extreme ratios
  
  const complexityScore = Math.min(1, 
    sizeComplexity * 0.5 + 
    colorComplexity * 0.4 + 
    aspectRatioComplexity * 0.1
  );

  return {
    width,
    height,
    pixelCount,
    colorCount,
    complexityScore
  };
}

/**
 * Estimate processing time for each stage based on image complexity
 */
export function estimateStageTimings(complexity: ImageComplexity): StageTimings {
  const multiplier = 1 + complexity.complexityScore * 2; // 1x to 3x based on complexity
  
  return {
    upload: DEFAULT_STAGE_TIMINGS.upload * Math.min(2, multiplier * 0.5),
    preprocess: DEFAULT_STAGE_TIMINGS.preprocess * multiplier,
    quantize: DEFAULT_STAGE_TIMINGS.quantize * multiplier,
    vectorize: DEFAULT_STAGE_TIMINGS.vectorize * multiplier * 1.5, // Vectorization is most complex
    generate: DEFAULT_STAGE_TIMINGS.generate * Math.min(2, multiplier * 0.8)
  };
}

/**
 * Calculate estimated time remaining for current processing stage
 */
export function calculateTimeRemaining(
  currentStage: ProcessingProgress['stage'],
  currentProgress: number,
  stageTimings: StageTimings,
  startTime?: number
): number {
  const stages: Array<keyof StageTimings> = ['upload', 'preprocess', 'quantize', 'vectorize', 'generate'];
  const currentStageIndex = stages.indexOf(currentStage);
  
  if (currentStageIndex === -1) return 0;
  
  // Time remaining in current stage
  const currentStageTime = stageTimings[currentStage];
  const currentStageRemaining = currentStageTime * (1 - currentProgress / 100);
  
  // Time for remaining stages
  const remainingStagesTime = stages
    .slice(currentStageIndex + 1)
    .reduce((total, stage) => total + stageTimings[stage], 0);
  
  const totalRemaining = currentStageRemaining + remainingStagesTime;
  
  // Adjust based on actual elapsed time if available
  if (startTime) {
    const elapsedTime = Date.now() - startTime;
    const expectedElapsedTime = stages
      .slice(0, currentStageIndex)
      .reduce((total, stage) => total + stageTimings[stage], 0) +
      stageTimings[currentStage] * (currentProgress / 100);
    
    if (expectedElapsedTime > 0) {
      const actualSpeedRatio = elapsedTime / expectedElapsedTime;
      return totalRemaining * actualSpeedRatio;
    }
  }
  
  return totalRemaining;
}

/**
 * Create a progress tracker that manages stage progression and time estimation
 */
export class ProgressTracker {
  private complexity: ImageComplexity;
  private stageTimings: StageTimings;
  private startTime: number;
  private currentStage: ProcessingProgress['stage'] = 'upload';
  private currentProgress = 0;

  constructor(width: number, height: number, estimatedColorCount?: number) {
    this.complexity = calculateImageComplexity(width, height, estimatedColorCount);
    this.stageTimings = estimateStageTimings(this.complexity);
    this.startTime = Date.now();
  }

  /**
   * Update the current processing stage and progress
   */
  updateProgress(stage: ProcessingProgress['stage'], progress: number): ProcessingProgress {
    this.currentStage = stage;
    this.currentProgress = Math.max(0, Math.min(100, progress));
    
    const estimatedTimeRemaining = calculateTimeRemaining(
      stage,
      this.currentProgress,
      this.stageTimings,
      this.startTime
    );

    const message = this.getStageMessage(stage, this.currentProgress);

    return {
      stage,
      progress: this.currentProgress,
      message,
      estimatedTimeRemaining
    };
  }

  /**
   * Get a descriptive message for the current stage and progress
   */
  private getStageMessage(stage: ProcessingProgress['stage'], progress: number): string {
    const messages = {
      upload: progress < 50 ? 'Reading image data...' : 'Validating image format...',
      preprocess: progress < 30 ? 'Analyzing image properties...' : 
                  progress < 70 ? 'Optimizing image size...' : 'Preparing for processing...',
      quantize: progress < 40 ? 'Analyzing color palette...' : 
                progress < 80 ? 'Reducing color count...' : 'Optimizing colors...',
      vectorize: progress < 25 ? 'Detecting edges...' : 
                 progress < 60 ? 'Tracing boundaries...' : 
                 progress < 90 ? 'Creating vector paths...' : 'Optimizing paths...',
      generate: progress < 50 ? 'Building SVG structure...' : 'Finalizing SVG output...'
    };

    return messages[stage];
  }

  /**
   * Get the complexity score for this image
   */
  getComplexityScore(): number {
    return this.complexity.complexityScore;
  }

  /**
   * Get estimated total processing time
   */
  getEstimatedTotalTime(): number {
    return Object.values(this.stageTimings).reduce((total, time) => total + time, 0);
  }
}