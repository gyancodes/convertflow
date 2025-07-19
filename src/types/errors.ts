/**
 * Error handling types for PNG to SVG converter
 */

export enum ErrorType {
  // File validation errors
  FILE_INVALID = 'FILE_INVALID',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  FILE_UNSUPPORTED = 'FILE_UNSUPPORTED',
  
  // Processing errors
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  COMPLEXITY_TOO_HIGH = 'COMPLEXITY_TOO_HIGH',
  CANVAS_ERROR = 'CANVAS_ERROR',
  
  // Algorithm errors
  COLOR_QUANTIZATION_FAILED = 'COLOR_QUANTIZATION_FAILED',
  EDGE_DETECTION_FAILED = 'EDGE_DETECTION_FAILED',
  VECTORIZATION_FAILED = 'VECTORIZATION_FAILED',
  
  // Output generation errors
  SVG_GENERATION_FAILED = 'SVG_GENERATION_FAILED',
  SVG_INVALID = 'SVG_INVALID',
  
  // System errors
  BROWSER_UNSUPPORTED = 'BROWSER_UNSUPPORTED',
  WEBWORKER_UNAVAILABLE = 'WEBWORKER_UNAVAILABLE',
  
  // Network/Resource errors
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  
  // Unknown errors
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorSolution {
  /** Primary suggested action */
  primary: string;
  /** Additional suggestions */
  alternatives?: string[];
  /** Technical details for advanced users */
  technical?: string;
  /** Link to documentation or help */
  helpUrl?: string;
}

export interface ConversionError extends Error {
  /** Error type classification */
  type: ErrorType;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Whether this error is recoverable */
  recoverable: boolean;
  /** Suggested solutions for the user */
  solutions: ErrorSolution;
  /** Original error that caused this (if any) */
  originalError?: Error;
  /** Context data related to the error */
  context?: Record<string, any>;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Unique error ID for tracking */
  errorId: string;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Delay between retries in milliseconds */
  delay: number;
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
  /** Maximum delay for exponential backoff */
  maxDelay?: number;
  /** Function to determine if error is retryable */
  shouldRetry?: (error: ConversionError) => boolean;
}

export interface ErrorRecoveryStrategy {
  /** Strategy name */
  name: string;
  /** Error types this strategy can handle */
  applicableErrors: ErrorType[];
  /** Function to attempt recovery */
  recover: (error: ConversionError, context: any) => Promise<any>;
  /** Whether this strategy modifies the original request */
  modifiesInput: boolean;
}

export interface ErrorHandlingOptions {
  /** Whether to enable automatic retry */
  enableRetry: boolean;
  /** Retry configuration */
  retryConfig: RetryConfig;
  /** Available recovery strategies */
  recoveryStrategies: ErrorRecoveryStrategy[];
  /** Whether to collect error analytics */
  collectAnalytics: boolean;
  /** Custom error reporter function */
  errorReporter?: (error: ConversionError) => void;
}

export interface ErrorAnalytics {
  /** Total number of errors */
  totalErrors: number;
  /** Errors by type */
  errorsByType: Record<ErrorType, number>;
  /** Errors by severity */
  errorsBySeverity: Record<ErrorSeverity, number>;
  /** Recovery success rate */
  recoverySuccessRate: number;
  /** Most common error types */
  commonErrors: Array<{ type: ErrorType; count: number; percentage: number }>;
  /** Average time to recovery */
  averageRecoveryTime: number;
}