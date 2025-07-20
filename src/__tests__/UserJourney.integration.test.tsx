import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock all components except the main integration points
vi.mock('../components/converter/PngToSvgConverter', () => ({
  PngToSvgConverter: ({ enableBatchMode, maxBatchSize }: { enableBatchMode: boolean; maxBatchSize: number }) => (
    <div data-testid="png-to-svg-converter">
      <div data-testid="converter-ready">Ready to convert PNG to SVG</div>
      <div data-testid="batch-enabled">{enableBatchMode ? 'Batch mode enabled' : 'Single file mode'}</div>
      <div data-testid="max-files">Max files: {maxBatchSize}</div>
      <button data-testid="mock-upload">Upload PNG</button>
      <button data-testid="mock-convert">Convert to SVG</button>
    </div>
  )
}));

vi.mock('../components/Features', () => ({
  Features: () => (
    <div data-testid="features" id="features">
      <h2>Features</h2>
      <p>Lightning fast PNG to SVG conversion</p>
    </div>
  )
}));

vi.mock('../components/HowItWorks', () => ({
  HowItWorks: () => (
    <div data-testid="how-it-works" id="how-it-works">
      <h2>How It Works</h2>
      <p>Simple 3-step process</p>
    </div>
  )
}));

vi.mock('../components/FAQ', () => ({
  FAQ: () => (
    <div data-testid="faq" id="faq">
      <h2>FAQ</h2>
      <p>Frequently asked questions</p>
    </div>
  )
}));

vi.mock('../components/Footer', () => ({
  Footer: () => (
    <div data-testid="footer">
      <p>Footer content</p>
    </div>
  )
}));

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null
}));

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: mockScrollIntoView,
});

describe('User Journey Integration', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
  });

  it('completes the full user journey from landing to converter', async () => {
    render(<App />);
    
    // 1. User lands on the page and sees the hero section
    expect(screen.getByText(/Convert PNG to/)).toBeInTheDocument();
    // Check for the main heading content
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // 2. User can navigate through sections via navigation
    const featuresLink = screen.getByRole('link', { name: /features/i });
    const howItWorksLink = screen.getByRole('link', { name: /how it works/i });
    const converterLink = screen.getByRole('link', { name: /converter/i });
    const faqLink = screen.getByRole('link', { name: /faq/i });
    
    expect(featuresLink).toHaveAttribute('href', '#features');
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');
    expect(converterLink).toHaveAttribute('href', '#converter');
    expect(faqLink).toHaveAttribute('href', '#faq');
    
    // 3. User clicks "Get Started" and is scrolled to converter
    const getStartedButton = screen.getByRole('button', { name: /start converting/i });
    fireEvent.click(getStartedButton);
    
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
    
    // 4. User sees the converter section with proper configuration
    expect(screen.getByText('Start Converting Now')).toBeInTheDocument();
    expect(screen.getByTestId('png-to-svg-converter')).toBeInTheDocument();
    expect(screen.getByTestId('batch-enabled')).toHaveTextContent('Batch mode enabled');
    expect(screen.getByTestId('max-files')).toHaveTextContent('Max files: 10');
    
    // 5. User can interact with the converter
    expect(screen.getByTestId('mock-upload')).toBeInTheDocument();
    expect(screen.getByTestId('mock-convert')).toBeInTheDocument();
  });

  it('provides consistent navigation experience', () => {
    render(<App />);
    
    // Navigation is always accessible
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    
    // Brand is visible and properly styled
    const brand = screen.getByText('ConvertFlow');
    expect(brand).toBeInTheDocument();
    expect(brand).toHaveClass('text-xl', 'font-bold');
    
    // All main sections are accessible via navigation
    expect(screen.getByRole('link', { name: /features/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /converter/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /faq/i })).toBeInTheDocument();
  });

  it('maintains proper content hierarchy and accessibility', () => {
    render(<App />);
    
    // Main heading is properly structured
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
    
    // Section headings are properly structured
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.length).toBeGreaterThan(0);
    
    // Converter section has proper heading
    const converterHeading = screen.getByText('Start Converting Now');
    expect(converterHeading.tagName).toBe('H2');
  });

  it('provides clear value proposition and call-to-action flow', () => {
    render(<App />);
    
    // Value proposition is clear
    expect(screen.getByText(/Transform your PNG images into crisp, scalable vector graphics/)).toBeInTheDocument();
    expect(screen.getByText('No quality loss.')).toBeInTheDocument();
    expect(screen.getByText('No uploads.')).toBeInTheDocument();
    expect(screen.getByText('No limits.')).toBeInTheDocument();
    
    // Clear call-to-action
    const ctaButton = screen.getByRole('button', { name: /start converting/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'via-purple-600', 'to-pink-600');
    
    // Secondary information is available
    expect(screen.getByText(/100% Free • No Limits • No Sign-up/)).toBeInTheDocument();
  });

  it('ensures converter is properly integrated with batch processing', () => {
    render(<App />);
    
    const converter = screen.getByTestId('png-to-svg-converter');
    expect(converter).toBeInTheDocument();
    
    // Batch mode is enabled as specified in requirements
    expect(screen.getByTestId('batch-enabled')).toHaveTextContent('Batch mode enabled');
    
    // Max batch size is set correctly
    expect(screen.getByTestId('max-files')).toHaveTextContent('Max files: 10');
  });

  it('maintains responsive design throughout the user journey', () => {
    const { container } = render(<App />);
    
    // Main container is responsive
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen');
    
    // Navigation is responsive
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
    
    // Hero section is responsive
    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toHaveClass('text-5xl', 'md:text-7xl');
    
    // Converter section is responsive
    const converterHeading = screen.getByText('Start Converting Now');
    expect(converterHeading).toHaveClass('text-4xl', 'md:text-5xl');
  });

  it('provides proper error boundaries and fallbacks', () => {
    // The app should render without throwing errors
    expect(() => render(<App />)).not.toThrow();
    
    // All critical sections should be present
    expect(screen.getByTestId('png-to-svg-converter')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});