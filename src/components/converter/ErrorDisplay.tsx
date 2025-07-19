/**
 * User-friendly error display component
 */

import React from 'react';
import { ConversionError, ErrorSeverity } from '../../types/errors';

interface ErrorDisplayProps {
  error: ConversionError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showTechnicalDetails = false
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getSeverityStyles = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorSeverity.HIGH:
        return 'bg-red-50 border-red-200 text-red-800';
      case ErrorSeverity.CRITICAL:
        return 'bg-red-100 border-red-300 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return '⚠️';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.HIGH:
        return '❌';
      case ErrorSeverity.CRITICAL:
        return '🚨';
      default:
        return 'ℹ️';
    }
  };

  const getSeverityLabel = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'Warning';
      case ErrorSeverity.MEDIUM:
        return 'Error';
      case ErrorSeverity.HIGH:
        return 'Serious Error';
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      default:
        return 'Notice';
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getSeverityStyles(error.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-xl" role="img" aria-label={getSeverityLabel(error.severity)}>
            {getSeverityIcon(error.severity)}
          </span>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-sm">
                {getSeverityLabel(error.severity)}
              </h3>
              <span className="text-xs opacity-75">
                {error.timestamp.toLocaleTimeString()}
              </span>
            </div>
            
            <p className="text-sm mb-3 font-medium">
              {error.message}
            </p>

            <div className="space-y-2">
              <div>
                <h4 className="font-medium text-sm mb-1">Suggested Solution:</h4>
                <p className="text-sm opacity-90">
                  {error.solutions.primary}
                </p>
              </div>

              {error.solutions.alternatives && error.solutions.alternatives.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Alternative Solutions:</h4>
                  <ul className="text-sm opacity-90 list-disc list-inside space-y-1">
                    {error.solutions.alternatives.map((solution, index) => (
                      <li key={index}>{solution}</li>
                    ))}
                  </ul>
                </div>
              )}

              {error.solutions.helpUrl && (
                <div>
                  <a
                    href={error.solutions.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline hover:no-underline"
                  >
                    View detailed help →
                  </a>
                </div>
              )}
            </div>

            {(showTechnicalDetails || showDetails) && (
              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs font-medium mb-2 hover:underline focus:outline-none"
                >
                  {showDetails ? '▼' : '▶'} Technical Details
                </button>
                
                {showDetails && (
                  <div className="text-xs space-y-1 opacity-75 font-mono">
                    <div>Error ID: {error.errorId}</div>
                    <div>Type: {error.type}</div>
                    {error.solutions.technical && (
                      <div>Details: {error.solutions.technical}</div>
                    )}
                    {error.context && Object.keys(error.context).length > 0 && (
                      <div>
                        Context: {JSON.stringify(error.context, null, 2)}
                      </div>
                    )}
                    {error.originalError && (
                      <div>Original: {error.originalError.message}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {error.recoverable && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs font-medium bg-white bg-opacity-20 hover:bg-opacity-30 rounded border border-current border-opacity-30 transition-colors"
            >
              Try Again
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;