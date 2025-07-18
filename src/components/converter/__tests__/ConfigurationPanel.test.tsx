import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigurationPanel } from '../ConfigurationPanel';
import { VectorizationConfig } from '../../../types/converter';

const defaultConfig: VectorizationConfig = {
  colorCount: 16,
  smoothingLevel: 'medium',
  pathSimplification: 1.0,
  preserveTransparency: true,
  algorithm: 'auto'
};

describe('ConfigurationPanel', () => {
  it('renders all configuration controls', () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    // Check for all main controls
    expect(screen.getByLabelText(/color count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/smoothing level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/path simplification/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/processing algorithm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preserve transparency/i)).toBeInTheDocument();
  });

  it('displays current configuration values', () => {
    const mockOnChange = vi.fn();
    const customConfig: VectorizationConfig = {
      colorCount: 32,
      smoothingLevel: 'high',
      pathSimplification: 2.5,
      preserveTransparency: false,
      algorithm: 'shapes'
    };
    
    render(
      <ConfigurationPanel 
        config={customConfig} 
        onChange={mockOnChange} 
      />
    );

    // Check color count display
    expect(screen.getByText('Color Count: 32')).toBeInTheDocument();
    
    // Check smoothing level selection
    const smoothingSelect = screen.getByDisplayValue('High - Maximum smoothing');
    expect(smoothingSelect).toBeInTheDocument();
    
    // Check path simplification display
    expect(screen.getByText('Path Simplification: 2.5')).toBeInTheDocument();
    
    // Check algorithm selection
    const algorithmSelect = screen.getByDisplayValue('Shapes - For logos and simple graphics');
    expect(algorithmSelect).toBeInTheDocument();
    
    // Check transparency checkbox
    const transparencyCheckbox = screen.getByLabelText(/preserve transparency/i) as HTMLInputElement;
    expect(transparencyCheckbox.checked).toBe(false);
  });

  it('calls onChange when color count is modified via slider', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const colorSlider = screen.getByRole('slider');
    fireEvent.change(colorSlider, { target: { value: '64' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        colorCount: 64
      });
    });
  });

  it('calls onChange when color count is modified via number input', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const colorInput = screen.getByRole('spinbutton');
    fireEvent.change(colorInput, { target: { value: '128' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        colorCount: 128
      });
    });
  });

  it('enforces color count limits', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const colorInput = screen.getByRole('spinbutton');
    
    // Test minimum limit
    fireEvent.change(colorInput, { target: { value: '1' } });
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        colorCount: 2
      });
    });

    // Test maximum limit
    fireEvent.change(colorInput, { target: { value: '300' } });
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        colorCount: 256
      });
    });
  });

  it('calls onChange when smoothing level is changed', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const smoothingSelect = screen.getByLabelText(/smoothing level/i);
    fireEvent.change(smoothingSelect, { target: { value: 'high' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        smoothingLevel: 'high'
      });
    });
  });

  it('calls onChange when path simplification is modified', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const pathSlider = screen.getAllByRole('slider')[1]; // Second slider is path simplification
    fireEvent.change(pathSlider, { target: { value: '3.5' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        pathSimplification: 3.5
      });
    });
  });

  it('calls onChange when algorithm is changed', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const algorithmSelect = screen.getByLabelText(/processing algorithm/i);
    fireEvent.change(algorithmSelect, { target: { value: 'photo' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        algorithm: 'photo'
      });
    });
  });

  it('calls onChange when transparency setting is toggled', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const transparencyCheckbox = screen.getByLabelText(/preserve transparency/i);
    fireEvent.click(transparencyCheckbox);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        preserveTransparency: false
      });
    });
  });

  it('disables all controls when disabled prop is true', () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
        disabled={true}
      />
    );

    // Check that all interactive elements are disabled
    const colorSlider = screen.getByRole('slider');
    const colorInput = screen.getByRole('spinbutton');
    const smoothingSelect = screen.getByLabelText(/smoothing level/i);
    const algorithmSelect = screen.getByLabelText(/processing algorithm/i);
    const transparencyCheckbox = screen.getByLabelText(/preserve transparency/i);

    expect(colorSlider).toBeDisabled();
    expect(colorInput).toBeDisabled();
    expect(smoothingSelect).toBeDisabled();
    expect(algorithmSelect).toBeDisabled();
    expect(transparencyCheckbox).toBeDisabled();
  });

  it('handles invalid number inputs gracefully', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <ConfigurationPanel 
        config={defaultConfig} 
        onChange={mockOnChange} 
      />
    );

    const colorInput = screen.getByRole('spinbutton');
    fireEvent.change(colorInput, { target: { value: 'invalid' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultConfig,
        colorCount: 2 // Should default to minimum value
      });
    });
  });
});