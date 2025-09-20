/**
 * Tests for ErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Mock window.location.reload
  const mockReload = vi.fn();
  Object.defineProperty(window, 'location', {
    value: {
      reload: mockReload,
      href: 'http://localhost:3000'
    },
    writable: true
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch and display error when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Component crashed" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/The application encountered an unexpected error/)).toBeInTheDocument();
    expect(screen.getByText('Component crashed')).toBeInTheDocument();
  });

  it('should show retry button and handle retry', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    // Click retry - this should reset the error state
    fireEvent.click(retryButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should show reload button and handle page reload', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    expect(reloadButton).toBeInTheDocument();

    fireEvent.click(reloadButton);
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('should call onError callback when provided', () => {
    const onError = vi.fn();
    const testError = new Error('Test callback error');

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} errorMessage="Test callback error" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test callback error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should show technical details', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Technical error" />
      </ErrorBoundary>
    );

    // Technical details should be visible by default in error boundary
    expect(screen.getByText('▶ Technical Details')).toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(screen.getByText('▶ Technical Details'));
    
    expect(screen.getByText('▼ Technical Details')).toBeInTheDocument();
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    expect(screen.getByText(/Type: UNKNOWN/)).toBeInTheDocument();
  });

  it('should include error context in technical details', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Context error" />
      </ErrorBoundary>
    );

    // Expand technical details
    fireEvent.click(screen.getByText('▶ Technical Details'));

    // Should show context information
    expect(screen.getByText(/userAgent:/)).toBeInTheDocument();
    expect(screen.getByText(/url:/)).toBeInTheDocument();
    expect(screen.getByText(/timestamp:/)).toBeInTheDocument();
  });

  it('should show helpful suggestions', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('If this problem persists, please try:')).toBeInTheDocument();
    expect(screen.getByText('• Using a different browser')).toBeInTheDocument();
    expect(screen.getByText('• Clearing your browser cache')).toBeInTheDocument();
    expect(screen.getByText('• Disabling browser extensions')).toBeInTheDocument();
    expect(screen.getByText('• Trying with a smaller or simpler image')).toBeInTheDocument();
  });

  it('should handle errors with empty messages', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="" />
      </ErrorBoundary>
    );

    // Should show default message when error message is empty
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('should log error details to console', () => {
    const consoleSpy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Console test error" />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.objectContaining({ message: 'Console test error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error Report:',
      expect.objectContaining({
        message: 'Console test error',
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String),
        errorBoundary: true
      })
    );
  });

  it('should handle multiple errors gracefully', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="First error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('First error')).toBeInTheDocument();

    // Reset and throw a different error
    fireEvent.click(screen.getByText('Try Again'));

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Second error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Second error')).toBeInTheDocument();
  });

  it('should maintain error state until retry is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Persistent error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Persistent error')).toBeInTheDocument();

    // Re-render without clicking retry - error should persist
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Error should still be shown
    expect(screen.getByText('Persistent error')).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });
});