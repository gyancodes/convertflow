/**
 * Tests for ErrorDisplay component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorDisplay from '../ErrorDisplay';
import { ConversionErrorImpl } from '../../../services/errorHandler';
import { ErrorType, ErrorSeverity } from '../../../types/errors';

describe('ErrorDisplay', () => {
  const createMockError = (
    type: ErrorType = ErrorType.FILE_INVALID,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = false
  ) => {
    return new ConversionErrorImpl(
      'Test error message',
      type,
      severity,
      recoverable,
      {
        primary: 'Primary solution',
        alternatives: ['Alternative 1', 'Alternative 2'],
        technical: 'Technical details',
        helpUrl: 'https://example.com/help'
      },
      new Error('Original error'),
      { testContext: 'value' }
    );
  };

  it('should render error message and solutions', () => {
    const error = createMockError();
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Primary solution')).toBeInTheDocument();
    expect(screen.getByText('Alternative 1')).toBeInTheDocument();
    expect(screen.getByText('Alternative 2')).toBeInTheDocument();
  });

  it('should display correct severity styling for low severity', () => {
    const error = createMockError(ErrorType.WEBWORKER_UNAVAILABLE, ErrorSeverity.LOW);
    
    render(<ErrorDisplay error={error} />);
    
    const container = screen.getByText('Test error message').closest('.border');
    expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('should display correct severity styling for high severity', () => {
    const error = createMockError(ErrorType.MEMORY_EXCEEDED, ErrorSeverity.HIGH);
    
    render(<ErrorDisplay error={error} />);
    
    const container = screen.getByText('Test error message').closest('.border');
    expect(container).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('should display correct severity styling for critical severity', () => {
    const error = createMockError(ErrorType.BROWSER_UNSUPPORTED, ErrorSeverity.CRITICAL);
    
    render(<ErrorDisplay error={error} />);
    
    const container = screen.getByText('Test error message').closest('.border');
    expect(container).toHaveClass('bg-red-100', 'border-red-300', 'text-red-900');
  });

  it('should show retry button for recoverable errors', () => {
    const error = createMockError(ErrorType.MEMORY_EXCEEDED, ErrorSeverity.HIGH, true);
    const onRetry = vi.fn();
    
    render(<ErrorDisplay error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button for non-recoverable errors', () => {
    const error = createMockError(ErrorType.FILE_INVALID, ErrorSeverity.MEDIUM, false);
    
    render(<ErrorDisplay error={error} onRetry={vi.fn()} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should show dismiss button when onDismiss is provided', () => {
    const error = createMockError();
    const onDismiss = vi.fn();
    
    render(<ErrorDisplay error={error} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss error');
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should show help link when provided', () => {
    const error = createMockError();
    
    render(<ErrorDisplay error={error} />);
    
    const helpLink = screen.getByText('View detailed help →');
    expect(helpLink).toBeInTheDocument();
    expect(helpLink).toHaveAttribute('href', 'https://example.com/help');
    expect(helpLink).toHaveAttribute('target', '_blank');
  });

  it('should toggle technical details', () => {
    const error = createMockError();
    
    render(<ErrorDisplay error={error} showTechnicalDetails={true} />);
    
    const toggleButton = screen.getByText('▶ Technical Details');
    expect(toggleButton).toBeInTheDocument();
    
    // Technical details should be hidden initially
    expect(screen.queryByText('Error ID:')).not.toBeInTheDocument();
    
    // Click to show details
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('▼ Technical Details')).toBeInTheDocument();
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    expect(screen.getByText(/Type: FILE_INVALID/)).toBeInTheDocument();
    expect(screen.getByText(/Details: Technical details/)).toBeInTheDocument();
  });

  it('should display timestamp', () => {
    const error = createMockError();
    
    render(<ErrorDisplay error={error} />);
    
    // Should show time in locale format
    const timeString = error.timestamp.toLocaleTimeString();
    expect(screen.getByText(timeString)).toBeInTheDocument();
  });

  it('should display correct severity labels', () => {
    const testCases = [
      { severity: ErrorSeverity.LOW, label: 'Warning', icon: '⚠️' },
      { severity: ErrorSeverity.MEDIUM, label: 'Error', icon: '⚠️' },
      { severity: ErrorSeverity.HIGH, label: 'Serious Error', icon: '❌' },
      { severity: ErrorSeverity.CRITICAL, label: 'Critical Error', icon: '🚨' }
    ];

    testCases.forEach(({ severity, label, icon }) => {
      const error = createMockError(ErrorType.FILE_INVALID, severity);
      const { unmount } = render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      
      unmount();
    });
  });

  it('should handle errors without alternatives', () => {
    const error = new ConversionErrorImpl(
      'Simple error',
      ErrorType.FILE_INVALID,
      ErrorSeverity.MEDIUM,
      false,
      {
        primary: 'Primary solution only'
      }
    );
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Primary solution only')).toBeInTheDocument();
    expect(screen.queryByText('Alternative Solutions:')).not.toBeInTheDocument();
  });

  it('should handle errors without help URL', () => {
    const error = new ConversionErrorImpl(
      'Error without help',
      ErrorType.FILE_INVALID,
      ErrorSeverity.MEDIUM,
      false,
      {
        primary: 'Primary solution'
      }
    );
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.queryByText('View detailed help →')).not.toBeInTheDocument();
  });

  it('should show context in technical details', () => {
    const error = createMockError();
    
    render(<ErrorDisplay error={error} showTechnicalDetails={true} />);
    
    // Open technical details
    fireEvent.click(screen.getByText('▶ Technical Details'));
    
    // Should show context as JSON
    expect(screen.getByText(/Context:/)).toBeInTheDocument();
    expect(screen.getByText(/"testContext": "value"/)).toBeInTheDocument();
  });

  it('should show original error in technical details', () => {
    const error = createMockError();
    
    render(<ErrorDisplay error={error} showTechnicalDetails={true} />);
    
    // Open technical details
    fireEvent.click(screen.getByText('▶ Technical Details'));
    
    // Should show original error message
    expect(screen.getByText(/Original: Original error/)).toBeInTheDocument();
  });

  it('should handle missing context gracefully', () => {
    const error = new ConversionErrorImpl(
      'Error without context',
      ErrorType.FILE_INVALID,
      ErrorSeverity.MEDIUM,
      false,
      {
        primary: 'Primary solution'
      }
    );
    
    render(<ErrorDisplay error={error} showTechnicalDetails={true} />);
    
    // Open technical details
    fireEvent.click(screen.getByText('▶ Technical Details'));
    
    // Should not crash and should not show context section
    expect(screen.queryByText(/Context:/)).not.toBeInTheDocument();
  });
});