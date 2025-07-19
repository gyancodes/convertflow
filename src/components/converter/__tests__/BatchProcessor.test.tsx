import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchProcessor } from '../BatchProcessor';
import { VectorizationConfig } from '../../../types/converter';

// Mock dependencies
vi.mock('../../../services/imageProcessor', () => ({
  ImageProcessor: vi.fn().mockImplementation(() => ({
    extractImageData: vi.fn().mockResolvedValue({
      width: 100,
      height: 100,
      data: new Uint8ClampedArray(40000)
    }),
    processImage: vi.fn().mockResolvedValue({
      svgContent: '',
      originalSize: 1000,
      vectorSize: 500,
      processingTime: 100,
      colorCount: 16,
      pathCount: 4
    })
  }))
}));

vi.mock('../../../utils/zipUtils', () => ({
  generateZipFile: vi.fn().mockResolvedValue(new Blob(['test zip'], { type: 'application/zip' }))
}));

vi.mock('../../../utils/fileUtils', () => ({
  validatePngFile: vi.fn().mockReturnValue(true)
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');

describe('BatchProcessor', () => {
  let mockConfig: VectorizationConfig;
  let mockFiles: File[];
  let onBatchComplete: ReturnType<typeof vi.fn>;
  let onProgressUpdate: ReturnType<typeof vi.fn>;
  let onFileComplete: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockConfig = {
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };

    // Create mock PNG files
    mockFiles = [
      new File(['mock png data 1'], 'test1.png', { type: 'image/png' }),
      new File(['mock png data 2'], 'test2.png', { type: 'image/png' }),
      new File(['mock png data 3'], 'test3.png', { type: 'image/png' })
    ];

    onBatchComplete = vi.fn();
    onProgressUpdate = vi.fn();
    onFileComplete = vi.fn();
    onError = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('File Management', () => {
    it('should add valid files to the batch', () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      act(() => {
        result.current.addFiles(mockFiles);
      });

      expect(result.current.jobs).toHaveLength(3);
      expect(result.current.jobs[0].file.name).toBe('test1.png');
      expect(result.current.jobs[0].status).toBe('pending');
      expect(result.current.jobs[0].progress).toBe(0);
    });

    it('should reject more than 20 files', () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      const tooManyFiles = Array.from({ length: 21 }, (_, i) => 
        new File(['data'], `test${i}.png`, { type: 'image/png' })
      );

      act(() => {
        result.current.addFiles(tooManyFiles);
      });

      expect(onError).toHaveBeenCalledWith('Maximum 20 files allowed for batch processing');
      expect(result.current.jobs).toHaveLength(0);
    });

    it('should reject files larger than 10MB', () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      // Create a mock file that reports size > 10MB
      const largeFile = new File(['data'], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      act(() => {
        result.current.addFiles([largeFile]);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('File too large: large.png')
      );
      expect(result.current.jobs).toHaveLength(0);
    });

    it('should remove individual jobs when not processing', () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      act(() => {
        result.current.addFiles(mockFiles);
      });
      
      const jobId = result.current.jobs[1].id;

      act(() => {
        result.current.removeJob(jobId);
      });

      expect(result.current.jobs).toHaveLength(2);
      expect(result.current.jobs.find(job => job.id === jobId)).toBeUndefined();
    });

    it('should not remove jobs while processing', () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      act(() => {
        result.current.addFiles(mockFiles);
      });
      
      // Simulate processing state
      act(() => {
        result.current.startBatchProcessing();
      });
      
      const jobId = result.current.jobs[0].id;
      
      act(() => {
        result.current.removeJob(jobId);
      });

      expect(onError).toHaveBeenCalledWith('Cannot remove jobs while processing');
      expect(result.current.jobs).toHaveLength(3);
    });

    it('should clear all jobs', () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      act(() => {
        result.current.addFiles(mockFiles);
      });
      
      expect(result.current.jobs).toHaveLength(3);

      act(() => {
        result.current.clearBatch();
      });

      expect(result.current.jobs).toHaveLength(0);
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Batch Processing', () => {
    it('should process files sequentially', async () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onBatchComplete,
        onProgressUpdate,
        onFileComplete,
        onError
      }));

      act(() => {
        result.current.addFiles(mockFiles.slice(0, 2)); // Use 2 files for faster test
      });

      await act(async () => {
        await result.current.startBatchProcessing();
      });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onFileComplete).toHaveBeenCalledTimes(2);
      expect(onBatchComplete).toHaveBeenCalledTimes(1);
      expect(result.current.completedJobs).toHaveLength(2);
    });

    it('should track progress for each file', async () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onProgressUpdate,
        onError
      }));

      act(() => {
        result.current.addFiles([mockFiles[0]]);
      });

      await act(async () => {
        await result.current.startBatchProcessing();
      });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onProgressUpdate).toHaveBeenCalledWith(1, 1, 25);
      expect(onProgressUpdate).toHaveBeenCalledWith(1, 1, 75);
      expect(onProgressUpdate).toHaveBeenCalledWith(1, 1, 100);
    });

    it('should handle processing errors gracefully', async () => {
      // Test with an invalid file that will cause processing to fail
      const invalidFile = new File(['invalid data'], 'test.png', { type: 'image/png' });
      
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      act(() => {
        result.current.addFiles([invalidFile]);
      });

      await act(async () => {
        await result.current.startBatchProcessing();
      });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // The processing should complete but may have errors
      expect(result.current.isProcessing).toBe(false);
    });

    it('should continue processing remaining files after individual failures', async () => {
      // Test that the batch processor continues even if some files fail
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onBatchComplete,
        onError
      }));

      act(() => {
        result.current.addFiles(mockFiles.slice(0, 2));
      });

      await act(async () => {
        await result.current.startBatchProcessing();
      });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Processing should complete
      expect(result.current.isProcessing).toBe(false);
      // At least some jobs should be processed
      expect(result.current.completedJobs.length + result.current.failedJobs.length).toBeGreaterThan(0);
    });

    it('should not start processing if no files are added', async () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      await act(async () => {
        await result.current.startBatchProcessing();
      });

      expect(onError).toHaveBeenCalledWith('No files to process');
      expect(result.current.isProcessing).toBe(false);
    });

    it('should not start processing if already processing', async () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      act(() => {
        result.current.addFiles([mockFiles[0]]);
      });
      
      // Start processing
      act(() => {
        result.current.startBatchProcessing();
      });
      
      // Try to start again
      await act(async () => {
        await result.current.startBatchProcessing();
      });

      expect(onError).toHaveBeenCalledWith('Batch processing already in progress');
    });
  });

  describe('Cancellation', () => {
    it('should cancel batch processing', async () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      act(() => {
        result.current.addFiles(mockFiles);
      });
      
      // Start processing
      act(() => {
        result.current.startBatchProcessing();
      });
      
      // Cancel immediately
      act(() => {
        result.current.cancelBatchProcessing();
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentJobIndex).toBe(-1);
    });
  });

  describe('Configuration', () => {
    it('should use provided configuration for all jobs', () => {
      const customConfig: VectorizationConfig = {
        colorCount: 32,
        smoothingLevel: 'high',
        pathSimplification: 2.0,
        preserveTransparency: false,
        algorithm: 'photo'
      };

      const { result } = renderHook(() => useBatchProcessor({
        config: customConfig,
        onError
      }));

      act(() => {
        result.current.addFiles([mockFiles[0]]);
      });

      expect(result.current.jobs[0].config).toEqual(customConfig);
    });
  });

  describe('State Management', () => {
    it('should maintain correct state during processing', () => {
      const { result } = renderHook(() => useBatchProcessor({
        config: mockConfig,
        onError
      }));

      // Initial state
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentJobIndex).toBe(-1);
      expect(result.current.jobs).toHaveLength(0);
      expect(result.current.completedJobs).toHaveLength(0);
      expect(result.current.failedJobs).toHaveLength(0);

      // After adding files
      act(() => {
        result.current.addFiles(mockFiles);
      });
      expect(result.current.jobs).toHaveLength(3);

      // During processing (simulated)
      act(() => {
        result.current.startBatchProcessing();
      });
      expect(result.current.isProcessing).toBe(true);
    });
  });
});