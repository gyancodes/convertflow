import React, { useState, useCallback, useRef } from 'react';
import { VectorizationConfig, ConversionJob, ProcessingProgress, ProcessingResult, ConverterState } from '../../types/converter';
import { FileUpload } from './FileUpload';
import { ConfigurationPanel } from './ConfigurationPanel';
import { ProcessingProgress as ProcessingProgressComponent } from './ProcessingProgress';
import { PreviewComparison } from './PreviewComparison';
import { ImageProcessor } from '../../services/imageProcessor';
import { Vectorizer } from '../../services/vectorizer';
import { SvgGenerator } from '../../services/svgGenerator';
import { ColorQuantizer } from '../../services/colorQuantizer';
import { EdgeDetector } from '../../services/edgeDetector';

interface PngToSvgConverterProps {
  /** Optional initial configuration */
  initialConfig?: Partial<VectorizationConfig>;
  /** Whether to enable batch processing */
  enableBatchMode?: boolean;
  /** Maximum number of files for batch processing */
  maxBatchSize?: number;
}

const DEFAULT_CONFIG: VectorizationConfig = {
  colorCount: 16,
  smoothingLevel: 'medium',
  pathSimplification: 1.0,
  preserveTransparency: true,
  algorithm: 'auto'
};

/**
 * Main PNG to SVG converter orchestration component
 * Coordinates all processing steps from file upload to SVG generation
 */
export const PngToSvgConverter: React.FC<PngToSvgConverterProps> = ({
  initialConfig = {},
  enableBatchMode = false,
  maxBatchSize = 20
}) => {
  // State management
  const [converterState, setConverterState] = useState<ConverterState>({
    files: [],
    currentJob: null,
    globalConfig: { ...DEFAULT_CONFIG, ...initialConfig },
    isProcessing: false,
    batchMode: enableBatchMode
  });

  const [currentProgress, setCurrentProgress] = useState<ProcessingProgress>({
    stage: 'upload',
    progress: 0,
    message: 'Ready to process files'
  });

  const [completedJob, setCompletedJob] = useState<ConversionJob | null>(null);

  // Service instances
  const imageProcessorRef = useRef<ImageProcessor>();
  const vectorizerRef = useRef<Vectorizer>();
  const svgGeneratorRef = useRef<SvgGenerator>();
  const colorQuantizerRef = useRef<ColorQuantizer>();
  const edgeDetectorRef = useRef<EdgeDetector>();

  // Initialize services
  const initializeServices = useCallback(() => {
    if (!imageProcessorRef.current) {
      imageProcessorRef.current = new ImageProcessor();
    }
    if (!vectorizerRef.current) {
      vectorizerRef.current = new Vectorizer({
        simplificationTolerance: converterState.globalConfig.pathSimplification,
        enableBezierFitting: converterState.globalConfig.smoothingLevel !== 'low'
      });
    }
    if (!svgGeneratorRef.current) {
      svgGeneratorRef.current = new SvgGenerator({
        enableOptimization: true,
        groupByColor: true,
        precision: 2
      });
    }
    if (!colorQuantizerRef.current) {
      colorQuantizerRef.current = new ColorQuantizer();
    }
    if (!edgeDetectorRef.current) {
      edgeDetectorRef.current = new EdgeDetector();
    }
  }, [converterState.globalConfig]);

  // Simple fallback converter for when advanced algorithms fail
  const simpleFallbackConversion = useCallback(async (file: File): Promise<ProcessingResult> => {
    const startTime = performance.now();
    
    setCurrentProgress({
      stage: 'preprocess',
      progress: 25,
      message: 'Using simple conversion method...'
    });

    // Create a simple SVG that embeds the PNG as base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setCurrentProgress({
      stage: 'generate',
      progress: 75,
      message: 'Generating simple SVG...'
    });

    // Get image dimensions
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = base64;
    });

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
  <!-- Fallback conversion: PNG embedded as image -->
  <image width="${img.width}" height="${img.height}" xlink:href="${base64}"/>
</svg>`;

    setCurrentProgress({
      stage: 'generate',
      progress: 100,
      message: 'Simple conversion complete'
    });

    const processingTime = performance.now() - startTime;
    
    return {
      svgContent,
      originalSize: file.size,
      vectorSize: svgContent.length,
      processingTime,
      colorCount: 1,
      pathCount: 1
    };
  }, []);

  // Error handling and recovery
  const handleProcessingError = useCallback(async (error: Error, job: ConversionJob): Promise<boolean> => {
    console.error('Processing error:', error);

    // Try simple fallback conversion first
    if (!error.message.includes('fallback')) {
      setCurrentProgress({
        stage: 'preprocess',
        progress: 0,
        message: 'Advanced processing failed, trying simple conversion...'
      });

      try {
        const result = await simpleFallbackConversion(job.file);
        updateJobResult(job.id, result);
        return true;
      } catch (fallbackError) {
        console.error('Fallback conversion also failed:', fallbackError);
      }
    }

    // If fallback also fails, try with reduced settings
    if (error.message.includes('memory') || error.message.includes('Memory') || error.message.includes('large')) {
      const reducedConfig = {
        ...job.config,
        colorCount: Math.max(4, Math.floor(job.config.colorCount / 4)),
        pathSimplification: Math.min(10, job.config.pathSimplification * 3)
      };

      setCurrentProgress({
        stage: 'preprocess',
        progress: 0,
        message: 'Retrying with minimal settings...'
      });

      try {
        const result = await processImageWithConfig(job.file, reducedConfig);
        updateJobResult(job.id, result);
        return true;
      } catch (retryError) {
        // Final fallback
        try {
          const result = await simpleFallbackConversion(job.file);
          updateJobResult(job.id, result);
          return true;
        } catch (finalError) {
          updateJobError(job.id, `All conversion methods failed: ${finalError.message}`);
          return false;
        }
      }
    }

    // For other errors, try simple fallback
    try {
      const result = await simpleFallbackConversion(job.file);
      updateJobResult(job.id, result);
      return true;
    } catch (fallbackError) {
      updateJobError(job.id, `Processing failed: ${error.message}`);
      return false;
    }
  }, [simpleFallbackConversion]);

  // Core processing pipeline
  const processImageWithConfig = useCallback(async (file: File, config: VectorizationConfig): Promise<ProcessingResult> => {
    const startTime = performance.now();
    
    try {
      // Stage 1: Preprocess image
      setCurrentProgress({
        stage: 'preprocess',
        progress: 10,
        message: 'Loading and preprocessing image...'
      });

      const imageData = await Promise.race([
        loadImageToCanvas(file),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Image loading timeout')), 15000)
        )
      ]);
      
      setCurrentProgress({
        stage: 'preprocess',
        progress: 50,
        message: 'Preprocessing complete'
      });

      // Stage 2: Color quantization
      setCurrentProgress({
        stage: 'quantize',
        progress: 0,
        message: 'Reducing color palette...'
      });

      const colorQuantizer = colorQuantizerRef.current!;
      const palette = await Promise.race([
        colorQuantizer.quantizeKMeans(imageData, Math.min(config.colorCount, 32)), // Limit colors for performance
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Color quantization timeout')), 10000)
        )
      ]);
      
      setCurrentProgress({
        stage: 'quantize',
        progress: 50,
        message: 'Mapping colors to palette...'
      });

      const quantizedImageData = colorQuantizer.mapToQuantizedPalette(imageData, palette);
      
      setCurrentProgress({
        stage: 'quantize',
        progress: 100,
        message: `Reduced to ${palette.colors.length} colors`
      });

      // Stage 3: Edge detection and vectorization
      setCurrentProgress({
        stage: 'vectorize',
        progress: 0,
        message: 'Detecting edges and creating vectors...'
      });

      const edgeDetector = edgeDetectorRef.current!;
      const edgeData = await Promise.race([
        config.algorithm === 'photo' 
          ? edgeDetector.detectEdgesCanny(quantizedImageData, 50, 150, 3) // Reduced kernel size
          : edgeDetector.detectEdgesSobel(quantizedImageData, config.smoothingLevel === 'high' ? 30 : 50),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Edge detection timeout')), 15000)
        )
      ]);

      setCurrentProgress({
        stage: 'vectorize',
        progress: 50,
        message: 'Converting edges to vector paths...'
      });

      const vectorizer = vectorizerRef.current!;
      const colorMap = new Map(palette.colors.map((color, index) => [
        `color-${index}`,
        `rgb(${color.r},${color.g},${color.b})`
      ]));
      
      const vectorPaths = await vectorizer.vectorizeEdges(edgeData, colorMap);

      setCurrentProgress({
        stage: 'vectorize',
        progress: 100,
        message: `Generated ${vectorPaths.length} vector paths`
      });

      // Stage 4: SVG generation
      setCurrentProgress({
        stage: 'generate',
        progress: 0,
        message: 'Generating SVG output...'
      });

      const svgGenerator = svgGeneratorRef.current!;
      const result = await svgGenerator.generateSVG(
        vectorPaths,
        imageData.width,
        imageData.height,
        palette
      );

      setCurrentProgress({
        stage: 'generate',
        progress: 100,
        message: 'SVG generation complete'
      });

      const processingTime = performance.now() - startTime;
      
      return {
        ...result,
        processingTime,
        originalSize: file.size
      };

    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }, []);

  // Helper function to load image to canvas
  const loadImageToCanvas = useCallback(async (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          // Check for reasonable image dimensions
          if (img.width > 4096 || img.height > 4096) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image too large. Maximum size is 4096x4096 pixels.'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          URL.revokeObjectURL(objectUrl);
          resolve(imageData);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to extract image data'));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      // Add timeout to prevent hanging
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image loading timeout'));
      }, 30000); // 30 second timeout

      img.src = objectUrl;
    });
  }, []);

  // Job management functions
  const createJob = useCallback((file: File, config: VectorizationConfig): ConversionJob => {
    return {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      config,
      status: 'pending',
      progress: 0
    };
  }, []);

  const updateJobResult = useCallback((jobId: string, result: ProcessingResult) => {
    setConverterState(prev => ({
      ...prev,
      files: prev.files.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed' as const, progress: 100, result }
          : job
      )
    }));
  }, []);

  const updateJobError = useCallback((jobId: string, error: string) => {
    setConverterState(prev => ({
      ...prev,
      files: prev.files.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed' as const, error }
          : job
      )
    }));
  }, []);

  // Main processing function
  const processJob = useCallback(async (job: ConversionJob) => {
    initializeServices();
    
    setConverterState(prev => ({
      ...prev,
      isProcessing: true,
      currentJob: job.id,
      files: prev.files.map(j => 
        j.id === job.id 
          ? { ...j, status: 'processing' as const }
          : j
      )
    }));

    try {
      const result = await processImageWithConfig(job.file, job.config);
      updateJobResult(job.id, result);
      setCompletedJob({ ...job, result, status: 'completed' });
    } catch (error) {
      const recovered = await handleProcessingError(error as Error, job);
      if (!recovered) {
        setCompletedJob({ ...job, status: 'failed', error: error.message });
      }
    } finally {
      setConverterState(prev => ({
        ...prev,
        isProcessing: false,
        currentJob: null
      }));
    }
  }, [initializeServices, processImageWithConfig, handleProcessingError, updateJobResult]);

  // Event handlers
  const handleFilesSelected = useCallback((files: File[]) => {
    const jobs = files.map(file => createJob(file, converterState.globalConfig));
    
    setConverterState(prev => ({
      ...prev,
      files: [...prev.files, ...jobs]
    }));

    // Auto-start processing if not in batch mode and only one file
    if (!converterState.batchMode && jobs.length === 1) {
      processJob(jobs[0]);
    }
  }, [converterState.globalConfig, converterState.batchMode, createJob, processJob]);

  const handleConfigChange = useCallback((config: VectorizationConfig) => {
    setConverterState(prev => ({
      ...prev,
      globalConfig: config
    }));
  }, []);

  const handleStartProcessing = useCallback(() => {
    const pendingJob = converterState.files.find(job => job.status === 'pending');
    if (pendingJob) {
      processJob(pendingJob);
    }
  }, [converterState.files, processJob]);

  const handleCancelProcessing = useCallback(() => {
    setConverterState(prev => ({
      ...prev,
      isProcessing: false,
      currentJob: null
    }));
    
    setCurrentProgress({
      stage: 'upload',
      progress: 0,
      message: 'Processing cancelled'
    });
  }, []);

  const handleDownload = useCallback(() => {
    if (!completedJob?.result) return;

    const blob = new Blob([completedJob.result.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${completedJob.file.name.replace('.png', '')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [completedJob]);

  const handleReset = useCallback(() => {
    setConverterState(prev => ({
      ...prev,
      files: [],
      currentJob: null,
      isProcessing: false
    }));
    setCompletedJob(null);
    setCurrentProgress({
      stage: 'upload',
      progress: 0,
      message: 'Ready to process files'
    });
  }, []);

  return (
    <div className="png-to-svg-converter max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PNG to SVG Converter</h1>
        <p className="text-gray-600">
          Convert your PNG images to scalable vector graphics with advanced vectorization algorithms
        </p>
      </div>

      {/* Configuration Panel */}
      <ConfigurationPanel
        config={converterState.globalConfig}
        onChange={handleConfigChange}
        disabled={converterState.isProcessing}
      />

      {/* File Upload */}
      <FileUpload
        onFilesSelected={handleFilesSelected}
        isProcessing={converterState.isProcessing}
        maxFiles={maxBatchSize}
      />

      {/* Processing Controls */}
      {converterState.files.length > 0 && !converterState.isProcessing && !completedJob && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleStartProcessing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!converterState.files.some(job => job.status === 'pending')}
          >
            Start Conversion
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Processing Progress */}
      {converterState.isProcessing && (
        <ProcessingProgressComponent
          progress={currentProgress}
          isProcessing={converterState.isProcessing}
          onCancel={handleCancelProcessing}
        />
      )}

      {/* Preview and Results */}
      {completedJob?.result && (
        <div className="space-y-6">
          <PreviewComparison
            originalFile={completedJob.file}
            result={completedJob.result}
            onDownload={handleDownload}
          />
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Download SVG
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Convert Another
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {completedJob?.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Conversion Failed</h3>
          <p className="text-red-700 mb-4">{completedJob.error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => processJob(completedJob)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PngToSvgConverter;