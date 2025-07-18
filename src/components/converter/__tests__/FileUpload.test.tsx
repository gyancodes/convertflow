import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload';

// Helper function to create mock files
function createMockFile(
  name: string, 
  size: number, 
  type: string = 'image/png'
): File {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// Helper to create a valid PNG file with proper header
function createValidPngFile(name: string = 'test.png', size: number = 1000): File {
  const file = createMockFile(name, size, 'image/png');
  
  // Mock the slice method to return valid PNG header
  file.slice = () => {
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR type
      0x00, 0x00, 0x00, 0x01, // width
      0x00, 0x00, 0x00, 0x01, // height
      0x08, 0x02, 0x00, 0x00, 0x00 // bit depth, color type, compression, filter, interlace
    ]);
    return new Blob([pngHeader]);
  };
  
  return file;
}

// Helper to create invalid PNG file
function createInvalidPngFile(name: string = 'invalid.png', size: number = 1000, headerData?: Uint8Array): File {
  const file = createMockFile(name, size, 'image/png');
  
  file.slice = () => {
    return new Blob([headerData || new Uint8Array([0x00, 0x00, 0x00, 0x00])]);
  };
  
  return file;
}

describe('FileUpload', () => {
  const mockOnFilesSelected = vi.fn();

  beforeEach(() => {
    mockOnFilesSelected.mockClear();
  });

  it('should render upload interface correctly', () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    expect(screen.getByText('Upload PNG Images')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your PNG files here, or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supports up to 20 files • Max 10MB per file • PNG format only')).toBeInTheDocument();
  });

  it('should show processing state when isProcessing is true', () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} isProcessing={true} />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should handle file input selection', async () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const validFile = createValidPngFile('test.png', 1000);
    
    // Mock the file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith([validFile]);
    });
  });

  it('should display selected files', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const validFile = createValidPngFile('test-image.png', 2048);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
      expect(screen.getByText('2 KB')).toBeInTheDocument();
    });
  });

  it('should handle file removal', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const validFile = createValidPngFile('test.png', 1000);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument();
    });
    
    const removeButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(removeButton);
    
    expect(mockOnFilesSelected).toHaveBeenCalledWith([]);
    expect(screen.queryByText('test.png')).not.toBeInTheDocument();
  });

  it('should clear all files', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const validFiles = [
      createValidPngFile('test1.png', 1000),
      createValidPngFile('test2.png', 2000)
    ];
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: validFiles,
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
    });
    
    // Clear the mock calls from the initial file selection
    mockOnFilesSelected.mockClear();
    
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    
    expect(mockOnFilesSelected).toHaveBeenCalledWith([]);
    expect(screen.queryByText('Selected Files')).not.toBeInTheDocument();
  });

  it('should show validation errors for invalid files', async () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const invalidFile = createMockFile('test.jpg', 1000, 'image/jpeg');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('File must be a PNG image')).toBeInTheDocument();
    });
    
    expect(mockOnFilesSelected).not.toHaveBeenCalled();
  });

  it('should show error for files that are too large', async () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const largeFile = createMockFile('large.png', 15 * 1024 * 1024, 'image/png'); // 15MB
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('large.png')).toBeInTheDocument();
      expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument();
    });
  });

  it('should show error when too many files are selected', async () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} maxFiles={2} />);
    
    const files = [
      createValidPngFile('test1.png', 1000),
      createValidPngFile('test2.png', 1000),
      createValidPngFile('test3.png', 1000)
    ];
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: files,
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(screen.getByText('Multiple files')).toBeInTheDocument();
      expect(screen.getByText('Maximum 2 files allowed. Please select fewer files.')).toBeInTheDocument();
    });
  });

  it('should handle drag and drop', async () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const dropZone = screen.getByText('Upload PNG Images').closest('div');
    const validFile = createValidPngFile('dropped.png', 1000);
    
    const dragEvent = new Event('dragover', { bubbles: true });
    const dropEvent = new Event('drop', { bubbles: true });
    
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [validFile]
      }
    });
    
    fireEvent(dropZone!, dragEvent);
    expect(screen.getByText('Drop your PNG files here')).toBeInTheDocument();
    
    fireEvent(dropZone!, dropEvent);
    
    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith([validFile]);
    });
  });

  it('should respect custom maxFiles and maxFileSize props', () => {
    render(
      <FileUpload 
        onFilesSelected={mockOnFilesSelected} 
        maxFiles={5} 
        maxFileSize={5 * 1024 * 1024} 
      />
    );
    
    expect(screen.getByText('Supports up to 5 files • Max 5MB per file • PNG format only')).toBeInTheDocument();
  });

  it('should disable interactions when processing', () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} isProcessing={true} />);
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});