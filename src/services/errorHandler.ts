/**
 * Comprehensive error handling service for PNG to SVG converter
 */

import { 
  ErrorType, 
  ErrorSeverity, 
  ConversionError, 
  ErrorSolution,
  RetryConfig,
  ErrorRecoveryStrategy,
  ErrorHandlingOptions,
  ErrorAnalytics
} from '../types/errors';
import { VectorizationConfig } from '../types/converter';

export class ConversionErrorImpl extends Error implements ConversionError {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly solutions: ErrorSolution;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    recoverable: boolean,
    solutions: ErrorSolution,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ConversionError';
    this.type = type;
    this.severity = severity;
    this.recoverable = recoverable;
    this.solutions = solutions;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();
  }

  private generateErrorId(): string {
    return `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ErrorHandler {
  private options: ErrorHandlingOptions;
  private analytics: ErrorAnalytics;
  private recoveryStrategies: Map<ErrorType, ErrorRecoveryStrategy[]>;

  constructor(options?: Partial<ErrorHandlingOptions>) {
    this.options = {
      enableRetry: true,
      retryConfig: {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
        maxDelay: 10000,
        shouldRetry: (error) => error.recoverable
      },
      recoveryStrategies: this.getDefaultRecoveryStrategies(),
      collectAnalytics: true,
      ...options
    };

    this.analytics = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoverySuccessRate: 0,
      commonErrors: [],
      averageRecoveryTime: 0
    };

    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();
  }

  /**
   * Create a conversion error with appropriate classification and solutions
   */
  createError(
    message: string,
    type: ErrorType,
    originalError?: Error,
    context?: Record<string, any>
  ): ConversionError {
    const { severity, recoverable, solutions } = this.getErrorMetadata(type, context);
    
    const error = new ConversionErrorImpl(
      message,
      type,
      severity,
      recoverable,
      solutions,
      originalError,
      context
    );

    this.recordError(error);
    return error;
  }

  /**
   * Handle an error with retry and recovery mechanisms
   */
  async handleError<T>(
    error: ConversionError,
    operation: () => Promise<T>,
    context?: any
  ): Promise<T> {
    this.recordError(error);

    // Try recovery strategies first
    if (error.recoverable) {
      const recoveryResult = await this.attemptRecovery(error, context);
      if (recoveryResult.success) {
        return recoveryResult.result;
      }
    }

    // Try retry if enabled and error is retryable
    if (this.options.enableRetry && this.shouldRetry(error)) {
      return this.retryOperation(operation, error);
    }

    // If all recovery attempts fail, throw the error
    throw error;
  }

  /**
   * Attempt to recover from an error using available strategies
   */
  private async attemptRecovery(error: ConversionError, context: any): Promise<{ success: boolean; result?: any }> {
    const strategies = this.recoveryStrategies.get(error.type) || [];
    
    for (const strategy of strategies) {
      try {
        const startTime = Date.now();
        const result = await strategy.recover(error, context);
        const recoveryTime = Date.now() - startTime;
        
        this.updateRecoveryStats(true, recoveryTime);
        return { success: true, result };
      } catch (recoveryError) {
        console.warn(`Recovery strategy '${strategy.name}' failed:`, recoveryError);
        continue;
      }
    }

    this.updateRecoveryStats(false, 0);
    return { success: false };
  }

  /**
   * Retry an operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    originalError: ConversionError,
    attempt: number = 1
  ): Promise<T> {
    if (attempt > this.options.retryConfig.maxAttempts) {
      throw originalError;
    }

    const delay = this.calculateRetryDelay(attempt);
    await this.sleep(delay);

    try {
      return await operation();
    } catch (error) {
      if (error instanceof ConversionErrorImpl && this.shouldRetry(error)) {
        return this.retryOperation(operation, error, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const { delay, exponentialBackoff, maxDelay = 10000 } = this.options.retryConfig;
    
    if (!exponentialBackoff) {
      return delay;
    }

    const exponentialDelay = delay * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, maxDelay);
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetry(error: ConversionError): boolean {
    if (this.options.retryConfig.shouldRetry) {
      return this.options.retryConfig.shouldRetry(error);
    }
    return error.recoverable;
  }

  /**
   * Get error metadata based on error type
   */
  private getErrorMetadata(type: ErrorType, context?: Record<string, any>): {
    severity: ErrorSeverity;
    recoverable: boolean;
    solutions: ErrorSolution;
  } {
    const errorDefinitions: Record<ErrorType, {
      severity: ErrorSeverity;
      recoverable: boolean;
      solutions: ErrorSolution;
    }> = {
      [ErrorType.FILE_INVALID]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: false,
        solutions: {
          primary: 'Please select a valid PNG image file',
          alternatives: [
            'Check that the file has a .png extension',
            'Try converting the image to PNG format first',
            'Ensure the file is not corrupted'
          ],
          technical: 'File does not meet PNG format requirements'
        }
      },
      [ErrorType.FILE_TOO_LARGE]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        solutions: {
          primary: 'Reduce the image file size to under 10MB',
          alternatives: [
            'Compress the image using an image editor',
            'Reduce image dimensions',
            'Convert to a more efficient format first'
          ],
          technical: `File size: ${context?.fileSize || 'unknown'}, Limit: ${context?.maxSize || '10MB'}`
        }
      },
      [ErrorType.MEMORY_EXCEEDED]: {
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        solutions: {
          primary: 'The image is too complex for processing',
          alternatives: [
            'Try reducing the image size',
            'Close other browser tabs to free memory',
            'Use a simpler image with fewer colors'
          ],
          technical: 'Processing requires more memory than available'
        }
      },
      [ErrorType.PROCESSING_TIMEOUT]: {
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        solutions: {
          primary: 'Processing is taking too long',
          alternatives: [
            'Try with simplified settings (fewer colors, higher tolerance)',
            'Reduce image complexity',
            'Try again with a smaller image'
          ],
          technical: 'Processing exceeded maximum time limit'
        }
      },
      [ErrorType.COMPLEXITY_TOO_HIGH]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        solutions: {
          primary: 'Image is too complex for vectorization',
          alternatives: [
            'Increase path simplification tolerance',
            'Reduce color count',
            'Use photo mode instead of shapes mode'
          ],
          technical: 'Image complexity exceeds processing capabilities'
        }
      },
      [ErrorType.CANVAS_ERROR]: {
        severity: ErrorSeverity.HIGH,
        recoverable: false,
        solutions: {
          primary: 'Browser canvas error occurred',
          alternatives: [
            'Try refreshing the page',
            'Update your browser',
            'Try a different browser'
          ],
          technical: 'HTML5 Canvas API error'
        }
      },
      [ErrorType.SVG_GENERATION_FAILED]: {
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        solutions: {
          primary: 'Failed to generate SVG output',
          alternatives: [
            'Try with simpler settings',
            'Reduce path complexity',
            'Try a different algorithm mode'
          ],
          technical: 'SVG generation process failed'
        }
      },
      [ErrorType.BROWSER_UNSUPPORTED]: {
        severity: ErrorSeverity.CRITICAL,
        recoverable: false,
        solutions: {
          primary: 'Your browser does not support required features',
          alternatives: [
            'Update to a modern browser (Chrome, Firefox, Safari, Edge)',
            'Enable JavaScript if disabled',
            'Check browser compatibility'
          ],
          technical: `Missing features: ${context?.missingFeatures?.join(', ') || 'unknown'}`
        }
      },
      // Add other error types with similar structure
      [ErrorType.FILE_CORRUPTED]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: false,
        solutions: {
          primary: 'The image file appears to be corrupted',
          alternatives: ['Try a different image file', 'Re-save the image in PNG format'],
          technical: 'PNG file structure is invalid'
        }
      },
      [ErrorType.FILE_UNSUPPORTED]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: false,
        solutions: {
          primary: 'File format is not supported',
          alternatives: ['Convert the image to PNG format', 'Use a PNG image file'],
          technical: 'Only PNG format is supported'
        }
      },
      [ErrorType.COLOR_QUANTIZATION_FAILED]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        solutions: {
          primary: 'Color reduction failed',
          alternatives: ['Try with different color count', 'Use auto algorithm mode'],
          technical: 'Color quantization algorithm failed'
        }
      },
      [ErrorType.EDGE_DETECTION_FAILED]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        solutions: {
          primary: 'Edge detection failed',
          alternatives: ['Try with different smoothing level', 'Use photo mode'],
          technical: 'Edge detection algorithm failed'
        }
      },
      [ErrorType.VECTORIZATION_FAILED]: {
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        solutions: {
          primary: 'Vectorization process failed',
          alternatives: ['Try with higher path simplification', 'Use different algorithm'],
          technical: 'Path generation failed'
        }
      },
      [ErrorType.SVG_INVALID]: {
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        solutions: {
          primary: 'Generated SVG is invalid',
          alternatives: ['Try with simpler settings', 'Reduce complexity'],
          technical: 'SVG validation failed'
        }
      },
      [ErrorType.WEBWORKER_UNAVAILABLE]: {
        severity: ErrorSeverity.LOW,
        recoverable: true,
        solutions: {
          primary: 'Background processing unavailable',
          alternatives: ['Processing will continue in main thread'],
          technical: 'Web Workers not supported'
        }
      },
      [ErrorType.RESOURCE_UNAVAILABLE]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        solutions: {
          primary: 'Required resource is unavailable',
          alternatives: ['Try again later', 'Check internet connection'],
          technical: 'External resource loading failed'
        }
      },
      [ErrorType.UNKNOWN]: {
        severity: ErrorSeverity.MEDIUM,
        recoverable: false,
        solutions: {
          primary: 'An unexpected error occurred',
          alternatives: ['Try refreshing the page', 'Try with a different image'],
          technical: 'Unknown error type'
        }
      }
    };

    return errorDefinitions[type] || errorDefinitions[ErrorType.UNKNOWN];
  }

  /**
   * Get default recovery strategies
   */
  private getDefaultRecoveryStrategies(): ErrorRecoveryStrategy[] {
    return [
      {
        name: 'reduce-image-size',
        applicableErrors: [ErrorType.MEMORY_EXCEEDED, ErrorType.PROCESSING_TIMEOUT, ErrorType.COMPLEXITY_TOO_HIGH],
        modifiesInput: true,
        recover: async (error, context) => {
          if (context?.imageData && context?.config) {
            // Reduce image dimensions by 50%
            const newConfig = { ...context.config };
            const imageProcessor = context.imageProcessor;
            
            if (imageProcessor) {
              const reducedImageData = await imageProcessor.resizeImageData(
                context.imageData,
                Math.floor(context.imageData.width * 0.5),
                Math.floor(context.imageData.height * 0.5)
              );
              return { imageData: reducedImageData, config: newConfig };
            }
          }
          throw new Error('Cannot reduce image size - missing context');
        }
      },
      {
        name: 'simplify-config',
        applicableErrors: [ErrorType.COMPLEXITY_TOO_HIGH, ErrorType.PROCESSING_TIMEOUT],
        modifiesInput: true,
        recover: async (error, context) => {
          if (context?.config) {
            const simplifiedConfig: VectorizationConfig = {
              ...context.config,
              colorCount: Math.min(context.config.colorCount, 16),
              pathSimplification: Math.max(context.config.pathSimplification, 2.0),
              smoothingLevel: 'low'
            };
            return { config: simplifiedConfig };
          }
          throw new Error('Cannot simplify config - missing context');
        }
      },
      {
        name: 'fallback-algorithm',
        applicableErrors: [ErrorType.VECTORIZATION_FAILED, ErrorType.COLOR_QUANTIZATION_FAILED],
        modifiesInput: true,
        recover: async (error, context) => {
          if (context?.config) {
            const fallbackConfig: VectorizationConfig = {
              ...context.config,
              algorithm: 'auto' // Fallback to auto mode
            };
            return { config: fallbackConfig };
          }
          throw new Error('Cannot use fallback algorithm - missing context');
        }
      }
    ];
  }

  /**
   * Initialize recovery strategies map
   */
  private initializeRecoveryStrategies(): void {
    this.options.recoveryStrategies.forEach(strategy => {
      strategy.applicableErrors.forEach(errorType => {
        if (!this.recoveryStrategies.has(errorType)) {
          this.recoveryStrategies.set(errorType, []);
        }
        this.recoveryStrategies.get(errorType)!.push(strategy);
      });
    });
  }

  /**
   * Record error for analytics
   */
  private recordError(error: ConversionError): void {
    if (!this.options.collectAnalytics) return;

    this.analytics.totalErrors++;
    
    // Update error counts by type
    this.analytics.errorsByType[error.type] = (this.analytics.errorsByType[error.type] || 0) + 1;
    
    // Update error counts by severity
    this.analytics.errorsBySeverity[error.severity] = (this.analytics.errorsBySeverity[error.severity] || 0) + 1;

    // Update common errors
    this.updateCommonErrors();

    // Report error if reporter is configured
    if (this.options.errorReporter) {
      this.options.errorReporter(error);
    }
  }

  /**
   * Update recovery statistics
   */
  private updateRecoveryStats(success: boolean, recoveryTime: number): void {
    // Implementation for tracking recovery success rate and timing
    // This would be expanded based on specific analytics requirements
  }

  /**
   * Update common errors list
   */
  private updateCommonErrors(): void {
    const errorEntries = Object.entries(this.analytics.errorsByType)
      .map(([type, count]) => ({
        type: type as ErrorType,
        count,
        percentage: (count / this.analytics.totalErrors) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.analytics.commonErrors = errorEntries;
  }

  /**
   * Get current error analytics
   */
  getAnalytics(): ErrorAnalytics {
    return { ...this.analytics };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset analytics data
   */
  resetAnalytics(): void {
    this.analytics = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoverySuccessRate: 0,
      commonErrors: [],
      averageRecoveryTime: 0
    };
  }
}

export default ErrorHandler;