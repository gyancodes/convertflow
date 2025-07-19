/**
 * Tests for error handling service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler, ConversionErrorImpl } from '../errorHandler';
import { ErrorType, ErrorSeverity, ErrorRecoveryStrategy } from '../../types/errors';
import { VectorizationConfig } from '../../types/converter';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockErrorReporter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockErrorReporter = vi.fn();
    errorHandler = new ErrorHandler({
      enableRetry: true,
      collectAnalytics: true,
      errorReporter: mockErrorReporter,
      retryConfig: {
        maxAttempts: 3,
        delay: 100, // Shorter delay for tests
        exponentialBackoff: true,
        maxDelay: 1000
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Creation', () => {
    it('should create a conversion error with proper metadata', () => {
      const error = errorHandler.createError(
        'Test error message',
        ErrorType.FILE_INVALID,
        new Error('Original error'),
        { testContext: 'value' }
      );

      expect(error).toBeInstanceOf(ConversionErrorImpl);
      expect(error.message).toBe('Test error message');
      expect(error.type).toBe(ErrorType.FILE_INVALID);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoverable).toBe(false);
      expect(error.originalError?.message).toBe('Original error');
      expect(error.context?.testContext).toBe('value');
      expect(error.errorId).toMatch(/^FILE_INVALID_\d+_[a-z0-9]+$/);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should generate unique error IDs', () => {
      const error1 = errorHandler.createError('Error 1', ErrorType.FILE_INVALID);
      const error2 = errorHandler.createError('Error 2', ErrorType.FILE_INVALID);

      expect(error1.errorId).not.toBe(error2.errorId);
    });

    it('should call error reporter when configured', () => {
      const error = errorHandler.createError('Test error', ErrorType.FILE_INVALID);

      expect(mockErrorReporter).toHaveBeenCalledWith(error);
    });
  });

  describe('Error Metadata', () => {
    it('should provide correct metadata for file validation errors', () => {
      const error = errorHandler.createError('File too large', ErrorType.FILE_TOO_LARGE);

      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoverable).toBe(true);
      expect(error.solutions.primary).toContain('Reduce the image file size');
      expect(error.solutions.alternatives).toContain('Compress the image using an image editor');
    });

    it('should provide correct metadata for memory errors', () => {
      const error = errorHandler.createError('Memory exceeded', ErrorType.MEMORY_EXCEEDED);

      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.recoverable).toBe(true);
      expect(error.solutions.primary).toContain('too complex for processing');
      expect(error.solutions.alternatives).toContain('Try reducing the image size');
    });

    it('should provide correct metadata for browser compatibility errors', () => {
      const error = errorHandler.createError(
        'Browser unsupported',
        ErrorType.BROWSER_UNSUPPORTED,
        undefined,
        { missingFeatures: ['Canvas API', 'File API'] }
      );

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.recoverable).toBe(false);
      expect(error.solutions.technical).toContain('Canvas API, File API');
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry recoverable errors', async () => {
      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      const error = errorHandler.createError(
        'Temporary error',
        ErrorType.PROCESSING_TIMEOUT
      );

      const result = await errorHandler.handleError(error, operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-recoverable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Permanent failure'));
      const error = errorHandler.createError(
        'Permanent error',
        ErrorType.FILE_INVALID
      );

      await expect(errorHandler.handleError(error, operation)).rejects.toThrow();
      expect(operation).not.toHaveBeenCalled();
    });

    it('should respect maximum retry attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      const error = errorHandler.createError(
        'Retryable error',
        ErrorType.PROCESSING_TIMEOUT
      );

      await expect(errorHandler.handleError(error, operation)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(3); // maxAttempts
    });

    it('should use exponential backoff for retries', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      });

      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw errorHandler.createError('Retry error', ErrorType.PROCESSING_TIMEOUT);
        }
        return Promise.resolve('success');
      });

      const error = errorHandler.createError('Initial error', ErrorType.PROCESSING_TIMEOUT);
      await errorHandler.handleError(error, operation);

      expect(delays).toEqual([100, 200]); // 100ms, then 200ms (exponential)
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Recovery Strategies', () => {
    it('should attempt recovery before retry', async () => {
      const mockRecoveryStrategy: ErrorRecoveryStrategy = {
        name: 'test-recovery',
        applicableErrors: [ErrorType.MEMORY_EXCEEDED],
        modifiesInput: true,
        recover: vi.fn().mockResolvedValue({ recovered: true })
      };

      const errorHandlerWithRecovery = new ErrorHandler({
        recoveryStrategies: [mockRecoveryStrategy]
      });

      const error = errorHandlerWithRecovery.createError(
        'Memory error',
        ErrorType.MEMORY_EXCEEDED
      );

      const operation = vi.fn().mockResolvedValue('original-result');
      const result = await errorHandlerWithRecovery.handleError(error, operation, {});

      expect(mockRecoveryStrategy.recover).toHaveBeenCalledWith(error, {});
      expect(result).toEqual({ recovered: true });
      expect(operation).not.toHaveBeenCalled(); // Recovery succeeded, no need to retry
    });

    it('should fall back to retry if recovery fails', async () => {
      const mockRecoveryStrategy: ErrorRecoveryStrategy = {
        name: 'failing-recovery',
        applicableErrors: [ErrorType.MEMORY_EXCEEDED],
        modifiesInput: true,
        recover: vi.fn().mockRejectedValue(new Error('Recovery failed'))
      };

      const errorHandlerWithRecovery = new ErrorHandler({
        recoveryStrategies: [mockRecoveryStrategy],
        enableRetry: true,
        retryConfig: {
          maxAttempts: 2,
          delay: 10,
          exponentialBackoff: false
        }
      });

      const error = errorHandlerWithRecovery.createError(
        'Memory error',
        ErrorType.MEMORY_EXCEEDED
      );

      const operation = vi.fn().mockResolvedValue('retry-success');
      const result = await errorHandlerWithRecovery.handleError(error, operation, {});

      expect(mockRecoveryStrategy.recover).toHaveBeenCalled();
      expect(operation).toHaveBeenCalledTimes(2); // Initial attempt + 1 retry
      expect(result).toBe('retry-success');
    });

    it('should try multiple recovery strategies', async () => {
      const strategy1: ErrorRecoveryStrategy = {
        name: 'strategy-1',
        applicableErrors: [ErrorType.COMPLEXITY_TOO_HIGH],
        modifiesInput: true,
        recover: vi.fn().mockRejectedValue(new Error('Strategy 1 failed'))
      };

      const strategy2: ErrorRecoveryStrategy = {
        name: 'strategy-2',
        applicableErrors: [ErrorType.COMPLEXITY_TOO_HIGH],
        modifiesInput: true,
        recover: vi.fn().mockResolvedValue({ strategy2: 'success' })
      };

      const errorHandlerWithStrategies = new ErrorHandler({
        recoveryStrategies: [strategy1, strategy2]
      });

      const error = errorHandlerWithStrategies.createError(
        'Complexity error',
        ErrorType.COMPLEXITY_TOO_HIGH
      );

      const operation = vi.fn();
      const result = await errorHandlerWithStrategies.handleError(error, operation, {});

      expect(strategy1.recover).toHaveBeenCalled();
      expect(strategy2.recover).toHaveBeenCalled();
      expect(result).toEqual({ strategy2: 'success' });
      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('Default Recovery Strategies', () => {
    it('should have reduce-image-size strategy for memory errors', async () => {
      const mockImageProcessor = {
        resizeImageData: vi.fn().mockResolvedValue({ width: 100, height: 100 })
      };

      const context = {
        imageData: { width: 200, height: 200 },
        config: { colorCount: 32 } as VectorizationConfig,
        imageProcessor: mockImageProcessor
      };

      const error = errorHandler.createError('Memory exceeded', ErrorType.MEMORY_EXCEEDED);
      const operation = vi.fn().mockResolvedValue('not-called');

      const result = await errorHandler.handleError(error, operation, context);

      expect(mockImageProcessor.resizeImageData).toHaveBeenCalledWith(
        context.imageData,
        100, // 50% of original width
        100  // 50% of original height
      );
      expect(result.imageData).toEqual({ width: 100, height: 100 });
    });

    it('should have simplify-config strategy for complexity errors', async () => {
      const context = {
        config: {
          colorCount: 64,
          pathSimplification: 0.5,
          smoothingLevel: 'high'
        } as VectorizationConfig
      };

      const error = errorHandler.createError('Too complex', ErrorType.COMPLEXITY_TOO_HIGH);
      const operation = vi.fn().mockResolvedValue('not-called');

      const result = await errorHandler.handleError(error, operation, context);

      expect(result.config.colorCount).toBe(16); // Reduced to max 16
      expect(result.config.pathSimplification).toBe(2.0); // Increased to min 2.0
      expect(result.config.smoothingLevel).toBe('low'); // Reduced to low
    });

    it('should have fallback-algorithm strategy for vectorization errors', async () => {
      const context = {
        config: {
          algorithm: 'shapes'
        } as VectorizationConfig
      };

      const error = errorHandler.createError('Vectorization failed', ErrorType.VECTORIZATION_FAILED);
      const operation = vi.fn().mockResolvedValue('not-called');

      const result = await errorHandler.handleError(error, operation, context);

      expect(result.config.algorithm).toBe('auto'); // Fallback to auto
    });
  });

  describe('Analytics', () => {
    it('should collect error analytics', () => {
      errorHandler.createError('Error 1', ErrorType.FILE_INVALID);
      errorHandler.createError('Error 2', ErrorType.FILE_INVALID);
      errorHandler.createError('Error 3', ErrorType.MEMORY_EXCEEDED);

      const analytics = errorHandler.getAnalytics();

      expect(analytics.totalErrors).toBe(3);
      expect(analytics.errorsByType[ErrorType.FILE_INVALID]).toBe(2);
      expect(analytics.errorsByType[ErrorType.MEMORY_EXCEEDED]).toBe(1);
      expect(analytics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(2);
      expect(analytics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it('should track common errors', () => {
      // Create multiple errors of different types
      for (let i = 0; i < 5; i++) {
        errorHandler.createError('File error', ErrorType.FILE_INVALID);
      }
      for (let i = 0; i < 3; i++) {
        errorHandler.createError('Memory error', ErrorType.MEMORY_EXCEEDED);
      }
      for (let i = 0; i < 1; i++) {
        errorHandler.createError('Timeout error', ErrorType.PROCESSING_TIMEOUT);
      }

      const analytics = errorHandler.getAnalytics();

      expect(analytics.commonErrors).toHaveLength(3);
      expect(analytics.commonErrors[0]).toEqual({
        type: ErrorType.FILE_INVALID,
        count: 5,
        percentage: expect.closeTo(55.56, 1) // 5/9 * 100
      });
      expect(analytics.commonErrors[1]).toEqual({
        type: ErrorType.MEMORY_EXCEEDED,
        count: 3,
        percentage: expect.closeTo(33.33, 1) // 3/9 * 100
      });
    });

    it('should reset analytics', () => {
      errorHandler.createError('Error', ErrorType.FILE_INVALID);
      expect(errorHandler.getAnalytics().totalErrors).toBe(1);

      errorHandler.resetAnalytics();
      expect(errorHandler.getAnalytics().totalErrors).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should disable retry when configured', async () => {
      const noRetryHandler = new ErrorHandler({
        enableRetry: false
      });

      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      const error = noRetryHandler.createError('Error', ErrorType.PROCESSING_TIMEOUT);

      await expect(noRetryHandler.handleError(error, operation)).rejects.toThrow();
      expect(operation).not.toHaveBeenCalled();
    });

    it('should disable analytics when configured', () => {
      const noAnalyticsHandler = new ErrorHandler({
        collectAnalytics: false
      });

      noAnalyticsHandler.createError('Error', ErrorType.FILE_INVALID);
      const analytics = noAnalyticsHandler.getAnalytics();

      expect(analytics.totalErrors).toBe(0);
    });

    it('should use custom retry configuration', async () => {
      const customRetryHandler = new ErrorHandler({
        retryConfig: {
          maxAttempts: 5,
          delay: 50,
          exponentialBackoff: false
        }
      });

      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 4) {
          throw customRetryHandler.createError('Retry error', ErrorType.PROCESSING_TIMEOUT);
        }
        return Promise.resolve('success');
      });

      const error = customRetryHandler.createError('Initial error', ErrorType.PROCESSING_TIMEOUT);
      const result = await customRetryHandler.handleError(error, operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(4);
    });
  });
});