import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConverterSection } from '../ConverterSection';
import { Navigation } from '../Navigation';

// Mock the PngToSvgConverter component
vi.mock('../converter/PngToSvgConverter', () => ({
  PngToSvgConverter: () => <div data-testid="png-to-svg-converter">Converter</div>
}));

// Mock the icons
vi.mock('lucide-react', () => ({
  FileImage: () => <div data-testid="file-image-icon" />,
  Github: () => <div data-testid="github-icon" />,
  Twitter: () => <div data-testid="twitter-icon" />
}));

// Helper function to simulate different screen sizes
const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Design', () => {
  beforeEach(() => {
    // Reset to desktop size
    setViewport(1024);
  });

  afterEach(() => {
    // Clean up
    setViewport(1024);
  });

  describe('ConverterSection Responsive Design', () => {
    it('applies responsive typography classes', () => {
      render(<ConverterSection />);
      
      const heading = screen.getByText('Start Converting Now');
      expect(heading).toHaveClass('text-4xl', 'md:text-5xl');
      
      const description = screen.getByText(/Upload your PNG files and watch them transform/);
      expect(description).toHaveClass('text-xl');
    });

    it('uses responsive container and padding', () => {
      const { container } = render(<ConverterSection />);
      
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toHaveClass('mx-auto', 'px-4');
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('py-20');
    });

    it('has responsive spacing for content', () => {
      render(<ConverterSection />);
      
      const textCenter = screen.getByText('Start Converting Now').closest('.text-center');
      expect(textCenter).toHaveClass('mb-16');
    });

    it('maintains proper layout on mobile screens', () => {
      // The responsive classes should work regardless of actual viewport
      // since we're testing the presence of Tailwind classes
      render(<ConverterSection />);
      
      const heading = screen.getByText('Start Converting Now');
      expect(heading).toHaveClass('text-4xl', 'md:text-5xl');
      
      // Verify that mobile-first approach is used
      expect(heading.className).toMatch(/text-4xl.*md:text-5xl/);
    });
  });

  describe('Navigation Responsive Design', () => {
    it('hides navigation menu on mobile', () => {
      const { container } = render(<Navigation />);
      
      const mobileHiddenMenu = container.querySelector('.hidden.md\\:flex');
      expect(mobileHiddenMenu).toBeInTheDocument();
      expect(mobileHiddenMenu).toHaveClass('hidden', 'md:flex');
    });

    it('maintains fixed positioning across screen sizes', () => {
      const { container } = render(<Navigation />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
    });

    it('uses responsive container for navigation content', () => {
      const { container } = render(<Navigation />);
      
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toHaveClass('mx-auto', 'px-4', 'py-4');
    });

    it('applies responsive spacing for navigation items', () => {
      const { container } = render(<Navigation />);
      
      const navItems = container.querySelector('.hidden.md\\:flex');
      expect(navItems).toHaveClass('items-center', 'space-x-8');
    });
  });

  describe('Mobile-First Design Approach', () => {
    it('uses mobile-first responsive classes in ConverterSection', () => {
      render(<ConverterSection />);
      
      const heading = screen.getByText('Start Converting Now');
      const classes = heading.className;
      
      // Check that base mobile class comes before desktop modifier
      expect(classes).toMatch(/text-4xl.*md:text-5xl/);
    });

    it('ensures proper touch targets for mobile', () => {
      render(<Navigation />);
      
      // Social media links should have adequate spacing
      const socialContainer = screen.getByTestId('github-icon').closest('.flex');
      expect(socialContainer).toHaveClass('space-x-4');
    });

    it('maintains readability on small screens', () => {
      render(<ConverterSection />);
      
      const description = screen.getByText(/Upload your PNG files and watch them transform/);
      expect(description).toHaveClass('text-xl', 'max-w-2xl', 'mx-auto');
    });
  });

  describe('Desktop Enhancement', () => {
    it('enhances typography for larger screens', () => {
      render(<ConverterSection />);
      
      const heading = screen.getByText('Start Converting Now');
      expect(heading).toHaveClass('md:text-5xl');
    });

    it('shows full navigation menu on desktop', () => {
      const { container } = render(<Navigation />);
      
      const desktopMenu = container.querySelector('.hidden.md\\:flex');
      expect(desktopMenu).toHaveClass('md:flex');
    });

    it('uses appropriate spacing for desktop layout', () => {
      const { container } = render(<Navigation />);
      
      const navItems = container.querySelector('.hidden.md\\:flex');
      expect(navItems).toHaveClass('space-x-8');
    });
  });

  describe('Cross-Device Compatibility', () => {
    it('maintains consistent branding across screen sizes', () => {
      render(<Navigation />);
      
      const brandText = screen.getByText('ConvertFlow');
      expect(brandText).toHaveClass('text-xl', 'font-bold');
    });

    it('ensures converter functionality is accessible on all devices', () => {
      render(<ConverterSection />);
      
      const converter = screen.getByTestId('png-to-svg-converter');
      expect(converter).toBeInTheDocument();
    });

    it('maintains proper visual hierarchy on all screen sizes', () => {
      render(<ConverterSection />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('font-bold', 'text-gray-900');
    });
  });
});