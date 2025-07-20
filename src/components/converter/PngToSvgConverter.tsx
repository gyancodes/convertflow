import React, { useState, useCallback, useRef } from "react";
import {
  VectorizationConfig,
  ConversionJob,
  ProcessingProgress,
  ProcessingResult,
  ConverterState,
} from "../../types/converter";
import { ConversionError } from "../../types/errors";
import { FileUpload } from "./FileUpload";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { ProcessingProgress as ProcessingProgressComponent } from "./ProcessingProgress";
import { PreviewComparison } from "./PreviewComparison";
import { MemoryMonitor } from "./MemoryMonitor";
import ErrorDisplay from "./ErrorDisplay";
import ErrorBoundary from "./ErrorBoundary";
import { ImageProcessor } from "../../services/imageProcessor";
import { Vectorizer } from "../../services/vectorizer";
import { SvgGenerator } from "../../services/svgGenerator";
import { ColorQuantizer } from "../../services/colorQuantizer";
import { EdgeDetector } from "../../services/edgeDetector";
import { getWorkerManager } from "../../services/workerManager";
import { PerformanceMonitor } from "../../utils/performanceMonitor";
import {
  withFileValidation,
  withImageProcessing,
  withSvgGeneration,
  withTimeout,
  withMemoryMonitoring,
  checkBrowserCompatibility,
  validateConfiguration,
} from "../../utils/errorUtils";

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
  smoothingLevel: "medium",
  pathSimplification: 1.0,
  preserveTransparency: true,
  algorithm: "auto",
};

/**
 * Main PNG to SVG converter orchestration component
 * Coordinates all processing steps from file upload to SVG generation
 */
export const PngToSvgConverter: React.FC<PngToSvgConverterProps> = ({
  initialConfig = {},
  enableBatchMode = false,
  maxBatchSize = 20,
}) => {
  // State management
  const [converterState, setConverterState] = useState<ConverterState>({
    files: [],
    currentJob: null,
    globalConfig: { ...DEFAULT_CONFIG, ...initialConfig },
    isProcessing: false,
    batchMode: enableBatchMode,
  });

  const [currentProgress, setCurrentProgress] = useState<ProcessingProgress>({
    stage: "upload",
    progress: 0,
    message: "Ready to process files",
  });

  const [completedJob, setCompletedJob] = useState<ConversionJob | null>(null);
  const [currentError, setCurrentError] = useState<ConversionError | null>(
    null
  );
  const [browserCompatibilityError, setBrowserCompatibilityError] =
    useState<ConversionError | null>(null);
  const [memoryWarnings, setMemoryWarnings] = useState<string[]>([]);
  const [useWebWorker, setUseWebWorker] = useState(true);

  // Service instances
  const imageProcessorRef = useRef<ImageProcessor>();
  const vectorizerRef = useRef<Vectorizer>();
  const svgGeneratorRef = useRef<SvgGenerator>();
  const colorQuantizerRef = useRef<ColorQuantizer>();
  const edgeDetectorRef = useRef<EdgeDetector>();
  const performanceMonitorRef = useRef<PerformanceMonitor>();
  const workerManagerRef = useRef(getWorkerManager());

  // Check browser compatibility on mount
  React.useEffect(() => {
    const compatibilityError = checkBrowserCompatibility();
    if (compatibilityError) {
      setBrowserCompatibilityError(compatibilityError);
    }
  }, []);

  // Initialize services with performance optimizations
  const initializeServices = useCallback(() => {
    if (!imageProcessorRef.current) {
      // Initialize with optimized settings based on system capabilities
      const memoryLimit = navigator.deviceMemory
        ? Math.min(navigator.deviceMemory * 16 * 1024 * 1024, 100 * 1024 * 1024) // Use device memory info if available
        : 50 * 1024 * 1024; // Default 50MB limit

      imageProcessorRef.current = new ImageProcessor({
        maxDimensions: { width: 1024, height: 1024 }, // Reduced for better performance
        memoryLimit,
      });
    }
    if (!vectorizerRef.current) {
      vectorizerRef.current = new Vectorizer({
        simplificationTolerance: converterState.globalConfig.pathSimplification,
        enableBezierFitting:
          converterState.globalConfig.smoothingLevel !== "low",
      });
    }
    if (!svgGeneratorRef.current) {
      svgGeneratorRef.current = new SvgGenerator({
        enableOptimization: true,
        groupByColor: true,
        precision: 2,
      });
    }
    if (!colorQuantizerRef.current) {
      colorQuantizerRef.current = new ColorQuantizer();
    }
    if (!edgeDetectorRef.current) {
      edgeDetectorRef.current = new EdgeDetector();
    }
    if (!performanceMonitorRef.current) {
      performanceMonitorRef.current = new PerformanceMonitor();
    }
  }, [converterState.globalConfig]);

  // Simple fallback converter for when advanced algorithms fail
  const simpleFallbackConversion = useCallback(
    async (file: File): Promise<ProcessingResult> => {
      const startTime = performance.now();

      setCurrentProgress({
        stage: "preprocess",
        progress: 25,
        message: "Using simple conversion method...",
      });

      // Create a simple SVG that embeds the PNG as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setCurrentProgress({
        stage: "generate",
        progress: 75,
        message: "Generating simple SVG...",
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
        stage: "generate",
        progress: 100,
        message: "Simple conversion complete",
      });

      const processingTime = performance.now() - startTime;

      return {
        svgContent,
        originalSize: file.size,
        vectorSize: svgContent.length,
        processingTime,
        colorCount: 1,
        pathCount: 1,
      };
    },
    []
  );

  // Job management functions
  const updateJobResult = useCallback(
    (jobId: string, result: ProcessingResult) => {
      setConverterState((prev) => ({
        ...prev,
        files: prev.files.map((job) =>
          job.id === jobId
            ? { ...job, status: "completed" as const, progress: 100, result }
            : job
        ),
      }));
    },
    []
  );

  const updateJobError = useCallback((jobId: string, error: string) => {
    setConverterState((prev) => ({
      ...prev,
      files: prev.files.map((job) =>
        job.id === jobId ? { ...job, status: "failed" as const, error } : job
      ),
    }));
  }, []);

  // Helper function to load image to canvas
  const loadImageToCanvas = useCallback(
    async (file: File): Promise<ImageData> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not create canvas context"));
          return;
        }

        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          try {
            // Check for reasonable image dimensions
            if (img.width > 4096 || img.height > 4096) {
              URL.revokeObjectURL(objectUrl);
              reject(
                new Error("Image too large. Maximum size is 4096x4096 pixels.")
              );
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
            reject(new Error("Failed to extract image data"));
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to load image"));
        };

        // Add timeout to prevent hanging
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Image loading timeout"));
        }, 30000); // 30 second timeout

        img.src = objectUrl;
      });
    },
    []
  );

  // Core processing pipeline with comprehensive error handling
  const processImageWithConfig = useCallback(
    async (
      file: File,
      config: VectorizationConfig
    ): Promise<ProcessingResult> => {
      const startTime = performance.now();

      // Validate configuration first
      validateConfiguration(config);

      return await withImageProcessing(
        async () => {
          // Stage 1: Preprocess image with file validation
          setCurrentProgress({
            stage: "preprocess",
            progress: 10,
            message: "Loading and preprocessing image...",
          });

          const imageData = await withFileValidation(async () => {
            return await withTimeout(
              () => loadImageToCanvas(file),
              30000,
              "Image loading took too long"
            );
          }, file);

          setCurrentProgress({
            stage: "preprocess",
            progress: 50,
            message: "Preprocessing complete",
          });

          // Stage 2: Color quantization with memory monitoring
          setCurrentProgress({
            stage: "quantize",
            progress: 0,
            message: "Reducing color palette...",
          });

          const colorQuantizer = colorQuantizerRef.current!;
          const palette = await withMemoryMonitoring(async () => {
            return await withTimeout(
              () =>
                colorQuantizer.quantizeKMeans(
                  imageData,
                  Math.min(config.colorCount, 32)
                ),
              15000,
              "Color quantization took too long"
            );
          }, 150); // 150MB memory limit

          setCurrentProgress({
            stage: "quantize",
            progress: 50,
            message: "Mapping colors to palette...",
          });

          const quantizedImageData = colorQuantizer.mapToQuantizedPalette(
            imageData,
            palette
          );

          setCurrentProgress({
            stage: "quantize",
            progress: 100,
            message: `Reduced to ${palette.colors.length} colors`,
          });

          // Stage 3: Edge detection and vectorization with timeout
          setCurrentProgress({
            stage: "vectorize",
            progress: 0,
            message: "Detecting edges and creating vectors...",
          });

          const edgeDetector = edgeDetectorRef.current!;
          const edgeData = await withTimeout(
            async () => {
              return config.algorithm === "photo"
                ? edgeDetector.detectEdgesCanny(quantizedImageData, 50, 150, 3)
                : edgeDetector.detectEdgesSobel(
                    quantizedImageData,
                    config.smoothingLevel === "high" ? 30 : 50
                  );
            },
            20000,
            "Edge detection took too long"
          );

          setCurrentProgress({
            stage: "vectorize",
            progress: 50,
            message: "Converting edges to vector paths...",
          });

          const vectorizer = vectorizerRef.current!;
          const colorMap = new Map(
            palette.colors.map((color, index) => [
              `color-${index}`,
              `rgb(${color.r},${color.g},${color.b})`,
            ])
          );

          const vectorPaths = await vectorizer.vectorizeEdges(
            edgeData,
            colorMap
          );

          setCurrentProgress({
            stage: "vectorize",
            progress: 100,
            message: `Generated ${vectorPaths.length} vector paths`,
          });

          // Stage 4: SVG generation with error handling
          setCurrentProgress({
            stage: "generate",
            progress: 0,
            message: "Generating SVG output...",
          });

          const svgGenerator = svgGeneratorRef.current!;
          const result = await withSvgGeneration(
            async () => {
              return await withTimeout(
                () =>
                  svgGenerator.generateSVG(
                    vectorPaths,
                    imageData.width,
                    imageData.height,
                    palette
                  ),
                10000,
                "SVG generation took too long"
              );
            },
            { paths: vectorPaths, config }
          );

          setCurrentProgress({
            stage: "generate",
            progress: 100,
            message: "SVG generation complete",
          });

          const processingTime = performance.now() - startTime;

          return {
            ...result,
            processingTime,
            originalSize: file.size,
          };
        },
        {
          imageData,
          config,
          imageProcessor: imageProcessorRef.current,
        }
      );
    },
    [loadImageToCanvas]
  );

  // Enhanced error handling with ConversionError support
  const handleProcessingError = useCallback(
    async (
      error: ConversionError | Error,
      job: ConversionJob
    ): Promise<boolean> => {
      console.error("Processing error:", error);

      // Set the current error for display
      if (error instanceof Error && "type" in error) {
        setCurrentError(error as ConversionError);
      }

      // Try simple fallback conversion first for recoverable errors
      if (
        (error as ConversionError).recoverable !== false &&
        !error.message.includes("fallback")
      ) {
        setCurrentProgress({
          stage: "preprocess",
          progress: 0,
          message: "Advanced processing failed, trying simple conversion...",
        });

        try {
          const result = await simpleFallbackConversion(job.file);
          updateJobResult(job.id, result);
          setCurrentError(null); // Clear error on successful recovery
          return true;
        } catch (fallbackError) {
          console.error("Fallback conversion also failed:", fallbackError);
        }
      }

      // Handle specific error types with targeted recovery
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes("memory") ||
        errorMessage.includes("large") ||
        errorMessage.includes("complex")
      ) {
        const reducedConfig = {
          ...job.config,
          colorCount: Math.max(4, Math.floor(job.config.colorCount / 4)),
          pathSimplification: Math.min(10, job.config.pathSimplification * 3),
          smoothingLevel: "low" as const,
        };

        setCurrentProgress({
          stage: "preprocess",
          progress: 0,
          message: "Retrying with minimal settings...",
        });

        try {
          const result = await processImageWithConfig(job.file, reducedConfig);
          updateJobResult(job.id, result);
          setCurrentError(null); // Clear error on successful recovery
          return true;
        } catch (retryError) {
          // Final fallback
          try {
            const result = await simpleFallbackConversion(job.file);
            updateJobResult(job.id, result);
            setCurrentError(null);
            return true;
          } catch (finalError) {
            updateJobError(
              job.id,
              `All conversion methods failed: ${finalError.message}`
            );
            return false;
          }
        }
      }

      // For other errors, try simple fallback
      try {
        const result = await simpleFallbackConversion(job.file);
        updateJobResult(job.id, result);
        setCurrentError(null);
        return true;
      } catch (fallbackError) {
        updateJobError(job.id, error.message);
        return false;
      }
    },
    [
      simpleFallbackConversion,
      processImageWithConfig,
      updateJobResult,
      updateJobError,
    ]
  );

  // Job management functions
  const createJob = useCallback(
    (file: File, config: VectorizationConfig): ConversionJob => {
      return {
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        config,
        status: "pending",
        progress: 0,
      };
    },
    []
  );

  // Enhanced processing function with Web Worker support
  const processJob = useCallback(
    async (job: ConversionJob) => {
      initializeServices();

      setConverterState((prev) => ({
        ...prev,
        isProcessing: true,
        currentJob: job.id,
        files: prev.files.map((j) =>
          j.id === job.id ? { ...j, status: "processing" as const } : j
        ),
      }));

      // Clear previous memory warnings
      setMemoryWarnings([]);

      try {
        let result: ProcessingResult;

        // Try Web Worker processing first if enabled and supported
        if (useWebWorker && workerManagerRef.current.isWorkerSupported()) {
          try {
            // Extract image data for worker processing
            const imageData = await imageProcessorRef.current!.extractImageData(
              job.file
            );

            // Process in Web Worker with progress updates
            result = await workerManagerRef.current.processImage(
              imageData,
              job.config,
              (progress: number, stage: string) => {
                setCurrentProgress({
                  stage: stage as any,
                  progress,
                  message: `${stage}: ${Math.round(progress)}%`,
                });
              }
            );
          } catch (workerError) {
            console.warn(
              "Web Worker processing failed, falling back to main thread:",
              workerError
            );
            // Fall back to main thread processing
            result = await processImageWithConfig(job.file, job.config);
          }
        } else {
          // Process in main thread
          result = await processImageWithConfig(job.file, job.config);
        }

        updateJobResult(job.id, result);
        setCompletedJob({ ...job, result, status: "completed" });

        // Generate performance report
        if (performanceMonitorRef.current) {
          const imageData = await imageProcessorRef.current!.extractImageData(
            job.file
          );
          const report = performanceMonitorRef.current.generateReport(
            imageData,
            result
          );
          console.log("Performance Report:\n", report);
        }
      } catch (error) {
        const recovered = await handleProcessingError(error as Error, job);
        if (!recovered) {
          setCompletedJob({ ...job, status: "failed", error: error.message });
        }
      } finally {
        setConverterState((prev) => ({
          ...prev,
          isProcessing: false,
          currentJob: null,
        }));
      }
    },
    [
      initializeServices,
      processImageWithConfig,
      handleProcessingError,
      updateJobResult,
      useWebWorker,
    ]
  );

  // Event handlers with error handling
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      try {
        // Clear any previous errors
        setCurrentError(null);

        // Validate files before creating jobs
        await withFileValidation(async () => {
          // Basic validation is handled by the file upload component
          // Additional validation can be added here
          return Promise.resolve();
        });

        const jobs = files.map((file) =>
          createJob(file, converterState.globalConfig)
        );

        setConverterState((prev) => ({
          ...prev,
          files: [...prev.files, ...jobs],
        }));

        // Auto-start processing if not in batch mode and only one file
        if (!converterState.batchMode && jobs.length === 1) {
          processJob(jobs[0]);
        }
      } catch (error) {
        if (error instanceof Error && "type" in error) {
          setCurrentError(error as ConversionError);
        } else {
          console.error("File selection error:", error);
        }
      }
    },
    [
      converterState.globalConfig,
      converterState.batchMode,
      createJob,
      processJob,
    ]
  );

  const handleConfigChange = useCallback((config: VectorizationConfig) => {
    try {
      // Validate configuration before applying
      validateConfiguration(config);
      setCurrentError(null); // Clear any validation errors

      setConverterState((prev) => ({
        ...prev,
        globalConfig: config,
      }));
    } catch (error) {
      if (error instanceof Error && "type" in error) {
        setCurrentError(error as ConversionError);
      } else {
        console.error("Configuration validation error:", error);
      }
    }
  }, []);

  const handleStartProcessing = useCallback(() => {
    const pendingJob = converterState.files.find(
      (job) => job.status === "pending"
    );
    if (pendingJob) {
      processJob(pendingJob);
    }
  }, [converterState.files, processJob]);

  const handleCancelProcessing = useCallback(() => {
    setConverterState((prev) => ({
      ...prev,
      isProcessing: false,
      currentJob: null,
    }));

    setCurrentProgress({
      stage: "upload",
      progress: 0,
      message: "Processing cancelled",
    });
  }, []);

  const handleDownload = useCallback(() => {
    if (!completedJob?.result) return;

    const blob = new Blob([completedJob.result.svgContent], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${completedJob.file.name.replace(".png", "")}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [completedJob]);

  const handleReset = useCallback(() => {
    setConverterState((prev) => ({
      ...prev,
      files: [],
      currentJob: null,
      isProcessing: false,
    }));
    setCompletedJob(null);
    setCurrentError(null); // Clear any errors
    setCurrentProgress({
      stage: "upload",
      progress: 0,
      message: "Ready to process files",
    });
  }, []);

  // Error handling callbacks
  const handleRetryError = useCallback(() => {
    if (currentError && completedJob) {
      setCurrentError(null);
      processJob(completedJob);
    }
  }, [currentError, completedJob, processJob]);

  const handleDismissError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Memory warning handler
  const handleMemoryWarning = useCallback((warning: string) => {
    setMemoryWarnings((prev) => {
      if (!prev.includes(warning)) {
        return [...prev, warning];
      }
      return prev;
    });
  }, []);

  // Performance settings handlers
  const handleToggleWebWorker = useCallback(() => {
    setUseWebWorker((prev) => !prev);
  }, []);

  const handleOptimizeForPerformance = useCallback(() => {
    const optimizedConfig: VectorizationConfig = {
      ...converterState.globalConfig,
      colorCount: Math.min(converterState.globalConfig.colorCount, 16),
      pathSimplification: Math.max(
        converterState.globalConfig.pathSimplification,
        2.0
      ),
      smoothingLevel: "low",
    };

    handleConfigChange(optimizedConfig);
  }, [converterState.globalConfig, handleConfigChange]);

  return (
    <ErrorBoundary>
      <div className="png-to-svg-converter max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PNG to SVG Converter
          </h1>
          <p className="text-gray-600">
            Convert your PNG images to scalable vector graphics with advanced
            vectorization algorithms
          </p>
        </div>

        {/* Browser Compatibility Error */}
        {browserCompatibilityError && (
          <ErrorDisplay
            error={browserCompatibilityError}
            onDismiss={() => setBrowserCompatibilityError(null)}
            showTechnicalDetails={true}
          />
        )}

        {/* Current Error Display */}
        {currentError && (
          <ErrorDisplay
            error={currentError}
            onRetry={currentError.recoverable ? handleRetryError : undefined}
            onDismiss={handleDismissError}
            showTechnicalDetails={false}
          />
        )}

        {/* Memory Warnings */}
        {memoryWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-sm font-medium text-yellow-800">
                Performance Warnings
              </h3>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {memoryWarnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleOptimizeForPerformance}
                className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
              >
                Optimize Settings
              </button>
              <button
                onClick={() => setMemoryWarnings([])}
                className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Performance Settings */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Performance Settings
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useWebWorker}
                  onChange={handleToggleWebWorker}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Use Web Worker{" "}
                  {workerManagerRef.current.isWorkerSupported()
                    ? "(Supported)"
                    : "(Not Supported)"}
                </span>
              </label>
            </div>
            <MemoryMonitor
              isProcessing={converterState.isProcessing}
              onMemoryWarning={handleMemoryWarning}
              className="flex-shrink-0"
            />
          </div>
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
        {converterState.files.length > 0 &&
          !converterState.isProcessing &&
          !completedJob && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleStartProcessing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={
                  !converterState.files.some((job) => job.status === "pending")
                }
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

        {/* Legacy Error Display for Failed Jobs */}
        {completedJob?.status === "failed" && !currentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Conversion Failed
            </h3>
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
    </ErrorBoundary>
  );
};

export default PngToSvgConverter;
