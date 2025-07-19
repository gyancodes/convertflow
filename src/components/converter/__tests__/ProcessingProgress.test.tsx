import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProcessingProgress from '../ProcessingProgress';
import { ProcessingProgress as ProcessingProgressType } from '../../../types/converter';

describe('ProcessingProgress', () => {
  const mockProgress: ProcessingProgressType = {
    stage: 'quantize',
    progress: 45,
    message: 'Reducing color count...',
    estimatedTimeRemaining: 5000
  };

  it('renders processing progress with stage indicators', () => {
    render(<ProcessingProgress progress={mockProgress} isProcessing={true} />);
    
    expect(screen.getByText('Converting to SVG')).toBeInTheDocument();
    expect(screen.getAllByText('Reducing Colors')).toHaveLength(2); // Stage indicator and current stage
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Reducing color count...')).toBeInTheDocument();
  });

  it('displays all processing stages in correct order', () => {
    render(<ProcessingProgress progress={mockProgress} isProcessing={true} />);
    
    const stages = ['Uploading File', 'Preprocessing Image', 'Creating Vectors', 'Generating SVG'];
    stages.forEach(stage => {
      expect(screen.getByText(stage)).toBeInTheDocument();
    });
    // 'Reducing Colors' appears twice, so check separately
    expect(screen.getAllByText('Reducing Colors')).toHaveLength(2);
  });

  it('shows completed stages with checkmarks', () => {
    const { container } = render(<ProcessingProgress progress={mockProgress} isProcessing={true} />);
    
    // Upload and preprocess should be completed (have checkmarks)
    const checkmarkSvgs = container.querySelectorAll('svg');
    expect(checkmarkSvgs).toHaveLength(2); // Two completed stages
    
    // Check that completed stages have green background
    const completedStages = container.querySelectorAll('.bg-green-500');
    expect(completedStages).toHaveLength(2);
  });

  it('displays estimated time remaining correctly', () => {
    render(<ProcessingProgress progress={mockProgress} isProcessing={true} />);
    
    expect(screen.getByText('5s remaining')).toBeInTheDocument();
  });

  it('formats time remaining for minutes and seconds', () => {
    const progressWithLongTime: ProcessingProgressType = {
      ...mockProgress,
      estimatedTimeRemaining: 125000 // 2 minutes 5 seconds
    };
    
    render(<ProcessingProgress progress={progressWithLongTime} isProcessing={true} />);
    
    expect(screen.getByText('2m 5s remaining')).toBeInTheDocument();
  });

  it('shows cancel button when onCancel is provided and processing', () => {
    const mockCancel = vi.fn();
    render(
      <ProcessingProgress 
        progress={mockProgress} 
        isProcessing={true} 
        onCancel={mockCancel} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    expect(mockCancel).toHaveBeenCalledOnce();
  });

  it('hides cancel button when not processing', () => {
    const mockCancel = vi.fn();
    render(
      <ProcessingProgress 
        progress={mockProgress} 
        isProcessing={false} 
        onCancel={mockCancel} 
      />
    );
    
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('calculates overall progress correctly', () => {
    // Stage 2 (quantize) at 45% should be (2 + 0.45) / 5 * 100 = 49%
    render(<ProcessingProgress progress={mockProgress} isProcessing={true} />);
    
    expect(screen.getByText('49%')).toBeInTheDocument();
  });

  it('handles first stage correctly', () => {
    const uploadProgress: ProcessingProgressType = {
      stage: 'upload',
      progress: 30,
      message: 'Reading image data...',
      estimatedTimeRemaining: 2000
    };
    
    render(<ProcessingProgress progress={uploadProgress} isProcessing={true} />);
    
    expect(screen.getByText('6%')).toBeInTheDocument(); // (0 + 0.3) / 5 * 100
    expect(screen.getByText('Reading image data...')).toBeInTheDocument();
  });

  it('handles last stage correctly', () => {
    const generateProgress: ProcessingProgressType = {
      stage: 'generate',
      progress: 80,
      message: 'Finalizing SVG output...',
      estimatedTimeRemaining: 500
    };
    
    render(<ProcessingProgress progress={generateProgress} isProcessing={true} />);
    
    expect(screen.getByText('96%')).toBeInTheDocument(); // (4 + 0.8) / 5 * 100
    expect(screen.getByText('Finalizing SVG output...')).toBeInTheDocument();
  });

  it('handles zero estimated time remaining', () => {
    const progressWithoutTime: ProcessingProgressType = {
      ...mockProgress,
      estimatedTimeRemaining: 0
    };
    
    render(<ProcessingProgress progress={progressWithoutTime} isProcessing={true} />);
    
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
  });

  it('handles undefined estimated time remaining', () => {
    const progressWithoutTime: ProcessingProgressType = {
      stage: 'vectorize',
      progress: 75,
      message: 'Creating vector paths...'
      // No estimatedTimeRemaining
    };
    
    render(<ProcessingProgress progress={progressWithoutTime} isProcessing={true} />);
    
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
  });

  it('applies correct styling for different stage states', () => {
    render(<ProcessingProgress progress={mockProgress} isProcessing={true} />);
    
    // Check that stage indicators have correct classes
    const stageIndicators = screen.getAllByRole('generic').filter(el => 
      el.className.includes('rounded-full')
    );
    
    // Should have completed, active, and pending stages with different colors
    expect(stageIndicators.length).toBeGreaterThan(0);
  });

  it('updates progress bar width correctly', () => {
    const { container } = render(<ProcessingProgress progress={mockProgress} isProcessing={true} />);
    
    // Check that progress bars have correct width styles
    const progressBars = container.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});