import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navigation } from '../Navigation';

// Mock the icons
vi.mock('lucide-react', () => ({
  FileImage: () => <div data-testid="file-image-icon" />,
  Github: () => <div data-testid="github-icon" />,
  Twitter: () => <div data-testid="twitter-icon" />
}));

describe('Navigation Integration', () => {
  it('renders the navigation with PNG to SVG converter branding', () => {
    render(<Navigation />);
    
    expect(screen.getByText('ConvertFlow')).toBeInTheDocument();
    expect(screen.getByTestId('file-image-icon')).toBeInTheDocument();
  });

  it('includes converter link in navigation menu', () => {
    render(<Navigation />);
    
    const converterLink = screen.getByRole('link', { name: /converter/i });
    expect(converterLink).toHaveAttribute('href', '#converter');
  });

  it('has all required navigation links for the converter app', () => {
    render(<Navigation />);
    
    expect(screen.getByRole('link', { name: /features/i })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('link', { name: /how it works/i })).toHaveAttribute('href', '#how-it-works');
    expect(screen.getByRole('link', { name: /converter/i })).toHaveAttribute('href', '#converter');
    expect(screen.getByRole('link', { name: /faq/i })).toHaveAttribute('href', '#faq');
  });

  it('applies responsive design classes', () => {
    const { container } = render(<Navigation />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
    
    const menuContainer = container.querySelector('.hidden.md\\:flex');
    expect(menuContainer).toBeInTheDocument();
  });

  it('has proper styling for converter app branding', () => {
    render(<Navigation />);
    
    const brandText = screen.getByText('ConvertFlow');
    expect(brandText).toHaveClass('text-xl', 'font-bold', 'bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'bg-clip-text', 'text-transparent');
  });

  it('includes social media links', () => {
    render(<Navigation />);
    
    expect(screen.getByTestId('github-icon')).toBeInTheDocument();
    expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
  });

  it('has proper hover states for navigation links', () => {
    render(<Navigation />);
    
    const converterLink = screen.getByRole('link', { name: /converter/i });
    expect(converterLink).toHaveClass('text-gray-600', 'hover:text-gray-900', 'transition-colors');
  });

  it('maintains accessibility with proper link roles', () => {
    render(<Navigation />);
    
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    
    // Check that converter link is accessible
    const converterLink = screen.getByRole('link', { name: /converter/i });
    expect(converterLink).toBeInTheDocument();
  });
});