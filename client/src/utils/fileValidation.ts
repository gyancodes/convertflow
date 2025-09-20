/**
 * File validation utilities for PNG to SVG converter
 */

export interface FileValidationOptions {
  maxFileSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface BatchValidationResult {
  validFiles: File[];
  invalidFiles: Array<{ file: File; error: string }>;
  totalErrors: string[];
}

const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 20,
  allowedTypes: ['image/png']
};

/**
 * Validates a single PNG file
 */
export function validatePngFile(
  file: File, 
  options: FileValidationOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file type by MIME type
  if (!opts.allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File must be a PNG image' };
  }

  // Additional check for file extension (some browsers might not set MIME type correctly)
  if (!file.name.toLowerCase().endsWith('.png')) {
    return { isValid: false, error: 'File must have a .png extension' };
  }

  // Check file size
  if (file.size > opts.maxFileSize) {
    const sizeMB = Math.round(opts.maxFileSize / (1024 * 1024));
    return { isValid: false, error: `File size must be less than ${sizeMB}MB` };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { isValid: false, error: 'File appears to be empty' };
  }

  // Check for reasonable minimum size (PNG header is at least 8 bytes)
  if (file.size < 8) {
    return { isValid: false, error: 'File is too small to be a valid PNG' };
  }

  return { isValid: true };
}

/**
 * Validates multiple PNG files for batch processing
 */
export function validatePngFiles(
  files: File[], 
  options: FileValidationOptions = {}
): BatchValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; error: string }> = [];
  const totalErrors: string[] = [];

  // Check total file count
  if (files.length > opts.maxFiles) {
    totalErrors.push(`Maximum ${opts.maxFiles} files allowed. Please select fewer files.`);
    return { validFiles: [], invalidFiles: [], totalErrors };
  }

  // Check for duplicate files (by name and size)
  const fileMap = new Map<string, File>();
  const duplicates: string[] = [];

  files.forEach(file => {
    const key = `${file.name}-${file.size}`;
    if (fileMap.has(key)) {
      duplicates.push(file.name);
    } else {
      fileMap.set(key, file);
    }
  });

  if (duplicates.length > 0) {
    totalErrors.push(`Duplicate files detected: ${duplicates.join(', ')}`);
  }

  // Validate each unique file
  Array.from(fileMap.values()).forEach(file => {
    const result = validatePngFile(file, options);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, error: result.error! });
    }
  });

  return { validFiles, invalidFiles, totalErrors };
}

/**
 * Performs basic PNG file integrity check by examining file header
 */
export async function checkPngIntegrity(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          resolve({ isValid: false, error: 'Could not read file data' });
          return;
        }

        const bytes = new Uint8Array(arrayBuffer);
        
        // Check PNG signature (first 8 bytes)
        const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        
        if (bytes.length < 8) {
          resolve({ isValid: false, error: 'File is too small to be a valid PNG' });
          return;
        }

        for (let i = 0; i < 8; i++) {
          if (bytes[i] !== pngSignature[i]) {
            resolve({ isValid: false, error: 'File does not have a valid PNG signature' });
            return;
          }
        }

        // Check for IHDR chunk (should be the first chunk after signature)
        if (bytes.length < 16) {
          resolve({ isValid: false, error: 'PNG file appears to be corrupted (missing IHDR)' });
          return;
        }

        // IHDR chunk type should be at bytes 12-15
        const ihdrType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
        if (ihdrType !== 'IHDR') {
          resolve({ isValid: false, error: 'PNG file structure is invalid (IHDR not found)' });
          return;
        }

        resolve({ isValid: true });
      } catch (error) {
        resolve({ isValid: false, error: 'Failed to analyze PNG file structure' });
      }
    };

    reader.onerror = () => {
      resolve({ isValid: false, error: 'Failed to read file for integrity check' });
    };

    // Only read the first 32 bytes for header check
    const blob = file.slice(0, 32);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Gets human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if the browser supports the required APIs
 */
export function checkBrowserSupport(): { supported: boolean; missingFeatures: string[] } {
  const missingFeatures: string[] = [];

  if (!window.File) {
    missingFeatures.push('File API');
  }

  if (!window.FileReader) {
    missingFeatures.push('FileReader API');
  }

  if (!window.FileList) {
    missingFeatures.push('FileList API');
  }

  if (!('draggable' in document.createElement('div'))) {
    missingFeatures.push('Drag and Drop API');
  }

  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
}