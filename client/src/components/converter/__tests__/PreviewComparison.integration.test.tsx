import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PreviewComparison from '../PreviewComparison';
import { ProcessingResult } from '../../../types/converter';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true
});

describe('PreviewComparison Integration Tests', () => {
  beforeEach(() => {
    mockCreateObjectURL.mockReturnValue('mock-url');
    mockRevokeObjectURL.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle a typical conversion workflow', async () => {
      // Create a realistic PNG file
      const pngData = new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, // PNG signature
        0, 0, 0, 13, 73, 72, 68, 82, // IHDR chunk
        0, 0, 0, 100, 0, 0, 0, 100, // 100x100 dimensions
        8, 2, 0, 0, 0, // bit depth, color type, etc.
      ]);
      const mockFile = new File([pngData], 'test-image.png', { type: 'image/png' });

      // Create a realistic processing result
      const mockResult: ProcessingResult = {
        svgContent: `
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" fill="#ff0000"/>
            <circle cx="50" cy="50" r="20" fill="#00ff00"/>
            <path d="M20,20 L80,80 M80,20 L20,80" stroke="#0000ff" stroke-width="2"/>
          </svg>
        `,
        originalSize: pngData.length,
        vectorSize: 245, // Approximate SVG size
        processingTime: 2340,
        colorCount: 3,
        pathCount: 3
      };

      const mockOnDownload = vi.fn();

      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
          onDownload={mockOnDownload}
        />
      );

      // Verify the component renders correctly
      expect(screen.getByText('Preview & Comparison')).toBeInTheDocument();
      
      // Check file size information
      expect(screen.getAllByText(/Original PNG/)).toHaveLength(2); // One in size display, one in image overlay
      expect(screen.getAllByText(/Generated SVG/)).toHaveLength(2); // One in size display, one in image overlay
      
      // Verify processing statistics
      expect(screen.getByText(/Processing time: 2340ms/)).toBeInTheDocument();
      expect(screen.getByText(/Colors: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Paths: 3/)).toBeInTheDocument();

      // Test zoom functionality
      const zoomInButton = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInButton);
      expect(screen.getByText('120%')).toBeInTheDocument();

      // Test download functionality
      const downloadButton = screen.getByText('Download SVG');
      fireEvent.click(downloadButton);
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('should handle large image files gracefully', () => {
      // Create a large file scenario
      const largeFileSize = 8 * 1024 * 1024; // 8MB
      const mockFile = new File(['x'.repeat(1000)], 'large-image.png', { type: 'image/png' });

      const mockResult: ProcessingResult = {
        svgContent: '<svg><rect width="1000" height="1000" fill="red"/></svg>',
        originalSize: largeFileSize,
        vectorSize: 1024, // Much smaller SVG
        processingTime: 15000, // 15 seconds
        colorCount: 1,
        pathCount: 1
      };

      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      // Should show significant size reduction
      expect(screen.getByText('8 MB')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
      expect(screen.getByText('-100.0%')).toBeInTheDocument(); // Almost 100% reduction
    });

    it('should handle complex SVG with many paths', () => {
      const mockFile = new File(['test'], 'complex.png', { type: 'image/png' });

      // Simulate a complex conversion result
      const complexSvg = `
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          ${Array.from({ length: 50 }, (_, i) => 
            `<path d="M${i*4},${i*4} L${i*4+10},${i*4+10}" stroke="rgb(${i*5},${i*3},${i*2})" fill="none"/>`
          ).join('\n')}
        </svg>
      `;

      const mockResult: ProcessingResult = {
        svgContent: complexSvg,
        originalSize: 2048,
        vectorSize: complexSvg.length,
        processingTime: 8500,
        colorCount: 50,
        pathCount: 50
      };

      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      // Verify complex processing stats
      expect(screen.getByText(/Colors: 50/)).toBeInTheDocument();
      expect(screen.getByText(/Paths: 50/)).toBeInTheDocument();
      expect(screen.getByText(/Processing time: 8500ms/)).toBeInTheDocument();
    });

    it('should handle edge case with zero-size files', () => {
      const mockFile = new File([''], 'empty.png', { type: 'image/png' });

      const mockResult: ProcessingResult = {
        svgContent: '<svg></svg>',
        originalSize: 0,
        vectorSize: 11, // "<svg></svg>" length
        processingTime: 100,
        colorCount: 0,
        pathCount: 0
      };

      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      // Should handle zero sizes gracefully
      expect(screen.getByText('0 B')).toBeInTheDocument();
      expect(screen.getByText('11 B')).toBeInTheDocument();
    });
  });

  describe('User Interaction Workflows', () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const mockResult: ProcessingResult = {
      svgContent: '<svg><rect width="100" height="100" fill="red"/></svg>',
      originalSize: 1024,
      vectorSize: 512,
      processingTime: 1500,
      colorCount: 5,
      pathCount: 3
    };

    it('should support complete zoom and pan workflow', () => {
      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      // Start at 100%
      expect(screen.getByText('100%')).toBeInTheDocument();

      // Zoom in multiple times
      const zoomInButton = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);
      expect(screen.getByText('144%')).toBeInTheDocument();

      // Pan instruction should appear when zoomed
      expect(screen.getByText('Click and drag to pan')).toBeInTheDocument();

      // Zoom out
      const zoomOutButton = screen.getByTitle('Zoom Out');
      fireEvent.click(zoomOutButton);
      expect(screen.getByText('120%')).toBeInTheDocument();

      // Reset zoom
      const resetButton = screen.getByTitle('Reset Zoom');
      fireEvent.click(resetButton);
      expect(screen.getByText('100%')).toBeInTheDocument();

      // Pan instruction should disappear
      expect(screen.queryByText('Click and drag to pan')).not.toBeInTheDocument();
    });

    it('should handle mouse wheel zoom smoothly', () => {
      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      const container = screen.getByRole('img', { name: 'Original PNG' }).closest('.relative');
      
      if (container) {
        // Zoom in with wheel
        fireEvent.wheel(container, { deltaY: -100 });
        expect(screen.getByText('110%')).toBeInTheDocument();

        // Zoom out with wheel
        fireEvent.wheel(container, { deltaY: 100 });
        fireEvent.wheel(container, { deltaY: 100 });
        expect(screen.getByText('89%')).toBeInTheDocument();
      }
    });

    it('should maintain zoom state during pan operations', () => {
      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      // Zoom in first
      const zoomInButton = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInButton);
      expect(screen.getByText('120%')).toBeInTheDocument();

      const container = screen.getByRole('img', { name: 'Original PNG' }).closest('.relative');
      
      if (container) {
        // Perform pan operation
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(container);

        // Zoom should remain the same
        expect(screen.getByText('120%')).toBeInTheDocument();
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should properly clean up resources on unmount', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockResult: ProcessingResult = {
        svgContent: '<svg><rect width="100" height="100" fill="red"/></svg>',
        originalSize: 1024,
        vectorSize: 512,
        processingTime: 1500,
        colorCount: 5,
        pathCount: 3
      };

      const { unmount } = render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      // Verify URLs were created
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);

      // Unmount and verify cleanup
      unmount();
      
      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle rapid zoom changes without issues', () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockResult: ProcessingResult = {
        svgContent: '<svg><rect width="100" height="100" fill="red"/></svg>',
        originalSize: 1024,
        vectorSize: 512,
        processingTime: 1500,
        colorCount: 5,
        pathCount: 3
      };

      render(
        <PreviewComparison
          originalFile={mockFile}
          result={mockResult}
        />
      );

      const zoomInButton = screen.getByTitle('Zoom In');
      const zoomOutButton = screen.getByTitle('Zoom Out');

      // Rapid zoom changes
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomInButton);
        fireEvent.click(zoomOutButton);
      }

      // Should still be functional
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});