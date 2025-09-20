import { describe, it, expect, beforeEach } from 'vitest';
import { 
  validatePngFile, 
  validatePngFiles, 
  checkPngIntegrity, 
  formatFileSize,
  checkBrowserSupport 
} from '../fileValidation';

// Helper function to create mock files
function createMockFile(
  name: string, 
  size: number, 
  type: string = 'image/png',
  content?: Uint8Array
): File {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  
  if (content) {
    // Mock the slice method to return the content for integrity checks
    file.slice = () => new Blob([content]);
  }
  
  return file;
}

// Helper to create a valid PNG file with proper header
function createValidPngFile(name: string = 'test.png', size: number = 1000): File {
  const pngHeader = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR type
    0x00, 0x00, 0x00, 0x01, // width
    0x00, 0x00, 0x00, 0x01, // height
    0x08, 0x02, 0x00, 0x00, 0x00 // bit depth, color type, compression, filter, interlace
  ]);
  
  const file = new File([pngHeader], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('fileValidation', () => {
  describe('validatePngFile', () => {
    it('should validate a correct PNG file', () => {
      const file = createMockFile('test.png', 1000, 'image/png');
      const result = validatePngFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PNG MIME types', () => {
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const result = validatePngFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File must be a PNG image');
    });

    it('should reject files without .png extension', () => {
      const file = createMockFile('test.jpg', 1000, 'image/png');
      const result = validatePngFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File must have a .png extension');
    });

    it('should reject files that are too large', () => {
      const file = createMockFile('test.png', 15 * 1024 * 1024, 'image/png'); // 15MB
      const result = validatePngFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 10MB');
    });

    it('should reject empty files', () => {
      const file = createMockFile('test.png', 0, 'image/png');
      const result = validatePngFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File appears to be empty');
    });

    it('should reject files that are too small', () => {
      const file = createMockFile('test.png', 5, 'image/png');
      const result = validatePngFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is too small to be a valid PNG');
    });

    it('should handle custom options', () => {
      const file = createMockFile('test.png', 6 * 1024 * 1024, 'image/png'); // 6MB
      
      // Should pass with default 10MB limit
      const result1 = validatePngFile(file);
      expect(result1.isValid).toBe(true);
      
      // Should fail with 5MB limit
      const result2 = validatePngFile(file, { maxFileSize: 5 * 1024 * 1024 });
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('File size must be less than 5MB');
    });

    it('should handle null/undefined files', () => {
      const result = validatePngFile(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No file provided');
    });
  });

  describe('validatePngFiles', () => {
    it('should validate multiple correct PNG files', () => {
      const files = [
        createMockFile('test1.png', 1000, 'image/png'),
        createMockFile('test2.png', 2000, 'image/png'),
        createMockFile('test3.png', 3000, 'image/png')
      ];
      
      const result = validatePngFiles(files);
      
      expect(result.validFiles).toHaveLength(3);
      expect(result.invalidFiles).toHaveLength(0);
      expect(result.totalErrors).toHaveLength(0);
    });

    it('should reject when too many files are provided', () => {
      const files = Array.from({ length: 25 }, (_, i) => 
        createMockFile(`test${i}.png`, 1000, 'image/png')
      );
      
      const result = validatePngFiles(files);
      
      expect(result.validFiles).toHaveLength(0);
      expect(result.totalErrors).toContain('Maximum 20 files allowed. Please select fewer files.');
    });

    it('should handle mixed valid and invalid files', () => {
      const files = [
        createMockFile('valid.png', 1000, 'image/png'),
        createMockFile('invalid.jpg', 1000, 'image/jpeg'),
        createMockFile('toolarge.png', 15 * 1024 * 1024, 'image/png'),
        createMockFile('valid2.png', 2000, 'image/png')
      ];
      
      const result = validatePngFiles(files);
      
      expect(result.validFiles).toHaveLength(2);
      expect(result.invalidFiles).toHaveLength(2);
      expect(result.invalidFiles[0].file.name).toBe('invalid.jpg');
      expect(result.invalidFiles[1].file.name).toBe('toolarge.png');
    });

    it('should detect duplicate files', () => {
      const files = [
        createMockFile('test.png', 1000, 'image/png'),
        createMockFile('test.png', 1000, 'image/png'), // Same name and size
        createMockFile('other.png', 2000, 'image/png')
      ];
      
      const result = validatePngFiles(files);
      
      expect(result.totalErrors).toContain('Duplicate files detected: test.png');
      expect(result.validFiles).toHaveLength(2); // Only unique files
    });

    it('should respect custom options', () => {
      const files = [
        createMockFile('test1.png', 1000, 'image/png'),
        createMockFile('test2.png', 2000, 'image/png'),
        createMockFile('test3.png', 3000, 'image/png')
      ];
      
      const result = validatePngFiles(files, { maxFiles: 2 });
      
      expect(result.validFiles).toHaveLength(0);
      expect(result.totalErrors).toContain('Maximum 2 files allowed. Please select fewer files.');
    });
  });

  describe('checkPngIntegrity', () => {
    it('should validate a file with correct PNG signature', async () => {
      const file = createValidPngFile();
      const result = await checkPngIntegrity(file);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject a file with invalid PNG signature', async () => {
      const invalidHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const file = new File([invalidHeader], 'invalid.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1000 });
      
      const result = await checkPngIntegrity(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File does not have a valid PNG signature');
    });

    it('should reject a file that is too small', async () => {
      const tooSmall = new Uint8Array([0x89, 0x50]);
      const file = new File([tooSmall], 'small.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 2 });
      
      const result = await checkPngIntegrity(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is too small to be a valid PNG');
    });

    it('should reject a file without IHDR chunk', async () => {
      const noIhdr = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // chunk length
        0x58, 0x58, 0x58, 0x58  // Invalid chunk type (not IHDR)
      ]);
      const file = new File([noIhdr], 'noihdr.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1000 });
      
      const result = await checkPngIntegrity(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PNG file structure is invalid (IHDR not found)');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('checkBrowserSupport', () => {
    it('should detect browser support correctly', () => {
      const result = checkBrowserSupport();
      
      // In our test environment, these should be supported
      expect(result.supported).toBe(true);
      expect(result.missingFeatures).toHaveLength(0);
    });
  });
});