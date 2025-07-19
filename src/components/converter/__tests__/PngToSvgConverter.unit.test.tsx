import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PngToSvgConverter } from '../PngToSvgConverter';

describe('PngToSvgConverter Unit Tests', () => {
  describe('Component Rendering', () => {
    it('should render the main converter interface', () => {
      render(<PngToSvgConverter />);

      // Verify main elements are present
      expect(screen.getByText('PNG to SVG Converter')).toBeInTheDocument();
      expect(screen.getByText('Convert your PNG images to scalable vector graphics with advanced vectorization algorithms')).toBeInTheDocument();
      expect(screen.getByText('Vectorization Settings')).toBeInTheDocument();
      expect(screen.getByText('Upload PNG Images')).toBeInTheDocument();
    });

    it('should render configuration panel with default settings', () => {
      render(<PngToSvgConverter />);

      // Verify configuration controls
      expect(screen.getByLabelText(/color count/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/smoothing level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/path simplification/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/processing algorithm/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preserve transparency/i)).toBeInTheDocument();
    });

    it('should render file upload area', () => {
      render(<PngToSvgConverter />);

      // Verify file upload elements
      expect(screen.getByText('Upload PNG Images')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop your PNG files here, or click to browse')).toBeInTheDocument();
      expect(screen.getByText(/supports up to.*files/i)).toBeInTheDocument();
      
      // Verify file input exists
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.png,image/png');
      expect(fileInput).toHaveAttribute('multiple');
    });

    it('should apply initial configuration props', () => {
      const initialConfig = {
        colorCount: 32,
        smoothingLevel: 'high' as const,
        pathSimplification: 2.5,
        algorithm: 'photo' as const
      };

      render(<PngToSvgConverter initialConfig={initialConfig} />);

      // Verify initial values are applied
      const colorCountSlider = screen.getByLabelText(/color count/i);
      expect(colorCountSlider).toHaveValue('32');

      const smoothingSelect = screen.getByLabelText(/smoothing level/i);
      expect(smoothingSelect).toHaveValue('high');

      const pathSimplificationSlider = screen.getByLabelText(/path simplification/i);
      expect(pathSimplificationSlider).toHaveValue('2.5');

      const algorithmSelect = screen.getByLabelText(/processing algorithm/i);
      expect(algorithmSelect).toHaveValue('photo');
    });

    it('should handle batch mode configuration', () => {
      render(<PngToSvgConverter enableBatchMode={true} maxBatchSize={10} />);

      // Verify batch mode is enabled (should show different max files)
      expect(screen.getByText(/supports up to 10 files/i)).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain component state without errors', () => {
      const { rerender } = render(<PngToSvgConverter />);

      // Verify component renders without errors
      expect(screen.getByText('PNG to SVG Converter')).toBeInTheDocument();

      // Re-render with different props
      rerender(<PngToSvgConverter enableBatchMode={true} />);
      expect(screen.getByText('PNG to SVG Converter')).toBeInTheDocument();
    });

    it('should handle prop changes gracefully', () => {
      const { rerender } = render(<PngToSvgConverter maxBatchSize={5} />);
      
      expect(screen.getByText(/supports up to 5 files/i)).toBeInTheDocument();

      rerender(<PngToSvgConverter maxBatchSize={15} />);
      expect(screen.getByText(/supports up to 15 files/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and accessibility attributes', () => {
      render(<PngToSvgConverter />);

      // Verify form controls have proper labels
      expect(screen.getByLabelText(/color count/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/smoothing level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/path simplification/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/processing algorithm/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preserve transparency/i)).toBeInTheDocument();

      // Verify headings are present for screen readers
      expect(screen.getByRole('heading', { name: /png to svg converter/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /vectorization settings/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /upload png images/i })).toBeInTheDocument();
    });

    it('should have proper form control types and attributes', () => {
      render(<PngToSvgConverter />);

      // Verify input types and attributes
      const colorCountSlider = screen.getByLabelText(/color count/i);
      expect(colorCountSlider).toHaveAttribute('type', 'range');
      expect(colorCountSlider).toHaveAttribute('min', '2');
      expect(colorCountSlider).toHaveAttribute('max', '256');

      const pathSimplificationSlider = screen.getByLabelText(/path simplification/i);
      expect(pathSimplificationSlider).toHaveAttribute('type', 'range');
      expect(pathSimplificationSlider).toHaveAttribute('min', '0.1');
      expect(pathSimplificationSlider).toHaveAttribute('max', '10.0');

      const preserveTransparencyCheckbox = screen.getByLabelText(/preserve transparency/i);
      expect(preserveTransparencyCheckbox).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('Error Boundaries', () => {
    it('should not crash with invalid initial configuration', () => {
      // Test with potentially problematic config
      const invalidConfig = {
        colorCount: -1, // Invalid value
        smoothingLevel: 'invalid' as any, // Invalid enum
        pathSimplification: 999, // Out of range
      };

      // Should not throw error, component should handle gracefully
      expect(() => {
        render(<PngToSvgConverter initialConfig={invalidConfig} />);
      }).not.toThrow();

      // Component should still render
      expect(screen.getByText('PNG to SVG Converter')).toBeInTheDocument();
    });

    it('should handle missing props gracefully', () => {
      // Should render with all undefined props
      expect(() => {
        render(<PngToSvgConverter 
          initialConfig={undefined}
          enableBatchMode={undefined}
          maxBatchSize={undefined}
        />);
      }).not.toThrow();

      expect(screen.getByText('PNG to SVG Converter')).toBeInTheDocument();
    });
  });
});