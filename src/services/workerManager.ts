/**
 * Web Worker Manager for handling background image processing
 * Manages worker lifecycle, job queuing, and communication
 */

import { VectorizationConfig, ProcessingResult } from '../types/converter';

interface WorkerJob {
  id: string;
  imageData: ImageData;
  config: VectorizationConfig;
  resolve: (result: ProcessingResult) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number, stage: string) => void;
}

interface WorkerMessage {
  type: 'process' | 'cancel';
  data?: {
    imageData: ImageData;
    config: VectorizationConfig;
    jobId: string;
  };
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: {
    jobId: string;
    progress?: number;
    stage?: string;
    result?: ProcessingResult;
    error?: string;
  };
}

export class WorkerManager {
  private worker: Worker | null = null;
  private jobs = new Map<string, WorkerJob>();
  private jobQueue: WorkerJob[] = [];
  private currentJob: WorkerJob | null = null;
  private isProcessing = false;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Create worker from the TypeScript file
      this.worker = new Worker(
        new URL('../workers/imageProcessingWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));
    } catch (error) {
      console.warn('Web Worker not supported, falling back to main thread processing');
      this.worker = null;
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { type, data } = event.data;

    if (!data?.jobId) return;

    const job = this.jobs.get(data.jobId);
    if (!job) return;

    switch (type) {
      case 'progress':
        if (job.onProgress && data.progress !== undefined && data.stage) {
          job.onProgress(data.progress, data.stage);
        }
        break;

      case 'complete':
        if (data.result) {
          job.resolve(data.result);
          this.jobs.delete(data.jobId);
          this.processNextJob();
        }
        break;

      case 'error':
        job.reject(new Error(data.error || 'Processing failed'));
        this.jobs.delete(data.jobId);
        this.processNextJob();
        break;
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Worker error:', error);
    
    // Reject current job if any
    if (this.currentJob) {
      this.currentJob.reject(new Error('Worker error: ' + error.message));
      this.jobs.delete(this.currentJob.id);
      this.currentJob = null;
    }

    // Reinitialize worker
    this.initializeWorker();
    this.processNextJob();
  }

  /**
   * Process image using Web Worker (or fallback to main thread)
   */
  async processImage(
    imageData: ImageData,
    config: VectorizationConfig,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ProcessingResult> {
    const jobId = this.generateJobId();

    return new Promise<ProcessingResult>((resolve, reject) => {
      const job: WorkerJob = {
        id: jobId,
        imageData,
        config,
        resolve,
        reject,
        onProgress
      };

      this.jobs.set(jobId, job);
      this.jobQueue.push(job);

      if (!this.isProcessing) {
        this.processNextJob();
      }
    });
  }

  private processNextJob() {
    if (this.jobQueue.length === 0) {
      this.isProcessing = false;
      this.currentJob = null;
      return;
    }

    this.isProcessing = true;
    this.currentJob = this.jobQueue.shift()!;

    if (this.worker) {
      // Use Web Worker
      const message: WorkerMessage = {
        type: 'process',
        data: {
          imageData: this.currentJob.imageData,
          config: this.currentJob.config,
          jobId: this.currentJob.id
        }
      };

      this.worker.postMessage(message);
    } else {
      // Fallback to main thread processing
      this.processInMainThread(this.currentJob);
    }
  }

  private async processInMainThread(job: WorkerJob) {
    try {
      // Import the main thread processor
      const { ImageProcessor } = await import('./imageProcessor');
      const processor = new ImageProcessor();

      // Simulate progress updates
      const progressStages = [
        'preprocessing',
        'color-quantization', 
        'edge-detection',
        'vectorization',
        'svg-generation'
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (job.onProgress && currentStage < progressStages.length) {
          job.onProgress(
            (currentStage / progressStages.length) * 100,
            progressStages[currentStage]
          );
          currentStage++;
        }
      }, 200);

      const result = await processor.processImage(job.imageData, job.config);
      
      clearInterval(progressInterval);
      
      if (job.onProgress) {
        job.onProgress(100, 'complete');
      }

      job.resolve(result);
      this.jobs.delete(job.id);
      this.processNextJob();
    } catch (error) {
      job.reject(error instanceof Error ? error : new Error('Processing failed'));
      this.jobs.delete(job.id);
      this.processNextJob();
    }
  }

  /**
   * Cancel a specific job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    // Remove from queue if not yet processing
    const queueIndex = this.jobQueue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      this.jobQueue.splice(queueIndex, 1);
      job.reject(new Error('Job cancelled'));
      this.jobs.delete(jobId);
      return true;
    }

    // Cancel current job if it matches
    if (this.currentJob?.id === jobId) {
      if (this.worker) {
        this.worker.postMessage({ type: 'cancel' });
      }
      
      job.reject(new Error('Job cancelled'));
      this.jobs.delete(jobId);
      this.currentJob = null;
      this.processNextJob();
      return true;
    }

    return false;
  }

  /**
   * Cancel all pending jobs
   */
  cancelAllJobs() {
    // Cancel queued jobs
    for (const job of this.jobQueue) {
      job.reject(new Error('Job cancelled'));
      this.jobs.delete(job.id);
    }
    this.jobQueue = [];

    // Cancel current job
    if (this.currentJob) {
      if (this.worker) {
        this.worker.postMessage({ type: 'cancel' });
      }
      
      this.currentJob.reject(new Error('Job cancelled'));
      this.jobs.delete(this.currentJob.id);
      this.currentJob = null;
    }

    this.isProcessing = false;
  }

  /**
   * Get current processing status
   */
  getStatus(): {
    isProcessing: boolean;
    queueLength: number;
    currentJobId: string | null;
  } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.jobQueue.length,
      currentJobId: this.currentJob?.id || null
    };
  }

  /**
   * Check if Web Workers are supported
   */
  isWorkerSupported(): boolean {
    return this.worker !== null;
  }

  /**
   * Terminate the worker and clean up
   */
  terminate() {
    this.cancelAllJobs();
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let workerManagerInstance: WorkerManager | null = null;

export const getWorkerManager = (): WorkerManager => {
  if (!workerManagerInstance) {
    workerManagerInstance = new WorkerManager();
  }
  return workerManagerInstance;
};

export default WorkerManager;