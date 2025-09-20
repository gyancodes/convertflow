import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateImageComplexity,
  estimateStageTimings,
  calculateTimeRemaining,
  ProgressTracker
} from '../progressUtils';

describe('progressUtils', () => {
  describe('calculateImageComplexity', () => {
    it('calculates complexity for small image', () => {
      const complexity = calculateImageComplexity(100, 100);
      
      expect(complexity.width).toBe(100);
      expect(complexity.height).toBe(100);
      expect(complexity.pixelCount).toBe(10000);
      expect(complexity.complexityScore).toBeLessThan(0.5);
    });

    it('calculates complexity for large image', () => {
      const complexity = calculateImageComplexity(1920, 1080);
      
      expect(complexity.pixelCount).toBe(2073600);
      expect(complexity.complexityScore).toBeGreaterThan(0.3);
    });

    it('handles custom color count', () => {
      const complexity = calculateImageComplexity(500, 500, 128);
      
      expect(complexity.colorCount).toBe(128);
    });

    it('penalizes extreme aspect ratios', () => {
      const normalRatio = calculateImageComplexity(500, 500);
      const extremeRatio = calculateImageComplexity(1000, 100);
      
      expect(extremeRatio.complexityScore).toBeGreaterThan(normalRatio.complexityScore);
    });

    it('caps complexity score at 1', () => {
      const complexity = calculateImageComplexity(5000, 5000, 256);
      
      expect(complexity.complexityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('estimateStageTimings', () => {
    it('scales timings based on complexity', () => {
      const lowComplexity = { width: 100, height: 100, pixelCount: 10000, colorCount: 16, complexityScore: 0.2 };
      const highComplexity = { width: 2000, height: 2000, pixelCount: 4000000, colorCount: 256, complexityScore: 0.8 };
      
      const lowTimings = estimateStageTimings(lowComplexity);
      const highTimings = estimateStageTimings(highComplexity);
      
      expect(highTimings.vectorize).toBeGreaterThan(lowTimings.vectorize);
      expect(highTimings.quantize).toBeGreaterThan(lowTimings.quantize);
    });

    it('applies higher multiplier to vectorization stage', () => {
      const complexity = { width: 1000, height: 1000, pixelCount: 1000000, colorCount: 128, complexityScore: 0.5 };
      const timings = estimateStageTimings(complexity);
      
      // Vectorization should take longer than other stages for complex images
      expect(timings.vectorize).toBeGreaterThan(timings.quantize);
      expect(timings.vectorize).toBeGreaterThan(timings.generate);
    });

    it('returns reasonable timing values', () => {
      const complexity = { width: 500, height: 500, pixelCount: 250000, colorCount: 64, complexityScore: 0.3 };
      const timings = estimateStageTimings(complexity);
      
      Object.values(timings).forEach(time => {
        expect(time).toBeGreaterThan(0);
        expect(time).toBeLessThan(30000); // Should be reasonable (< 30 seconds per stage)
      });
    });
  });

  describe('calculateTimeRemaining', () => {
    const mockTimings = {
      upload: 1000,
      preprocess: 2000,
      quantize: 3000,
      vectorize: 5000,
      generate: 1500
    };

    it('calculates time remaining for current stage', () => {
      const remaining = calculateTimeRemaining('quantize', 50, mockTimings);
      
      // 50% through quantize (1500ms remaining) + vectorize (5000ms) + generate (1500ms) = 8000ms
      expect(remaining).toBe(8000);
    });

    it('handles first stage', () => {
      const remaining = calculateTimeRemaining('upload', 25, mockTimings);
      
      // 75% of upload (750ms) + all other stages (11500ms) = 12250ms
      expect(remaining).toBe(12250);
    });

    it('handles last stage', () => {
      const remaining = calculateTimeRemaining('generate', 80, mockTimings);
      
      // 20% of generate remaining = 300ms
      expect(Math.round(remaining)).toBe(300);
    });

    it('adjusts based on actual elapsed time', () => {
      const startTime = Date.now() - 5000; // Started 5 seconds ago
      const remaining = calculateTimeRemaining('quantize', 50, mockTimings, startTime);
      
      // Should adjust based on actual vs expected timing
      expect(remaining).toBeGreaterThan(0);
    });

    it('handles invalid stage', () => {
      const remaining = calculateTimeRemaining('invalid' as any, 50, mockTimings);
      
      expect(remaining).toBe(0);
    });

    it('handles 100% progress', () => {
      const remaining = calculateTimeRemaining('quantize', 100, mockTimings);
      
      // Only remaining stages (vectorize + generate) = 6500ms
      expect(remaining).toBe(6500);
    });
  });

  describe('ProgressTracker', () => {
    let tracker: ProgressTracker;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      tracker = new ProgressTracker(800, 600, 64);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('initializes with correct complexity', () => {
      expect(tracker.getComplexityScore()).toBeGreaterThan(0);
      expect(tracker.getComplexityScore()).toBeLessThanOrEqual(1);
    });

    it('updates progress correctly', () => {
      const progress = tracker.updateProgress('quantize', 75);
      
      expect(progress.stage).toBe('quantize');
      expect(progress.progress).toBe(75);
      expect(progress.message).toContain('color');
      expect(progress.estimatedTimeRemaining).toBeDefined();
      expect(typeof progress.estimatedTimeRemaining).toBe('number');
    });

    it('clamps progress to valid range', () => {
      const negativeProgress = tracker.updateProgress('vectorize', -10);
      const excessiveProgress = tracker.updateProgress('vectorize', 150);
      
      expect(negativeProgress.progress).toBe(0);
      expect(excessiveProgress.progress).toBe(100);
    });

    it('provides stage-appropriate messages', () => {
      const uploadProgress = tracker.updateProgress('upload', 25);
      const vectorizeProgress = tracker.updateProgress('vectorize', 75);
      
      expect(uploadProgress.message).toContain('Reading');
      expect(vectorizeProgress.message).toContain('path');
    });

    it('provides different messages based on progress within stage', () => {
      const earlyProgress = tracker.updateProgress('preprocess', 20);
      const lateProgress = tracker.updateProgress('preprocess', 80);
      
      expect(earlyProgress.message).not.toBe(lateProgress.message);
    });

    it('calculates estimated total time', () => {
      const totalTime = tracker.getEstimatedTotalTime();
      
      expect(totalTime).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(60000); // Should be reasonable (< 1 minute)
    });

    it('handles time estimation updates', () => {
      vi.advanceTimersByTime(2000); // Advance time by 2 seconds
      
      const progress1 = tracker.updateProgress('preprocess', 50);
      
      vi.advanceTimersByTime(3000); // Advance another 3 seconds
      
      const progress2 = tracker.updateProgress('quantize', 25);
      
      expect(progress2.estimatedTimeRemaining).toBeDefined();
      expect(progress2.estimatedTimeRemaining).toBeGreaterThan(0);
    });

    it('provides consistent progress tracking', () => {
      const stages: Array<Parameters<typeof tracker.updateProgress>[0]> = 
        ['upload', 'preprocess', 'quantize', 'vectorize', 'generate'];
      
      stages.forEach(stage => {
        const progress = tracker.updateProgress(stage, 50);
        expect(progress.stage).toBe(stage);
        expect(progress.progress).toBe(50);
        expect(progress.message).toBeTruthy();
      });
    });
  });
});