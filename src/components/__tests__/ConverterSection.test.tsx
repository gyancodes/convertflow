import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConverterSection } from '../ConverterSection';

// Mock the PngToSvgConverter component
vi.mock('../converter/PngToSvgConverter', () => ({
  PngToSvgConverter: ({ enableBatchMode, maxBatchSize }: { enableBatchMode: boolean; maxBatchSize: number }) => (
    <div data-testid="png-to-svg-converter">
      <div data-testid="batch-mode">{enableBatchMode ? 'enabled' : 'disabled'}</div>
      <div data-testid="max-batch-size">{maxBatchSize}</div>
    </div>
  )
}));

describe('ConverterSection', () => {
  it('renders the converter section with proper heading and description', () => {
    render(<ConverterSection />);
    
    expect(screen.getByText('Start Converting Now')).toBeInTheDocument();
    expect(screen.getByText(/Upload your PNG files and watch them transform/)).toBeInTheDocument();
  });

  it('renders the PngToSvgConverter component with correct props', () => {
    render(<ConverterSection />);
    
    const converter = screen.getByTestId('png-to-svg-converter');
    expect(converter).toBeInTheDocument();
    
    expect(screen.getByTestId('batch-mode')).toHaveTextContent('enabled');
    expect(screen.getByTestId('max-batch-size')).toHaveTextContent('10');
  });

  it('has the correct section id for navigation', () => {
    const { container } = render(<ConverterSection />);
    const section = container.querySelector('section');
    
    expect(section).toHaveAttribute('id', 'converter');
  });

  it('applies responsive design classes', () => {
    const { container } = render(<ConverterSection />);
    const section = container.querySelector('section');
    
    expect(section).toHaveClass('py-20');
    
    const heading = screen.getByText('Start Converting Now');
    expect(heading).toHaveClass('text-4xl', 'md:text-5xl');
    
    const description = screen.getByText(/Upload your PNG files and watch them transform/);
    expect(description).toHaveClass('text-xl');
  });

  it('includes background decorative elements', () => {
    const { container } = render(<ConverterSection />);
    const decorativeElements = container.querySelectorAll('.absolute');
    
    expect(decorativeElements).toHaveLength(2);
    decorativeElements.forEach(element => {
      expect(element).toHaveClass('rounded-full', 'opacity-20', 'blur-3xl', 'animate-pulse');
    });
  });

  it('is accessible with proper heading hierarchy', () => {
    render(<ConverterSection />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Start Converting Now');
  });
});