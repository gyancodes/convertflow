import React, { useState, useCallback, useRef } from 'react';
import { useBatchProcessor } from './BatchProcessor';
import { VectorizationConfig, ConversionJob, ProcessingResult } from '../../types/converter';
import { downloadZipFile } from '../../utils/zipUtils';
import { validateBatchFiles } from '../../utils/fileUtils';

interface BatchProcessorUIProps {
  /** Configuration to use for batch processing */
  config: VectorizationConfig;
  /** Callback when batch processing completes */
  onBatchComplete?: (results: ProcessingResult[]) => void;
}

interface BatchProgress {
  currentFile: number;
  totalFiles: number;
  currentProgress: number;
  overallProgress: number;
}

/**
 * UI component for batch processing PNG to SVG conversions
 */
export const BatchProcessorUI: React.FC<BatchProcessorUIProps> = ({
  config,
  onBatchComplete
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    currentFile: 0,
    totalFiles: 0,
    currentProgress: 0,
    overallProgress: 0
  });
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchProcessor = useBatchProcessor({
    config,
    onBatchComplete: handleBatchComplete,
    onProgressUpdate: handleProgressUpdate,
    onFileComplete: handleFileComplete,
    onError: handleError
  });

  /**
   * Handle batch completion
   */
  function handleBatchComplete(results: ProcessingResult[], zipBlob: Blob) {
    setStatusMessage(`Batch processing completed! ${results.length} files converted successfully.`);
    setProgress(prev => ({ ...prev, overallProgress: 100 }));
    
    // Trigger download of ZIP file
    downloadZipFile(zipBlob, `png_to_svg_batch_${new Date().toISOString().split('T')[0]}.zip`);
    
    onBatchComplete?.(results);
  }

  /**
   * Handle progress updates
   */
  function handleProgressUpdate(currentFile: number, totalFiles: number, currentProgress: number) {
    const overallProgress = ((currentFile - 1) / totalFiles * 100) + (currentProgress / totalFiles);
    
    setProgress({
      currentFile,
      totalFiles,
      currentProgress,
      overallProgress: Math.round(overallProgress)
    });

    setStatusMessage(`Processing file ${currentFile} of ${totalFiles}...`);
  }

  /**
   * Handle individual file completion
   */
  function handleFileComplete(job: ConversionJob) {
    console.log(`Completed processing: ${job.file.name}`);
  }

  /**
   * Handle errors
   */
  function handleError(error: string, fileIndex?: number) {
    const errorMsg = fileIndex !== undefined 
      ? `Error processing file ${fileIndex + 1}: ${error}`
      : error;
    
    setErrorMessage(errorMsg);
    console.error('Batch processing error:', errorMsg);
  }

  /**
   * Handle file selection via input
   */
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await processSelectedFiles(files);
    
    // Reset input value to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Handle drag and drop events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    await processSelectedFiles(files);
  }, []);

  /**
   * Process selected files
   */
  const processSelectedFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setErrorMessage('');
    setStatusMessage('Validating files...');

    try {
      // Validate files
      const { validFiles, invalidFiles } = await validateBatchFiles(files);

      if (invalidFiles.length > 0) {
        const errorMessages = invalidFiles.map(({ file, error }) => `${file.name}: ${error}`);
        setErrorMessage(`Some files are invalid:\n${errorMessages.join('\n')}`);
      }

      if (validFiles.length === 0) {
        setStatusMessage('No valid files to process.');
        return;
      }

      // Add files to batch processor
      batchProcessor.addFiles(validFiles);
      setStatusMessage(`Added ${validFiles.length} files to batch. Click "Start Processing" to begin.`);
      
    } catch (error) {
      setErrorMessage(`Error validating files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Start batch processing
   */
  const startProcessing = useCallback(() => {
    setErrorMessage('');
    setStatusMessage('Starting batch processing...');
    batchProcessor.startBatchProcessing();
  }, []);

  /**
   * Cancel batch processing
   */
  const cancelProcessing = useCallback(() => {
    batchProcessor.cancelBatchProcessing();
    setStatusMessage('Batch processing cancelled.');
    setProgress({ currentFile: 0, totalFiles: 0, currentProgress: 0, overallProgress: 0 });
  }, []);

  /**
   * Clear all files from batch
   */
  const clearBatch = useCallback(() => {
    batchProcessor.clearBatch();
    setStatusMessage('');
    setErrorMessage('');
    setProgress({ currentFile: 0, totalFiles: 0, currentProgress: 0, overallProgress: 0 });
  }, []);

  return (
    <div className="batch-processor-ui p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Batch PNG to SVG Converter</h2>
      
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium">Drop PNG files here or click to select</p>
            <p className="text-sm text-gray-500 mt-2">
              Maximum 20 files, up to 10MB each
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={batchProcessor.isProcessing}
          >
            Select Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* File List */}
      {batchProcessor.jobs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">
            Files in Batch ({batchProcessor.jobs.length})
          </h3>
          <div className="max-h-40 overflow-y-auto border rounded">
            {batchProcessor.jobs.map((job, index) => (
              <div
                key={job.id}
                className={`flex items-center justify-between p-2 border-b last:border-b-0 ${
                  index === batchProcessor.currentJobIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono">
                    {index + 1}.
                  </span>
                  <span className="text-sm">{job.file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(job.file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                  {!batchProcessor.isProcessing && (
                    <button
                      onClick={() => batchProcessor.removeJob(job.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Section */}
      {batchProcessor.isProcessing && (
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{progress.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.overallProgress}%` }}
              />
            </div>
          </div>
          
          {progress.totalFiles > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Current File ({progress.currentFile}/{progress.totalFiles})</span>
                <span>{progress.currentProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.currentProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="mt-6 flex space-x-3">
        {!batchProcessor.isProcessing ? (
          <>
            <button
              onClick={startProcessing}
              disabled={batchProcessor.jobs.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Start Processing
            </button>
            <button
              onClick={clearBatch}
              disabled={batchProcessor.jobs.length === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Clear All
            </button>
          </>
        ) : (
          <button
            onClick={cancelProcessing}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Cancel Processing
          </button>
        )}
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 whitespace-pre-line">
          {errorMessage}
        </div>
      )}

      {/* Summary */}
      {(batchProcessor.completedJobs.length > 0 || batchProcessor.failedJobs.length > 0) && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Processing Summary</h4>
          <div className="text-sm space-y-1">
            <div>✅ Completed: {batchProcessor.completedJobs.length}</div>
            <div>❌ Failed: {batchProcessor.failedJobs.length}</div>
            <div>📊 Total: {batchProcessor.jobs.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessorUI;