import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validatePngFile, 
  validatePngFileDetailed, 
  validateBatchFiles,
  generateUniqueFilename,
  createDownloadLink
} from '../fileUtils';

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  result: ArrayBuffer | null = null;

  readAsArrayBuffer(blob: Blob) {
    // Simulate async operation
    setTimeout(() => {
      if (this.onload) {
        // Mock PNG signature for valid files
        const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        this.result = pngSignature.buffer;
        this.onload({ target: this });
      }
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

// Mock URL and DOM methods
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

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

describe('fileUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePngFile', () => {
    it('should validate PNG files with correct MIME type and extension', () => {
      const validFile = new File(['data'], 'test.png', { type: 'image/png' });
      
      expect(validatePngFile(validFile)).toBe(true);
    });

    it('should reject files with incorrect MIME type', () => {
      const invalidFile = new File(['data'], 'test.png', { type: 'image/jpeg' });
      
      expect(validatePngFile(invalidFile)).toBe(false);
    });

    it('should reject files with incorrect extension', () => {
      const invalidFile = new File(['data'], 'test.jpg', { type: 'image/png' });
      
      expect(validatePngFile(invalidFile)).toBe(false);
    });

    it('should handle case-insensitive extensions', () => {
      const validFile = new File(['data'], 'test.PNG', { type: 'image/png' });
      
      expect(validatePngFile(validFile)).toBe(true);
    });
  });

  describe('validatePngFileDetailed', () => {
    it('should validate a proper PNG file', async () => {
      const validFile = new File(['data'], 'test.png', { type: 'image/png' });
      
      const result = await validatePngFileDetailed(validFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files with invalid format', async () => {
      const invalidFile = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await validatePngFileDetailed(invalidFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File is not a valid PNG format');
    });

    it('should reject files exceeding size limit', async () => {
      const largeFile = new File(['data'], 'large.png', { type: 'image/png' });
      // Mock file size to be larger than 10MB
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
      
      const result = await validatePngFileDetailed(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size');
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should validate PNG file header signature', async () => {
      const validFile = new File(['data'], 'test.png', { type: 'image/png' });
      
      const result = await validatePngFileDetailed(validFile);
      
      expect(result.valid).toBe(true);
    });

    it('should reject files with invalid PNG header', async () => {
      // Mock FileReader to return invalid PNG signature
      const originalFileReader = global.FileReader;
      
      class InvalidPngFileReader extends MockFileReader {
        readAsArrayBuffer(blob: Blob) {
          setTimeout(() => {
            if (this.onload) {
              // Invalid PNG signature
              const invalidSignature = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
              this.result = invalidSignature.buffer;
              this.onload({ target: this });
            }
          }, 0);
        }
      }
      
      global.FileReader = InvalidPngFileReader as any;
      
      const invalidFile = new File(['data'], 'test.png', { type: 'image/png' });
      
      const result = await validatePngFileDetailed(invalidFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File header does not match PNG format');
      
      // Restore original FileReader
      global.FileReader = originalFileReader;
    });

    it('should handle file reading errors', async () => {
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      
      class ErrorFileReader extends MockFileReader {
        readAsArrayBuffer(blob: Blob) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({ target: this });
            }
          }, 0);
        }
      }
      
      global.FileReader = ErrorFileReader as any;
      
      const file = new File(['data'], 'test.png', { type: 'image/png' });
      
      const result = await validatePngFileDetailed(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unable to read file header');
      
      // Restore original FileReader
      global.FileReader = originalFileReader;
    });
  });

  describe('validateBatchFiles', () => {
    it('should separate valid and invalid files', async () => {
      const validFile1 = new File(['data1'], 'test1.png', { type: 'image/png' });
      const validFile2 = new File(['data2'], 'test2.png', { type: 'image/png' });
      const invalidFile = new File(['data3'], 'test3.jpg', { type: 'image/jpeg' });
      
      const files = [validFile1, invalidFile, validFile2];
      
      const result = await validateBatchFiles(files);
      
      expect(result.validFiles).toHaveLength(2);
      expect(result.validFiles).toContain(validFile1);
      expect(result.validFiles).toContain(validFile2);
      
      expect(result.invalidFiles).toHaveLength(1);
      expect(result.invalidFiles[0].file).toBe(invalidFile);
      expect(result.invalidFiles[0].error).toBe('File is not a valid PNG format');
    });

    it('should handle all valid files', async () => {
      const validFile1 = new File(['data1'], 'test1.png', { type: 'image/png' });
      const validFile2 = new File(['data2'], 'test2.png', { type: 'image/png' });
      
      const files = [validFile1, validFile2];
      
      const result = await validateBatchFiles(files);
      
      expect(result.validFiles).toHaveLength(2);
      expect(result.invalidFiles).toHaveLength(0);
    });

    it('should handle all invalid files', async () => {
      const invalidFile1 = new File(['data1'], 'test1.jpg', { type: 'image/jpeg' });
      const invalidFile2 = new File(['data2'], 'test2.gif', { type: 'image/gif' });
      
      const files = [invalidFile1, invalidFile2];
      
      const result = await validateBatchFiles(files);
      
      expect(result.validFiles).toHaveLength(0);
      expect(result.invalidFiles).toHaveLength(2);
    });

    it('should handle empty file list', async () => {
      const result = await validateBatchFiles([]);
      
      expect(result.validFiles).toHaveLength(0);
      expect(result.invalidFiles).toHaveLength(0);
    });
  });

  describe('generateUniqueFilename', () => {
    it('should return original name if no conflicts', () => {
      const result = generateUniqueFilename('test.png', []);
      
      expect(result).toBe('test.png');
    });

    it('should append counter for conflicts', () => {
      const existingNames = ['test.png', 'test_1.png'];
      const result = generateUniqueFilename('test.png', existingNames);
      
      expect(result).toBe('test_2.png');
    });

    it('should handle files without extensions', () => {
      const existingNames = ['test', 'test_1'];
      const result = generateUniqueFilename('test', existingNames);
      
      expect(result).toBe('test_2');
    });

    it('should handle multiple conflicts', () => {
      const existingNames = ['file.svg', 'file_1.svg', 'file_2.svg', 'file_3.svg'];
      const result = generateUniqueFilename('file.svg', existingNames);
      
      expect(result).toBe('file_4.svg');
    });

    it('should preserve complex file extensions', () => {
      const existingNames = ['archive.tar.gz'];
      const result = generateUniqueFilename('archive.tar.gz', existingNames);
      
      expect(result).toBe('archive.tar_1.gz');
    });
  });

  describe('createDownloadLink', () => {
    it('should create and trigger download', () => {
      const content = 'test content';
      const filename = 'test.txt';
      
      createDownloadLink(content, filename);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('should use custom MIME type', () => {
      const content = '<svg>test</svg>';
      const filename = 'test.svg';
      const mimeType = 'image/svg+xml';
      
      createDownloadLink(content, filename, mimeType);
      
      expect(mockClick).toHaveBeenCalled();
    });

    it('should use default MIME type if not specified', () => {
      const content = 'plain text';
      const filename = 'test.txt';
      
      createDownloadLink(content, filename);
      
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes correctly in error messages', async () => {
      const largeFile = new File(['data'], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      
      const result = await validatePngFileDetailed(largeFile);
      
      expect(result.error).toContain('15 MB');
      expect(result.error).toContain('10 MB');
    });
  });
});