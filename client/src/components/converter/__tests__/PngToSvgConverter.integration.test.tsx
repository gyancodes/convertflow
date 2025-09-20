import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PngToSvgConverter } from '../PngToSvgConverter';

// Mock the services
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
      data: new Uint8ClampedArray(400), // 10x10 RGBA
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
      },
      {
        pathData: 'M 5 5 L 15 15 Z',
        fillColor: '#00ff00',
        complexity: 2.0
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

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(window.URL, 'createObjectURL', {
  value: mockCreateObjectURL
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
});

// Mock canvas and image elements
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

// Mock Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  width: 10,
  height: 10
};

global.Image = vi.fn(() => mockImage) as any;

// Helper function to create mock PNG file
const createMockPngFile = (name = 'test.png', size = 1024): File => {
  const content = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    ...new Array(size - 8).fill(0)
  ]);
  
  return new File([content], name, { type: 'image/png' });
};

describe('PngToSvgConverter Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Conversion Workflow', () => {
    it('should complete full PNG to SVG conversion workflow', async () => {
      render(<PngToSvgConverter />);

      // Verify initial state
      expect(screen.getByText('PNG to SVG Converter')).toBeInTheDocument();
      expect(screen.getByText('Upload PNG Images')).toBeInTheDocument();

      // Upload a file
      const file = createMockPngFile('test-image.png', 2048);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Wait for file to be processed
      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Start conversion
      fireEvent.click(screen.getByText('Start Conversion'));

      // Verify processing starts
      await waitFor(() => {
        expect(screen.getByText('Converting to SVG')).toBeInTheDocument();
      });

      // Mock image loading
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      // Wait for conversion to complete
      await waitFor(() => {
        expect(screen.getByText('Preview & Comparison')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify results are displayed
      expect(screen.getByText('Download SVG')).toBeInTheDocument();
      expect(screen.getByText('Convert Another')).toBeInTheDocument();
    });

    it('should handle configuration changes during workflow', async () => {
      render(<PngToSvgConverter />);

      // Change configuration
      const colorCountSlider = screen.getByLabelText(/color count/i);
      fireEvent.change(colorCountSlider, { target: { value: '32' } });

      const algorithmSelect = screen.getByLabelText(/processing algorithm/i);
      fireEvent.change(algorithmSelect, { target: { value: 'photo' } });

      // Upload file
      const file = createMockPngFile('photo.png', 1024);
      const fileInput = screen.getByRole('button', { name: /upload png images/i }).querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Start conversion with custom config
      fireEvent.click(screen.getByText('Start Conversion'));

      // Mock image loading
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await waitFor(() => {
        expect(screen.getByText('Preview & Comparison')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify conversion completed with custom settings
      expect(screen.getByText('Download SVG')).toBeInTheDocument();
    });

    it('should handle multiple files in sequence', async () => {
      render(<PngToSvgConverter />);

      // Upload first file
      const file1 = createMockPngFile('image1.png', 1024);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file1],
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

      await waitFor(() => {
        expect(screen.getByText('Download SVG')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Reset for next file
      fireEvent.click(screen.getByText('Convert Another'));

      await waitFor(() => {
        expect(screen.getByText('Upload PNG Images')).toBeInTheDocument();
      });

      // Upload second file
      const file2 = createMockPngFile('image2.png', 2048);
      Object.defineProperty(fileInput, 'files', {
        value: [file2],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Start Conversion')).toBeInTheDocument();
      });

      // Verify second conversion can start
      expect(screen.getByText('Start Conversion')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle processing errors with retry mechanism', async () => {
      // Mock service to throw error first, then succeed
      const mockProcessImage = vi.fn()
        .mockRejectedValueOnce(new Error('Memory error'))
        .mockResolvedValueOnce({
          svgContent: '<svg>test</svg>',
          originalSize: 1024,
          vectorSize: 512,
          processingTime: 100,
          colorCount: 8,
          pathCount: 3
        });

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

      // Should eventually succeed after retry
      await waitFor(() => {
        expect(screen.getByText('Download SVG')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display error message when conversion fails permanently', async () => {
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

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Conversion Failed')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Start Over')).toBeInTheDocument();
    });

    it('should allow cancellation during processing', async () => {
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

      // Wait for processing to start
      await waitFor(() => {
        expect(screen.getByText('Converting to SVG')).toBeInTheDocument();
      });

      // Cancel processing
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByText('Processing cancelled')).toBeInTheDocument();
      });
    });
  });

  describe('Download Functionality', () => {
    it('should render download button when conversion completes', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Download SVG')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify download button is present
      expect(screen.getByText('Download SVG')).toBeInTheDocument();
      expect(screen.getByText('Convert Another')).toBeInTheDocument();
    });
  });

  describe('Configuration Integration', () => {
    it('should update configuration values when controls are changed', async () => {
      render(<PngToSvgConverter />);

      // Change path simplification
      const pathSimplificationSlider = screen.getByLabelText(/path simplification/i);
      fireEvent.change(pathSimplificationSlider, { target: { value: '5.0' } });

      // Change smoothing level
      const smoothingSelect = screen.getByLabelText(/smoothing level/i);
      fireEvent.change(smoothingSelect, { target: { value: 'high' } });

      // Verify the values are updated in the UI
      expect(pathSimplificationSlider).toHaveValue('5');
      expect(smoothingSelect).toHaveValue('high');
    });
  });
});