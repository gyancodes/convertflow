/**
 * Error handling utilities for PNG to SVG converter operations
 */

import { ErrorType, ConversionError } from '../types/errors';
import { ErrorHandler, ConversionErrorImpl } from '../services/errorHandler';
import { VectorizationConfig } from '../types/converter';

// Global error handler instance
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Get or create the global error handler instance
 */
export function getErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler({
      enableRetry: true,
      collectAnalytics: true,
      retryConfig: {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
        maxDelay: 10000
      }
    });
  }
  return globalErrorHandler;
}

/**
 * Wrap file validation operations with error handling
 */
export async function withFileValidation<T>(
  operation: () => Promise<T>,
  file?: File
): Promise<T> {
  const errorHandler = getErrorHandler();
  
  try {
    return await operation();
  } catch (error) {
    const conversionError = createFileValidationError(error, file);
    throw await errorHandler.handleError(conversionError, operation);
  }
}

/**
 * Wrap image processing operations with error handling
 */
export async function withImageProcessing<T>(
  operation: () => Promise<T>,
  context?: {
    imageData?: ImageData;
    config?: VectorizationConfig;
    imageProcessor?: any;
  }
): Promise<T> {
  const errorHandler = getErrorHandler();
  
  try {
    return await operation();
  } catch (error) {
    const conversionError = createProcessingError(error, context);
    return await errorHandler.handleError(conversionError, operation, context);
  }
}

/**
 * Wrap SVG generation operations with error handling
 */
export async function withSvgGeneration<T>(
  operation: () => Promise<T>,
  context?: {
    paths?: any[];
    config?: VectorizationConfig;
  }
): Promise<T> {
  const errorHandler = getErrorHandler();
  
  try {
    return await operation();
  } catch (error) {
    const conversionError = createSvgGenerationError(error, context);
    throw await errorHandler.handleError(conversionError, operation, context);
  }
}

/**
 * Create file validation error
 */
function createFileValidationError(error: any, file?: File): ConversionError {
  const errorHandler = getErrorHandler();
  
  // Determine error type based on error message or properties
  let errorType = ErrorType.FILE_INVALID;
  let message = 'File validation failed';
  
  if (error.message) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('size') || msg.includes('large')) {
      errorType = ErrorType.FILE_TOO_LARGE;
      message = 'File is too large for processing';
    } else if (msg.includes('corrupt') || msg.includes('invalid') || msg.includes('signature')) {
      errorType = ErrorType.FILE_CORRUPTED;
      message = 'File appears to be corrupted or invalid';
    } else if (msg.includes('format') || msg.includes('type')) {
      errorType = ErrorType.FILE_UNSUPPORTED;
      message = 'File format is not supported';
    } else {
      message = error.message;
    }
  }
  
  const context: Record<string, any> = {};
  if (file) {
    context.fileName = file.name;
    context.fileSize = file.size;
    context.fileType = file.type;
    context.maxSize = '10MB';
  }
  
  return errorHandler.createError(message, errorType, error, context);
}

/**
 * Create processing error
 */
function createProcessingError(error: any, context?: any): ConversionError {
  const errorHandler = getErrorHandler();
  
  let errorType = ErrorType.UNKNOWN;
  let message = 'Processing failed';
  
  if (error.message) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('memory') || msg.includes('out of memory')) {
      errorType = ErrorType.MEMORY_EXCEEDED;
      message = 'Not enough memory to process this image';
    } else if (msg.includes('timeout') || msg.includes('time')) {
      errorType = ErrorType.PROCESSING_TIMEOUT;
      message = 'Processing took too long and was cancelled';
    } else if (msg.includes('complex') || msg.includes('too many')) {
      errorType = ErrorType.COMPLEXITY_TOO_HIGH;
      message = 'Image is too complex for processing';
    } else if (msg.includes('canvas') || msg.includes('context')) {
      errorType = ErrorType.CANVAS_ERROR;
      message = 'Canvas processing error occurred';
    } else if (msg.includes('color') || msg.includes('quantiz')) {
      errorType = ErrorType.COLOR_QUANTIZATION_FAILED;
      message = 'Color reduction failed';
    } else if (msg.includes('edge') || msg.includes('detect')) {
      errorType = ErrorType.EDGE_DETECTION_FAILED;
      message = 'Edge detection failed';
    } else if (msg.includes('vector') || msg.includes('path')) {
      errorType = ErrorType.VECTORIZATION_FAILED;
      message = 'Vectorization failed';
    } else {
      message = error.message;
    }
  }
  
  return errorHandler.createError(message, errorType, error, context);
}

/**
 * Create SVG generation error
 */
function createSvgGenerationError(error: any, context?: any): ConversionError {
  const errorHandler = getErrorHandler();
  
  let errorType = ErrorType.SVG_GENERATION_FAILED;
  let message = 'Failed to generate SVG output';
  
  if (error.message) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('invalid') || msg.includes('malformed')) {
      errorType = ErrorType.SVG_INVALID;
      message = 'Generated SVG is invalid';
    } else {
      message = error.message;
    }
  }
  
  return errorHandler.createError(message, errorType, error, context);
}

/**
 * Handle browser compatibility errors
 */
export function checkBrowserCompatibility(): ConversionError | null {
  const errorHandler = getErrorHandler();
  const missingFeatures: string[] = [];
  
  // Check for required APIs
  if (!window.File) missingFeatures.push('File API');
  if (!window.FileReader) missingFeatures.push('FileReader API');
  if (!window.FileList) missingFeatures.push('FileList API');
  if (!document.createElement('canvas').getContext) missingFeatures.push('Canvas API');
  if (!window.URL || !window.URL.createObjectURL) missingFeatures.push('URL API');
  
  // Check for optional but recommended features
  if (!window.Worker) missingFeatures.push('Web Workers (performance will be reduced)');
  
  if (missingFeatures.length > 0) {
    return errorHandler.createError(
      'Your browser does not support all required features',
      ErrorType.BROWSER_UNSUPPORTED,
      undefined,
      { missingFeatures }
    );
  }
  
  return null;
}

/**
 * Create timeout wrapper for operations
 */
export function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        const errorHandler = getErrorHandler();
        const error = errorHandler.createError(
          timeoutMessage,
          ErrorType.PROCESSING_TIMEOUT,
          undefined,
          { timeoutMs }
        );
        reject(error);
      }, timeoutMs);
    })
  ]);
}

/**
 * Create memory monitoring wrapper
 */
export function withMemoryMonitoring<T>(
  operation: () => Promise<T>,
  maxMemoryMB: number = 100
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    // Monitor memory usage if performance API is available
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      // Check if it's a memory-related error
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsedMB = (currentMemory - startMemory) / (1024 * 1024);
      
      if (memoryUsedMB > maxMemoryMB || 
          (error.message && error.message.toLowerCase().includes('memory'))) {
        const errorHandler = getErrorHandler();
        const memoryError = errorHandler.createError(
          `Memory usage exceeded limit (${Math.round(memoryUsedMB)}MB used, ${maxMemoryMB}MB limit)`,
          ErrorType.MEMORY_EXCEEDED,
          error,
          { memoryUsedMB, maxMemoryMB }
        );
        reject(memoryError);
      } else {
        reject(error);
      }
    }
  });
}

/**
 * Validate configuration and throw appropriate errors
 */
export function validateConfiguration(config: VectorizationConfig): void {
  const errorHandler = getErrorHandler();
  
  if (config.colorCount < 2 || config.colorCount > 256) {
    throw errorHandler.createError(
      'Color count must be between 2 and 256',
      ErrorType.FILE_INVALID,
      undefined,
      { colorCount: config.colorCount, validRange: '2-256' }
    );
  }
  
  if (config.pathSimplification < 0.1 || config.pathSimplification > 10.0) {
    throw errorHandler.createError(
      'Path simplification must be between 0.1 and 10.0',
      ErrorType.FILE_INVALID,
      undefined,
      { pathSimplification: config.pathSimplification, validRange: '0.1-10.0' }
    );
  }
  
  const validAlgorithms = ['auto', 'shapes', 'photo', 'lineart'];
  if (!validAlgorithms.includes(config.algorithm)) {
    throw errorHandler.createError(
      'Invalid algorithm selection',
      ErrorType.FILE_INVALID,
      undefined,
      { algorithm: config.algorithm, validOptions: validAlgorithms }
    );
  }
}

/**
 * Get error analytics
 */
export function getErrorAnalytics() {
  return getErrorHandler().getAnalytics();
}

/**
 * Reset error analytics
 */
export function resetErrorAnalytics() {
  getErrorHandler().resetAnalytics();
}

export default {
  withFileValidation,
  withImageProcessing,
  withSvgGeneration,
  withTimeout,
  withMemoryMonitoring,
  checkBrowserCompatibility,
  validateConfiguration,
  getErrorAnalytics,
  resetErrorAnalytics
};