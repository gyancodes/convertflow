import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateZipFile, downloadZipFile, validateZipGeneration } from '../zipUtils';
import { ConversionJob } from '../../types/converter';

// Mock JSZip
const mockZipFile = vi.fn();
const mockGenerateAsync = vi.fn();

vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    file: mockZipFile,
    generateAsync: mockGenerateAsync
  }))
}));

// Mock URL and DOM methods
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock DOM methods
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue({
    click: mockClick,
    href: '',
    download: ''
  })
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild
});

describe('zipUtils', () => {
  let mockJobs: ConversionJob[];

  beforeEach(() => {
    mockJobs = [
      {
        id: 'job1',
        file: new File(['data1'], 'test1.png', { type: 'image/png' }),
        config: {
          colorCount: 16,
          smoothingLevel: 'medium',
          pathSimplification: 1.0,
          preserveTransparency: true,
          algorithm: 'auto'
        },
        status: 'completed',
        progress: 100,
        result: {
          svgContent: '<svg>test1</svg>',
          originalSize: 1000,
          vectorSize: 500,
          processingTime: 100,
          colorCount: 16,
          pathCount: 4
        }
      },
      {
        id: 'job2',
        file: new File(['data2'], 'test2.png', { type: 'image/png' }),
        config: {
          colorCount: 16,
          smoothingLevel: 'medium',
          pathSimplification: 1.0,
          preserveTransparency: true,
          algorithm: 'auto'
        },
        status: 'completed',
        progress: 100,
        result: {
          svgContent: '<svg>test2</svg>',
          originalSize: 2000,
          vectorSize: 800,
          processingTime: 150,
          colorCount: 12,
          pathCount: 6
        }
      }
    ];

    // Reset mocks
    vi.clearAllMocks();
    mockGenerateAsync.mockResolvedValue(new Blob(['mock zip'], { type: 'application/zip' }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateZipFile', () => {
    it('should create a ZIP file with SVG files', async () => {
      const zipBlob = await generateZipFile(mockJobs);

      expect(mockZipFile).toHaveBeenCalledWith('test1.svg', '<svg>test1</svg>');
      expect(mockZipFile).toHaveBeenCalledWith('test2.svg', '<svg>test2</svg>');
      expect(mockZipFile).toHaveBeenCalledWith('conversion_summary.txt', expect.any(String));
      expect(mockGenerateAsync).toHaveBeenCalledWith({ type: 'blob' });
      expect(zipBlob).toBeInstanceOf(Blob);
    });

    it('should handle files without .png extension', async () => {
      const jobWithoutExtension = {
        ...mockJobs[0],
        file: new File(['data'], 'noextension', { type: 'image/png' })
      };

      await generateZipFile([jobWithoutExtension]);

      expect(mockZipFile).toHaveBeenCalledWith('converted_1.svg', '<svg>test1</svg>');
    });

    it('should generate a comprehensive summary file', async () => {
      await generateZipFile(mockJobs);

      const summaryCall = mockZipFile.mock.calls.find(call => call[0] === 'conversion_summary.txt');
      expect(summaryCall).toBeDefined();
      
      const summaryContent = summaryCall![1] as string;
      expect(summaryContent).toContain('PNG to SVG Batch Conversion Summary');
      expect(summaryContent).toContain('Total Files Processed: 2');
      expect(summaryContent).toContain('test1.png -> test1.svg');
      expect(summaryContent).toContain('test2.png -> test2.svg');
      expect(summaryContent).toContain('Configuration Used:');
    });

    it('should calculate correct statistics in summary', async () => {
      await generateZipFile(mockJobs);

      const summaryCall = mockZipFile.mock.calls.find(call => call[0] === 'conversion_summary.txt');
      const summaryContent = summaryCall![1] as string;

      // Check size calculations
      expect(summaryContent).toContain('Total Original Size: 2.93 KB'); // 1000 + 2000 bytes
      expect(summaryContent).toContain('Total Vector Size: 1.27 KB'); // 500 + 800 bytes
      
      // Check processing time
      expect(summaryContent).toContain('Total Processing Time: 250ms'); // 100 + 150 ms
      expect(summaryContent).toContain('Average Processing Time: 125ms'); // 250 / 2 ms
    });

    it('should handle empty job list', async () => {
      const zipBlob = await generateZipFile([]);

      expect(mockZipFile).toHaveBeenCalledWith('conversion_summary.txt', expect.any(String));
      expect(mockGenerateAsync).toHaveBeenCalled();
      expect(zipBlob).toBeInstanceOf(Blob);
    });

    it('should handle jobs without results', async () => {
      const jobWithoutResult = {
        ...mockJobs[0],
        result: undefined
      };

      // This should filter out jobs without results
      await generateZipFile([jobWithoutResult]);

      // Should only add summary file, not the SVG file
      expect(mockZipFile).toHaveBeenCalledTimes(1);
      expect(mockZipFile).toHaveBeenCalledWith('conversion_summary.txt', expect.any(String));
    });
  });

  describe('downloadZipFile', () => {
    it('should trigger download of ZIP file', () => {
      const mockBlob = new Blob(['test'], { type: 'application/zip' });
      const filename = 'test.zip';

      downloadZipFile(mockBlob, filename);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('should use default filename if not provided', () => {
      const mockBlob = new Blob(['test'], { type: 'application/zip' });

      downloadZipFile(mockBlob);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('validateZipGeneration', () => {
    it('should validate successful jobs', () => {
      const result = validateZipGeneration(mockJobs);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty job list', () => {
      const result = validateZipGeneration([]);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No completed jobs to include in ZIP');
    });

    it('should reject jobs without SVG content', () => {
      const invalidJobs = [
        {
          ...mockJobs[0],
          result: {
            ...mockJobs[0].result!,
            svgContent: ''
          }
        },
        mockJobs[1]
      ];

      const result = validateZipGeneration(invalidJobs);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('1 jobs missing SVG content');
    });

    it('should reject jobs without results', () => {
      const invalidJobs = [
        {
          ...mockJobs[0],
          result: undefined
        },
        mockJobs[1]
      ];

      const result = validateZipGeneration(invalidJobs);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('1 jobs missing SVG content');
    });

    it('should count multiple invalid jobs', () => {
      const invalidJobs = [
        {
          ...mockJobs[0],
          result: undefined
        },
        {
          ...mockJobs[1],
          result: {
            ...mockJobs[1].result!,
            svgContent: ''
          }
        }
      ];

      const result = validateZipGeneration(invalidJobs);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('2 jobs missing SVG content');
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly in summary', async () => {
      const largeJobs = [
        {
          ...mockJobs[0],
          result: {
            ...mockJobs[0].result!,
            originalSize: 1024 * 1024, // 1MB
            vectorSize: 512 * 1024 // 512KB
          }
        }
      ];

      await generateZipFile(largeJobs);

      const summaryCall = mockZipFile.mock.calls.find(call => call[0] === 'conversion_summary.txt');
      const summaryContent = summaryCall![1] as string;

      expect(summaryContent).toContain('1 MB');
      expect(summaryContent).toContain('512 KB');
    });
  });

  describe('Time Formatting', () => {
    it('should format processing times correctly', async () => {
      const jobsWithVariousTimes = [
        {
          ...mockJobs[0],
          result: {
            ...mockJobs[0].result!,
            processingTime: 500 // 500ms
          }
        },
        {
          ...mockJobs[1],
          result: {
            ...mockJobs[1].result!,
            processingTime: 2500 // 2.5s
          }
        }
      ];

      await generateZipFile(jobsWithVariousTimes);

      const summaryCall = mockZipFile.mock.calls.find(call => call[0] === 'conversion_summary.txt');
      const summaryContent = summaryCall![1] as string;

      expect(summaryContent).toContain('500ms');
      expect(summaryContent).toContain('2.5s');
      expect(summaryContent).toContain('3.0s'); // Total time
      expect(summaryContent).toContain('1.5s'); // Average time
    });

    it('should format minutes correctly for long processing times', async () => {
      const longProcessingJob = {
        ...mockJobs[0],
        result: {
          ...mockJobs[0].result!,
          processingTime: 90000 // 1.5 minutes
        }
      };

      await generateZipFile([longProcessingJob]);

      const summaryCall = mockZipFile.mock.calls.find(call => call[0] === 'conversion_summary.txt');
      const summaryContent = summaryCall![1] as string;

      expect(summaryContent).toContain('1m 30.0s');
    });
  });
});