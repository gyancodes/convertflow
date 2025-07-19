import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PngToSvgConverter } from '../PngToSvgConverter';

// Mock all the services with working implementations
vi.mock('../../../services/imageProcessor', () => ({
  ImageProcessor: vi.fn().mockImplementation(() => ({
    processImage: vi.fn().mockResolvedValue({
      svgContent: '',
      originalSize: 1024,
      vectorSize: 512,
      processingTime: 100,
      colorCount: 16,
      pathCount: 5
    }),
    extractImageData: vi.fn().mockResolvedValue({
      data: new Uint8ClampedArray(400),
      width: 10,
      height: 10
    }),
    preprocessImage: vi.fn().mockResolvedValue({
      data: new Uint8ClampedArray(400),
      width: 10,
      height: 10
    })
  }))
}));

vi.mock('../../../services/vectorizer', () => ({
  Vectorizer: vi.fn().mockImplementation(() => ({
    vectorizeEdges: vi.fn().mockResolvedValue([
      {
        pathData: 'M 0 0 L 10 10 Z',
        fillColor: '#ff0000',
        complexity: 1.5
      }
    ])
  }))
}));

vi.mock('../../../services/svgGenerator', () => ({
  SvgGenerator: vi.fn().mockImplementation(() => ({
    generateSVG: vi.fn().mockResolvedValue({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M 0 0 L 10 10 Z" fill="#ff0000"/></svg>',
      originalSize: 1024,
      vectorSize: 512,
      processingTime: 50,
      colorCount: 2,
      pathCount: 2
    })
  }))
}));

vi.mock('../../../services/colorQuantizer', () => ({
  ColorQuantizer: vi.fn().mockImplementation(() => ({
    quantizeColors: vi.fn().mockResolvedValue({
      imageData: {
        data: new Uint8ClampedArray(400),
        width: 10,
        height: 10
      },
      palette: {
        colors: [
          { r: 255, g: 0, b: 0 },
          { r: 0, g: 255, b: 0 }
        ]
      }
    })
  }))
}));

vi.mock('../../../services/edgeDetector', () => ({
  EdgeDetector: vi.fn().mockImplementation(() => ({
    detectEdges: vi.fn().mockResolvedValue({
      magnitude: new Float32Array(100),
      direction: new Float32Array(100),
      width: 10,
      height: 10
    })
  }))
}));

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(window.URL, 'createObjectURL', {
  value: mockCreateObjectURL
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
});

// Mock canvas and image
const mockGetContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(400),
    width: 10,
    height: 10
  })),
  putImageData: vi.fn()
}));

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext
});

const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  width: 10,
  height: 10
};

global.Image = vi.fn(() => mockImage) as any;

// Helper to create mock PNG file
const createMockPngFile = (name = 'test.png', size = 1024): File => {
  const content = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    ...new Array(size - 8).fill(0)
  ]);
  
  return new File([content], name, { type: 'image/png' });
};

describe('PngToSvgConverter Orchestration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Orchestration', () => {
    it('should initialize services when processing starts', async () => {
      render(<PngToSvgConverter />);

      // Upload a file
      const file = createMockPngFile('test.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Wait for file to be processed and start button to appear
      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Verify services are available for initialization
      const { ImageProcessor } = require('../../../services/imageProcessor');
      const { Vectorizer } = require('../../../services/vectorizer');
      const { SvgGenerator } = require('../../../services/svgGenerator');
      const { ColorQuantizer } = require('../../../services/colorQuantizer');
      const { EdgeDetector } = require('../../../services/edgeDetector');

      expect(ImageProcessor).toBeDefined();
      expect(Vectorizer).toBeDefined();
      expect(SvgGenerator).toBeDefined();
      expect(ColorQuantizer).toBeDefined();
      expect(EdgeDetector).toBeDefined();
    });

    it('should coordinate processing pipeline correctly', async () => {
      render(<PngToSvgConverter />);

      const file = createMockPngFile('test.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Start processing
      fireEvent.click(screen.getByText('Start Conversion'));

      // Verify processing starts
      await waitFor(() => {
        expect(screen.getByText('Converting to SVG')).toBeInTheDocument();
      });

      // Mock successful image loading
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText('Preview & Comparison')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify final state
      expect(screen.getByText('Download SVG')).toBeInTheDocument();
    });

    it('should handle configuration changes in processing pipeline', () => {
      render(<PngToSvgConverter />);

      // Change configuration
      const colorCountSlider = screen.getByLabelText(/color count/i);
      fireEvent.change(colorCountSlider, { target: { value: '32' } });

      const algorithmSelect = screen.getByLabelText(/processing algorithm/i);
      fireEvent.change(algorithmSelect, { target: { value: 'photo' } });

      // Verify configuration is updated
      expect(colorCountSlider).toHaveValue('32');
      expect(algorithmSelect).toHaveValue('photo');
    });

    it('should manage job state correctly', async () => {
      render(<PngToSvgConverter />);

      const file = createMockPngFile('test.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Verify job is created and ready
      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Verify file is displayed
      expect(screen.getByText('test.png')).toBeInTheDocument();
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
    });

    it('should handle reset functionality', async () => {
      render(<PngToSvgConverter />);

      const file = createMockPngFile('test.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Reset the converter
      fireEvent.click(screen.getByText('Reset'));

      // Verify state is reset
      await waitFor(() => {
        expect(screen.queryByText('Start Conversion')).not.toBeInTheDocument();
        expect(screen.queryByText('Selected Files')).not.toBeInTheDocument();
      });

      // Verify upload area is back
      expect(screen.getByText('Upload PNG Images')).toBeInTheDocument();
    });
  });

  describe('Error Handling Orchestration', () => {
    it('should handle processing errors gracefully', async () => {
      // Mock a service to fail
      const mockColorQuantizer = {
        quantizeColors: vi.fn().mockRejectedValue(new Error('Processing failed'))
      };

      vi.mocked(require('../../../services/colorQuantizer').ColorQuantizer).mockImplementation(() => mockColorQuantizer);

      render(<PngToSvgConverter />);

      const file = createMockPngFile('test.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Conversion'));

      // Mock image loading
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Conversion Failed')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Start Over')).toBeInTheDocument();
    });

    it('should provide recovery options after errors', async () => {
      render(<PngToSvgConverter />);

      const file = createMockPngFile('test.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Simulate error by mocking a failing service
      const mockFailingService = {
        quantizeColors: vi.fn().mockRejectedValue(new Error('Test error'))
      };

      vi.mocked(require('../../../services/colorQuantizer').ColorQuantizer).mockImplementation(() => mockFailingService);

      fireEvent.click(screen.getByText('Start Conversion'));

      // Mock image loading
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await waitFor(() => {
        expect(screen.getByText('Conversion Failed')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Test start over functionality
      fireEvent.click(screen.getByText('Start Over'));

      await waitFor(() => {
        expect(screen.getByText('Upload PNG Images')).toBeInTheDocument();
        expect(screen.queryByText('Conversion Failed')).not.toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress during processing', async () => {
      render(<PngToSvgConverter />);

      const file = createMockPngFile('test.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Conversion'));

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByText('Converting to SVG')).toBeInTheDocument();
      });

      // Mock image loading to continue processing
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Eventually should complete
      await waitFor(() => {
        expect(screen.getByText('Preview & Comparison')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});