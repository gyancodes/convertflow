import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchProcessorUI } from '../BatchProcessorUI';
import { VectorizationConfig } from '../../../types/converter';

// Mock the BatchProcessor hook
const mockBatchProcessor = {
  jobs: [],
  currentJobIndex: -1,
  isProcessing: false,
  completedJobs: [],
  failedJobs: [],
  addFiles: vi.fn(),
  startBatchProcessing: vi.fn(),
  cancelBatchProcessing: vi.fn(),
  clearBatch: vi.fn(),
  removeJob: vi.fn()
};

vi.mock('../BatchProcessor', () => ({
  useBatchProcessor: vi.fn(() => mockBatchProcessor)
}));

// Mock utility functions
vi.mock('../../../utils/zipUtils', () => ({
  downloadZipFile: vi.fn()
}));

vi.mock('../../../utils/fileUtils', () => ({
  validateBatchFiles: vi.fn().mockResolvedValue({
    validFiles: [],
    invalidFiles: []
  })
}));

// Mock file input and drag/drop
const createMockFile = (name: string, type: string = 'image/png') => {
  return new File(['mock data'], name, { type });
};

describe('BatchProcessorUI', () => {
  let mockConfig: VectorizationConfig;
  let onBatchComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockConfig = {
      colorCount: 16,
      smoothingLevel: 'medium',
      pathSimplification: 1.0,
      preserveTransparency: true,
      algorithm: 'auto'
    };

    onBatchComplete = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset mock batch processor state
    mockBatchProcessor.jobs = [];
    mockBatchProcessor.currentJobIndex = -1;
    mockBatchProcessor.isProcessing = false;
    mockBatchProcessor.completedJobs = [];
    mockBatchProcessor.failedJobs = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the batch processor UI', () => {
      render(<BatchProcessorUI config={mockConfig} />);
      
      expect(screen.getByText('Batch PNG to SVG Converter')).toBeInTheDocument();
      expect(screen.getByText('Drop PNG files here or click to select')).toBeInTheDocument();
      expect(screen.getByText('Maximum 20 files, up to 10MB each')).toBeInTheDocument();
      expect(screen.getByText('Select Files')).toBeInTheDocument();
    });

    it('should show file list when files are added', () => {
      const mockFiles = [
        { id: '1', file: createMockFile('test1.png'), status: 'pending', progress: 0 },
        { id: '2', file: createMockFile('test2.png'), status: 'pending', progress: 0 }
      ];
      
      mockBatchProcessor.jobs = mockFiles as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      expect(screen.getByText('Files in Batch (2)')).toBeInTheDocument();
      expect(screen.getByText('test1.png')).toBeInTheDocument();
      expect(screen.getByText('test2.png')).toBeInTheDocument();
    });

    it('should show processing controls when files are present', () => {
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test.png'), status: 'pending', progress: 0 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      expect(screen.getByText('Start Processing')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should disable controls when processing', () => {
      mockBatchProcessor.isProcessing = true;
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test.png'), status: 'processing', progress: 50 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      expect(screen.getByText('Select Files')).toBeDisabled();
      expect(screen.getByText('Cancel Processing')).toBeInTheDocument();
      expect(screen.queryByText('Start Processing')).not.toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should handle file input selection', async () => {
      const user = userEvent.setup();
      const { validateBatchFiles } = await import('../../../utils/fileUtils');
      
      const mockFiles = [createMockFile('test1.png'), createMockFile('test2.png')];
      vi.mocked(validateBatchFiles).mockResolvedValue({
        validFiles: mockFiles,
        invalidFiles: []
      });
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const fileInput = screen.getByText('Select Files');
      await user.click(fileInput);
      
      // Simulate file selection
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', {
        value: mockFiles,
        writable: false
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(validateBatchFiles).toHaveBeenCalledWith(mockFiles);
        expect(mockBatchProcessor.addFiles).toHaveBeenCalledWith(mockFiles);
      });
    });

    it('should handle drag and drop', async () => {
      const { validateBatchFiles } = await import('../../../utils/fileUtils');
      
      const mockFiles = [createMockFile('test.png')];
      vi.mocked(validateBatchFiles).mockResolvedValue({
        validFiles: mockFiles,
        invalidFiles: []
      });
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const dropZone = screen.getByText('Drop PNG files here or click to select').closest('div');
      
      // Simulate drag enter
      fireEvent.dragEnter(dropZone!, {
        dataTransfer: { files: mockFiles }
      });
      
      // Simulate drop
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: mockFiles }
      });
      
      await waitFor(() => {
        expect(validateBatchFiles).toHaveBeenCalledWith(mockFiles);
        expect(mockBatchProcessor.addFiles).toHaveBeenCalledWith(mockFiles);
      });
    });

    it('should show validation errors for invalid files', async () => {
      const { validateBatchFiles } = await import('../../../utils/fileUtils');
      
      const validFile = createMockFile('valid.png');
      const invalidFile = createMockFile('invalid.jpg', 'image/jpeg');
      
      vi.mocked(validateBatchFiles).mockResolvedValue({
        validFiles: [validFile],
        invalidFiles: [{ file: invalidFile, error: 'Invalid file format' }]
      });
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const dropZone = screen.getByText('Drop PNG files here or click to select').closest('div');
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [validFile, invalidFile] }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Some files are invalid/)).toBeInTheDocument();
        expect(screen.getByText(/invalid.jpg: Invalid file format/)).toBeInTheDocument();
      });
    });
  });

  describe('Processing Controls', () => {
    it('should start processing when button is clicked', async () => {
      const user = userEvent.setup();
      
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test.png'), status: 'pending', progress: 0 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const startButton = screen.getByText('Start Processing');
      await user.click(startButton);
      
      expect(mockBatchProcessor.startBatchProcessing).toHaveBeenCalled();
    });

    it('should cancel processing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      mockBatchProcessor.isProcessing = true;
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test.png'), status: 'processing', progress: 50 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const cancelButton = screen.getByText('Cancel Processing');
      await user.click(cancelButton);
      
      expect(mockBatchProcessor.cancelBatchProcessing).toHaveBeenCalled();
    });

    it('should clear batch when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test.png'), status: 'pending', progress: 0 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);
      
      expect(mockBatchProcessor.clearBatch).toHaveBeenCalled();
    });

    it('should remove individual files', async () => {
      const user = userEvent.setup();
      
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test.png'), status: 'pending', progress: 0 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const removeButton = screen.getByText('Remove');
      await user.click(removeButton);
      
      expect(mockBatchProcessor.removeJob).toHaveBeenCalledWith('1');
    });
  });

  describe('Progress Display', () => {
    it('should show progress bars during processing', () => {
      mockBatchProcessor.isProcessing = true;
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test1.png'), status: 'processing', progress: 75 },
        { id: '2', file: createMockFile('test2.png'), status: 'pending', progress: 0 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      // The current file display only shows when progress.totalFiles > 0, which is set by handleProgressUpdate
    });

    it('should update progress based on current state', () => {
      mockBatchProcessor.isProcessing = true;
      mockBatchProcessor.currentJobIndex = 0;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      // Progress should be calculated and displayed
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should show status messages', async () => {
      const { validateBatchFiles } = await import('../../../utils/fileUtils');
      
      const mockFiles = [createMockFile('test.png')];
      vi.mocked(validateBatchFiles).mockResolvedValue({
        validFiles: mockFiles,
        invalidFiles: []
      });
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const dropZone = screen.getByText('Drop PNG files here or click to select').closest('div');
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: mockFiles }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Added 1 files to batch/)).toBeInTheDocument();
      });
    });

    it('should show error messages', async () => {
      const { validateBatchFiles } = await import('../../../utils/fileUtils');
      
      vi.mocked(validateBatchFiles).mockRejectedValue(new Error('Validation failed'));
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      const dropZone = screen.getByText('Drop PNG files here or click to select').closest('div');
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [createMockFile('test.png')] }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Error validating files: Validation failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Summary Display', () => {
    it('should show processing summary', () => {
      mockBatchProcessor.completedJobs = [
        { id: '1', file: createMockFile('test1.png'), status: 'completed' },
        { id: '2', file: createMockFile('test2.png'), status: 'completed' }
      ] as any;
      
      mockBatchProcessor.failedJobs = [
        { id: '3', file: createMockFile('test3.png'), status: 'failed' }
      ] as any;
      
      mockBatchProcessor.jobs = [
        ...mockBatchProcessor.completedJobs,
        ...mockBatchProcessor.failedJobs
      ];
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      expect(screen.getByText('Processing Summary')).toBeInTheDocument();
      expect(screen.getByText('✅ Completed: 2')).toBeInTheDocument();
      expect(screen.getByText('❌ Failed: 1')).toBeInTheDocument();
      expect(screen.getByText('📊 Total: 3')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Visual Feedback', () => {
    it('should show visual feedback during drag operations', () => {
      render(<BatchProcessorUI config={mockConfig} />);
      
      // Find the div that has the drag event handlers and conditional classes
      const dropZone = screen.getByText('Drop PNG files here or click to select').closest('[class*="border-2 border-dashed"]');
      
      // Simulate drag enter
      fireEvent.dragEnter(dropZone!, {
        dataTransfer: { files: [] }
      });
      
      // Check if the drag active class is applied
      expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50');
      
      // Simulate drag leave
      fireEvent.dragLeave(dropZone!);
      
      expect(dropZone).not.toHaveClass('border-blue-500', 'bg-blue-50');
    });
  });

  describe('File Status Display', () => {
    it('should show different status colors for files', () => {
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('pending.png'), status: 'pending', progress: 0 },
        { id: '2', file: createMockFile('processing.png'), status: 'processing', progress: 50 },
        { id: '3', file: createMockFile('completed.png'), status: 'completed', progress: 100 },
        { id: '4', file: createMockFile('failed.png'), status: 'failed', progress: 0 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      expect(screen.getByText('pending')).toHaveClass('bg-gray-100', 'text-gray-800');
      expect(screen.getByText('processing')).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(screen.getByText('completed')).toHaveClass('bg-green-100', 'text-green-800');
      expect(screen.getByText('failed')).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should highlight currently processing file', () => {
      mockBatchProcessor.currentJobIndex = 1;
      mockBatchProcessor.jobs = [
        { id: '1', file: createMockFile('test1.png'), status: 'completed', progress: 100 },
        { id: '2', file: createMockFile('test2.png'), status: 'processing', progress: 50 },
        { id: '3', file: createMockFile('test3.png'), status: 'pending', progress: 0 }
      ] as any;
      
      render(<BatchProcessorUI config={mockConfig} />);
      
      // Find the file row containers (the divs that contain the file info and have the highlighting)
      const fileRows = screen.getAllByText(/test\d\.png/).map(el => {
        // Go up to find the div that has the flex items-center justify-between class
        let parent = el.parentElement;
        while (parent && !parent.className.includes('flex items-center justify-between')) {
          parent = parent.parentElement;
        }
        return parent;
      });
      
      expect(fileRows[1]).toHaveClass('bg-blue-50');
    });
  });
});