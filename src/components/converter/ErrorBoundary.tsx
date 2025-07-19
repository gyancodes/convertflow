/**
 * Error boundary component for catching and handling unexpected errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorType, ErrorSeverity } from '../../types/errors';
import { ConversionErrorImpl } from '../../services/errorHandler';
import ErrorDisplay from './ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: ConversionErrorImpl | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convert the error to our ConversionError format
    const conversionError = new ConversionErrorImpl(
      error.message || 'An unexpected error occurred',
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      true, // Most UI errors are recoverable by refresh
      {
        primary: 'An unexpected error occurred in the application',
        alternatives: [
          'Try refreshing the page',
          'Clear your browser cache',
          'Try with a different image',
          'Update your browser to the latest version'
        ],
        technical: `JavaScript Error: ${error.name}: ${error.message}`,
        helpUrl: undefined
      },
      error,
      {
        stack: error.stack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    );

    return {
      hasError: true,
      error: conversionError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You could also send error reports to an error tracking service here
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // This would typically send error data to an error tracking service
    // For now, we'll just log it
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorBoundary: true
    };

    console.error('Error Report:', errorReport);
    
    // In a real application, you might send this to a service like Sentry:
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  private handleRetry = () => {
    // Reset the error state to retry rendering
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    // Reload the page as a last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, render our error display
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600">
                The application encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            <ErrorDisplay
              error={this.state.error}
              onRetry={this.handleRetry}
              showTechnicalDetails={true}
            />

            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                If this problem persists, please try:
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Using a different browser</li>
                <li>• Clearing your browser cache</li>
                <li>• Disabling browser extensions</li>
                <li>• Trying with a smaller or simpler image</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;