import { useState, useCallback, useRef } from 'react';
import { ConversionJob, VectorizationConfig, ProcessingResult } from '../../types/converter';
import { ImageProcessor } from '../../services/imageProcessor';
import { generateZipFile } from '../../utils/zipUtils';
import { validatePngFile } from '../../utils/fileUtils';

interface BatchProcessorOptions {
  /** Configuration to use for all files in the batch */
  config: VectorizationConfig;
  /** Callback when batch processing completes */
  onBatchComplete?: (results: ProcessingResult[], zipBlob: Blob) => void;
  /** Callback for progress updates */
  onProgressUpdate?: (currentFile: number, totalFiles: number, currentProgress: number) => void;
  /** Callback for individual file completion */
  onFileComplete?: (job: ConversionJob) => void;
  /** Callback for errors */
  onError?: (error: string, fileIndex?: number) => void;
}

interface BatchState {
  jobs: ConversionJob[];
  currentJobIndex: number;
  isProcessing: boolean;
  completedJobs: ConversionJob[];
  failedJobs: ConversionJob[];
}

/**
 * Custom hook for handling multiple file conversions
 * Processes files sequentially with individual progress tracking
 */
export const useBatchProcessor = ({
  config,
  onBatchComplete,
  onProgressUpdate,
  onFileComplete,
  onError
}: BatchProcessorOptions) => {
  const [batchState, setBatchState] = useState<BatchState>({
    jobs: [],
    currentJobIndex: -1,
    isProcessing: false,
    completedJobs: [],
    failedJobs: []
  });

  const imageProcessorRef = useRef<ImageProcessor>(new ImageProcessor());
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Add files to the batch processing queue
   */
  const addFiles = useCallback((files: File[]) => {
    // Validate file count (max 20 files as per requirements)
    if (files.length > 20) {
      onError?.('Maximum 20 files allowed for batch processing');
      return;
    }

    // Validate each file
    const validFiles = files.filter(file => {
      if (!validatePngFile(file)) {
        onError?.(`Invalid file format: ${file.name}. Only PNG files are supported.`);
        return false;
      }
      
      // Check file size (10MB limit as per requirements)
      if (file.size > 10 * 1024 * 1024) {
        onError?.(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    // Create conversion jobs
    const newJobs: ConversionJob[] = validFiles.map((file, index) => ({
      id: `batch_${Date.now()}_${index}`,
      file,
      config: { ...config },
      status: 'pending',
      progress: 0
    }));

    setBatchState(prev => ({
      ...prev,
      jobs: [...prev.jobs, ...newJobs]
    }));
  }, [config, onError]);

  /**
   * Start batch processing
   */
  const startBatchProcessing = useCallback(async () => {
    if (batchState.jobs.length === 0) {
      onError?.('No files to process');
      return;
    }

    if (batchState.isProcessing) {
      onError?.('Batch processing already in progress');
      return;
    }

    // Create abort controller for cancellation support
    abortControllerRef.current = new AbortController();

    setBatchState(prev => ({
      ...prev,
      isProcessing: true,
      currentJobIndex: 0,
      completedJobs: [],
      failedJobs: []
    }));

    try {
      await processBatchSequentially();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Batch processing failed');
    } finally {
      setBatchState(prev => ({
        ...prev,
        isProcessing: false,
        currentJobIndex: -1
      }));
    }
  }, [batchState.jobs, batchState.isProcessing]);

  /**
   * Process all jobs sequentially
   */
  const processBatchSequentially = async () => {
    const totalJobs = batchState.jobs.length;
    const completedJobs: ConversionJob[] = [];
    const failedJobs: ConversionJob[] = [];

    for (let i = 0; i < totalJobs; i++) {
      // Check for cancellation
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Batch processing was cancelled');
      }

      const job = batchState.jobs[i];
      
      // Update current job index
      setBatchState(prev => ({
        ...prev,
        currentJobIndex: i
      }));

      try {
        // Process individual file
        const processedJob = await processIndividualFile(job, i, totalJobs);
        completedJobs.push(processedJob);
        onFileComplete?.(processedJob);
        
        setBatchState(prev => ({
          ...prev,
          completedJobs: [...prev.completedJobs, processedJob]
        }));
      } catch (error) {
        const failedJob: ConversionJob = {
          ...job,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Processing failed'
        };
        
        failedJobs.push(failedJob);
        onError?.(failedJob.error!, i);
        
        setBatchState(prev => ({
          ...prev,
          failedJobs: [...prev.failedJobs, failedJob]
        }));
      }
    }

    // Generate ZIP file with completed conversions
    if (completedJobs.length > 0) {
      try {
        const zipBlob = await generateZipFile(completedJobs);
        const results = completedJobs.map(job => job.result!);
        onBatchComplete?.(results, zipBlob);
      } catch (error) {
        onError?.('Failed to generate ZIP file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  /**
   * Process a single file with progress tracking
   */
  const processIndividualFile = async (
    job: ConversionJob, 
    fileIndex: number, 
    totalFiles: number
  ): Promise<ConversionJob> => {
    // Update job status
    const updatedJob: ConversionJob = {
      ...job,
      status: 'processing',
      progress: 0
    };

    // Extract image data from file
    const imageData = await imageProcessorRef.current.extractImageData(job.file);
    
    // Update progress
    updatedJob.progress = 25;
    onProgressUpdate?.(fileIndex + 1, totalFiles, 25);

    // Process image (this is a simplified version - actual processing would involve other services)
    const result = await imageProcessorRef.current.processImage(imageData, job.config);
    
    // Update progress
    updatedJob.progress = 75;
    onProgressUpdate?.(fileIndex + 1, totalFiles, 75);

    // For now, generate a simple SVG placeholder since other services aren't implemented yet
    const svgContent = generatePlaceholderSVG(imageData.width, imageData.height, job.file.name);
    
    const finalResult: ProcessingResult = {
      ...result,
      svgContent,
      vectorSize: svgContent.length,
      colorCount: 16, // Placeholder
      pathCount: 4 // Placeholder
    };

    // Complete the job
    updatedJob.status = 'completed';
    updatedJob.progress = 100;
    updatedJob.result = finalResult;
    
    onProgressUpdate?.(fileIndex + 1, totalFiles, 100);

    return updatedJob;
  };

  /**
   * Cancel batch processing
   */
  const cancelBatchProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setBatchState(prev => ({
      ...prev,
      isProcessing: false,
      currentJobIndex: -1
    }));
  }, []);

  /**
   * Clear all jobs from the batch
   */
  const clearBatch = useCallback(() => {
    if (batchState.isProcessing) {
      cancelBatchProcessing();
    }
    
    setBatchState({
      jobs: [],
      currentJobIndex: -1,
      isProcessing: false,
      completedJobs: [],
      failedJobs: []
    });
  }, [batchState.isProcessing, cancelBatchProcessing]);

  /**
   * Remove a specific job from the batch
   */
  const removeJob = useCallback((jobId: string) => {
    if (batchState.isProcessing) {
      onError?.('Cannot remove jobs while processing');
      return;
    }
    
    setBatchState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(job => job.id !== jobId)
    }));
  }, [batchState.isProcessing, onError]);

  return {
    // State
    jobs: batchState.jobs,
    currentJobIndex: batchState.currentJobIndex,
    isProcessing: batchState.isProcessing,
    completedJobs: batchState.completedJobs,
    failedJobs: batchState.failedJobs,
    
    // Actions
    addFiles,
    startBatchProcessing,
    cancelBatchProcessing,
    clearBatch,
    removeJob
  };
};

// Legacy export for backward compatibility
export const BatchProcessor = useBatchProcessor;

/**
 * Generate a placeholder SVG for testing purposes
 */
const generatePlaceholderSVG = (width: number, height: number, filename: string): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated from ${filename} -->
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">
    Converted from ${filename}
  </text>
</svg>`;
};

export default BatchProcessor;