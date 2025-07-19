/**
 * Utility functions for file handling and validation
 */

/**
 * Validate if a file is a valid PNG file
 */
export const validatePngFile = (file: File): boolean => {
  // Check MIME type
  if (file.type !== 'image/png') {
    return false;
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.png')) {
    return false;
  }

  return true;
};

/**
 * Validate PNG file with additional checks
 */
export const validatePngFileDetailed = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  // Basic validation
  if (!validatePngFile(file)) {
    return { valid: false, error: 'File is not a valid PNG format' };
  }

  // Size validation (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})` 
    };
  }

  // Try to read the file header to verify it's actually a PNG
  try {
    const header = await readFileHeader(file, 8);
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    
    for (let i = 0; i < pngSignature.length; i++) {
      if (header[i] !== pngSignature[i]) {
        return { valid: false, error: 'File header does not match PNG format' };
      }
    }
  } catch (error) {
    return { valid: false, error: 'Unable to read file header' };
  }

  return { valid: true };
};

/**
 * Read the first n bytes of a file
 */
const readFileHeader = (file: File, bytes: number): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    const blob = file.slice(0, bytes);
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Format file size in human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Create and trigger download of content as a file
 */
export const createDownloadLink = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Validate multiple files for batch processing
 */
export const validateBatchFiles = async (files: File[]): Promise<{
  validFiles: File[];
  invalidFiles: Array<{ file: File; error: string }>;
}> => {
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    const validation = await validatePngFileDetailed(file);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, error: validation.error || 'Unknown validation error' });
    }
  }

  return { validFiles, invalidFiles };
};

/**
 * Generate a unique filename to avoid conflicts
 */
export const generateUniqueFilename = (originalName: string, existingNames: string[]): string => {
  let filename = originalName;
  let counter = 1;
  
  while (existingNames.includes(filename)) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = originalName.match(/\.[^/.]+$/)?.[0] || '';
    filename = `${nameWithoutExt}_${counter}${extension}`;
    counter++;
  }
  
  return filename;
};

export default {
  validatePngFile,
  validatePngFileDetailed,
  createDownloadLink,
  validateBatchFiles,
  generateUniqueFilename,
};