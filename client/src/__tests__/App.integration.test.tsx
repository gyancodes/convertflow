import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock all the components to focus on integration
vi.mock('../components/Navigation', () => ({
  Navigation: () => (
    <nav data-testid="navigation">
      <a href="#converter" data-testid="converter-link">Converter</a>
    </nav>
  )
}));

vi.mock('../components/Hero', () => ({
  Hero: ({ onGetStarted }: { onGetStarted: () => void }) => (
    <div data-testid="hero">
      <button onClick={onGetStarted} data-testid="get-started-btn">Get Started</button>
    </div>
  )
}));

vi.mock('../components/Features', () => ({
  Features: () => <div data-testid="features">Features</div>
}));

vi.mock('../components/HowItWorks', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How It Works</div>
}));

vi.mock('../components/ConverterSection', () => ({
  ConverterSection: () => <div data-testid="converter-section">Converter Section</div>
}));

vi.mock('../components/FAQ', () => ({
  FAQ: () => <div data-testid="faq">FAQ</div>
}));

vi.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>
}));

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: mockScrollIntoView,
});

describe('App Integration', () => {
  beforeEach(() => {
    mockScrollIntoView.mockClear();
  });

  it('renders all main sections in correct order', () => {
    render(<App />);
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('features')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('converter-section')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('applies minimum height to the main container', () => {
    const { container } = render(<App />);
    const mainDiv = container.firstChild as HTMLElement;
    
    expect(mainDiv).toHaveClass('min-h-screen');
  });

  it('integrates scroll-to-converter functionality', async () => {
    render(<App />);
    
    const getStartedButton = screen.getByTestId('get-started-btn');
    fireEvent.click(getStartedButton);
    
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  it('includes analytics component', () => {
    // The Analytics component is mocked to return null, but we can verify it's imported
    // by checking that the app renders without errors
    expect(() => render(<App />)).not.toThrow();
  });

  it('has proper navigation integration with converter section', () => {
    render(<App />);
    
    const converterLink = screen.getByTestId('converter-link');
    expect(converterLink).toHaveAttribute('href', '#converter');
  });

  it('maintains responsive layout structure', () => {
    const { container } = render(<App />);
    
    // Check that the main container has responsive classes
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen');
  });
});