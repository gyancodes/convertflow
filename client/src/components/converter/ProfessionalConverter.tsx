import React, { useState, useCallback } from "react";
import {
  convertImageToSvg,
  downloadSvg,
  validateImageFile,
  ConversionOptions,
} from "../../utils/converter";
import { PreviewComparison } from "../preview/PreviewComparison";
import { AlertTriangle, Eye } from "lucide-react";

interface ConversionFile {
  file: File;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  svgContent?: string;
  error?: string;
  originalSize: number;
  compressedSize?: number;
}

interface ConversionSettings {
  mode: "wrapper" | "vectorize";
  engine: "potrace" | "imagetracer";
  preset: string;
  numberOfColors: number;
  scale: number;
  strokeWidth: number;
  ltres: number;
  qtres: number;
  // Potrace-specific settings
  threshold: number;
  turdSize: number;
  optCurve: boolean;
  optTolerance: number;
}

export const ProfessionalConverter: React.FC = () => {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [settings, setSettings] = useState<ConversionSettings>({
    mode: "vectorize",
    engine: "imagetracer",
    preset: "default",
    numberOfColors: 16,
    scale: 1,
    strokeWidth: 1,
    ltres: 1,
    qtres: 1,
    // Potrace-specific defaults
    threshold: 128,
    turdSize: 2,
    optCurve: true,
    optTolerance: 0.2,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Preview state
  const [previewFile, setPreviewFile] = useState<ConversionFile | null>(null);
  const [networkError, setNetworkError] = useState<string>("");
  const [retryCount, setRetryCount] = useState<{ [fileId: string]: number }>(
    {},
  );

  // Helper function to classify errors
  const classifyError = (
    error: any,
  ): {
    type: "network" | "server" | "validation" | "unknown";
    message: string;
    retryable: boolean;
  } => {
    if (!navigator.onLine) {
      return {
        type: "network",
        message:
          "No internet connection. Please check your network and try again.",
        retryable: true,
      };
    }

    if (error?.name === "TypeError" && error?.message?.includes("fetch")) {
      return {
        type: "network",
        message: "Network error. Please check your connection and try again.",
        retryable: true,
      };
    }

    if (error?.status >= 500) {
      return {
        type: "server",
        message: "Server error. Please try again in a moment.",
        retryable: true,
      };
    }

    if (error?.status === 413) {
      return {
        type: "validation",
        message: "File too large. Please use a smaller image.",
        retryable: false,
      };
    }

    if (error?.status === 429) {
      return {
        type: "server",
        message: "Too many requests. Please wait a moment and try again.",
        retryable: true,
      };
    }

    if (error?.status >= 400 && error?.status < 500) {
      return {
        type: "validation",
        message:
          error?.message ||
          "Invalid request. Please check your file and settings.",
        retryable: false,
      };
    }

    return {
      type: "unknown",
      message:
        error instanceof Error
          ? error.message
          : "Conversion failed. Please try again.",
      retryable: true,
    };
  };

  // Helper function to retry conversion with exponential backoff
  const retryConversion = async (
    fileData: ConversionFile,
    conversionOptions: ConversionOptions,
    attempt: number = 1,
  ): Promise<string> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    try {
      return await convertImageToSvg(fileData.file, conversionOptions);
    } catch (error) {
      const errorInfo = classifyError(error);

      if (!errorInfo.retryable || attempt >= maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return retryConversion(fileData, conversionOptions, attempt + 1);
    }
  };

  const handleFileSelect = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: ConversionFile[] = [];
    const rejectedFiles: string[] = [];
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB reasonable limit for browser

    Array.from(fileList).forEach((file) => {
      const error = validateImageFile(file);
      if (error) {
        rejectedFiles.push(`${file.name}: ${error}`);
        return;
      }

      // Check file size limit
      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name}: File size exceeds 50MB limit`);
        return;
      }

      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending",
        progress: 0,
        originalSize: file.size,
      });
    });

    if (rejectedFiles.length > 0) {
      alert(`Some files were rejected:\n${rejectedFiles.join("\n")}`);
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const convertFiles = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    const conversionOptions: ConversionOptions = {
      mode: settings.mode,
      engine: settings.engine,
      options:
        settings.engine === "potrace"
          ? {
              threshold: settings.threshold,
              turdSize: settings.turdSize,
              optCurve: settings.optCurve,
              optTolerance: settings.optTolerance,
            }
          : {
              numberOfColors: settings.numberOfColors,
              scale: settings.scale,
              strokeWidth: settings.strokeWidth,
              ltres: settings.ltres,
              qtres: settings.qtres,
            },
    };

    for (const fileData of files) {
      if (fileData.status === "completed") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: "processing" as const, progress: 0 }
            : f,
        ),
      );

      try {
        // Clear any previous network errors
        setNetworkError("");

        const svgContent = await retryConversion(fileData, conversionOptions);
        const compressedSize = new Blob([svgContent]).size;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "completed" as const,
                  progress: 100,
                  svgContent,
                  compressedSize,
                }
              : f,
          ),
        );

        // Reset retry count on success
        setRetryCount((prev) => {
          const newCount = { ...prev };
          delete newCount[fileData.id];
          return newCount;
        });
      } catch (error) {
        const errorInfo = classifyError(error);
        const currentRetries = retryCount[fileData.id] || 0;

        // Update retry count
        setRetryCount((prev) => ({
          ...prev,
          [fileData.id]: currentRetries + 1,
        }));

        // Set network error for display
        if (errorInfo.type === "network") {
          setNetworkError(errorInfo.message);
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "error" as const,
                  progress: 0,
                  error: `${errorInfo.message}${currentRetries > 0 ? ` (Attempt ${currentRetries + 1})` : ""}`,
                }
              : f,
          ),
        );
      }
    }

    setIsProcessing(false);
  }, [files, settings]);

  const downloadFile = useCallback((fileData: ConversionFile) => {
    if (fileData.svgContent) {
      downloadSvg(fileData.svgContent, fileData.file.name);
    }
  }, []);

  const retryFile = useCallback(
    async (fileData: ConversionFile) => {
      if (isProcessing) return;

      // Reset file status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? {
                ...f,
                status: "processing" as const,
                progress: 0,
                error: undefined,
              }
            : f,
        ),
      );

      const conversionOptions: ConversionOptions = {
        mode: settings.mode,
        preset: settings.preset,
        numberOfColors: settings.numberOfColors,
        scale: settings.scale,
        strokeWidth: settings.strokeWidth,
        ltres: settings.ltres,
        qtres: settings.qtres,
      };

      try {
        setNetworkError("");
        const svgContent = await retryConversion(fileData, conversionOptions);
        const compressedSize = new Blob([svgContent]).size;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "completed" as const,
                  progress: 100,
                  svgContent,
                  compressedSize,
                }
              : f,
          ),
        );

        setRetryCount((prev) => {
          const newCount = { ...prev };
          delete newCount[fileData.id];
          return newCount;
        });
      } catch (error) {
        const errorInfo = classifyError(error);
        const currentRetries = retryCount[fileData.id] || 0;

        setRetryCount((prev) => ({
          ...prev,
          [fileData.id]: currentRetries + 1,
        }));

        if (errorInfo.type === "network") {
          setNetworkError(errorInfo.message);
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "error" as const,
                  progress: 0,
                  error: `${errorInfo.message}${currentRetries > 0 ? ` (Attempt ${currentRetries + 1})` : ""}`,
                }
              : f,
          ),
        );
      }
    },
    [settings, isProcessing, retryCount],
  );

  const downloadAll = useCallback(() => {
    files.forEach((fileData) => {
      if (fileData.svgContent) {
        downloadSvg(fileData.svgContent, fileData.file.name);
      }
    });
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCompressionRatio = (original: number, compressed?: number) => {
    if (!compressed) return null;
    const ratio = ((original - compressed) / original) * 100;
    return ratio > 0
      ? `${ratio.toFixed(1)}% smaller`
      : `${Math.abs(ratio).toFixed(1)}% larger`;
  };

  const completedFiles = files.filter((f) => f.status === "completed");

  // Preview handlers
  const handlePreview = useCallback((fileData: ConversionFile) => {
    if (fileData.status === "completed" && fileData.svgContent) {
      setPreviewFile(fileData);
    }
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  const handlePreviewDownload = useCallback(() => {
    if (previewFile && previewFile.svgContent) {
      downloadSvg(previewFile.svgContent, previewFile.file.name);
    }
  }, [previewFile]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Professional Image to SVG Converter
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Convert PNG and JPEG images to high-quality SVG vectors with advanced
          customization options
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Unlimited batch processing • High-quality vectorization
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Upload & Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Files
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="mx-auto h-12 w-12"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-red-600">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPEG support</p>
              </label>
            </div>
          </div>

          {/* Conversion Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Conversion Settings
            </h3>

            {/* Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conversion Mode
              </label>
              <select
                value={settings.mode}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    mode: e.target.value as "wrapper" | "vectorize",
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isProcessing}
              >
                <option value="vectorize">
                  True Vectorization (Recommended)
                </option>
                <option value="wrapper">Simple Wrapper (Fast)</option>
              </select>
            </div>

            {/* Engine Selection */}
            {settings.mode === "vectorize" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vectorization Engine
                </label>
                <select
                  value={settings.engine}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      engine: e.target.value as "potrace" | "imagetracer",
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="potrace">
                    Potrace (Black & White Line Art)
                  </option>
                  <option value="imagetracer">
                    ImageTracer (Full Color & Detail)
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {settings.engine === "potrace"
                    ? "Best for logos, sketches, and monochrome line art"
                    : "Best for photos, complex artwork, and multiple colors"}
                </p>
              </div>
            )}

            {/* Preset Selection */}
            {settings.mode === "vectorize" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Preset
                </label>
                <select
                  value={settings.preset}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, preset: e.target.value }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="default">Default</option>
                  <option value="posterized1">Posterized (2 colors)</option>
                  <option value="posterized2">Posterized (4 colors)</option>
                  <option value="posterized3">Posterized (8 colors)</option>
                  <option value="detailed">Detailed (64 colors)</option>
                  <option value="artistic1">Artistic Style 1</option>
                  <option value="artistic2">Artistic Style 2</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="sharp">Sharp Edges</option>
                  <option value="smoothed">Smooth Curves</option>
                </select>
              </div>
            )}

            {/* Advanced Settings Toggle */}
            {settings.mode === "vectorize" && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-red-600 hover:text-red-800 mb-4"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Settings
              </button>
            )}

            {/* Advanced Settings */}
            {showAdvanced && settings.mode === "vectorize" && (
              <div className="space-y-4 border-t pt-4">
                {settings.engine === "potrace" ? (
                  // Potrace-specific settings
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Threshold: {settings.threshold}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={settings.threshold}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            threshold: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-red-600"
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500">
                        Controls black/white threshold for tracing
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Turd Size: {settings.turdSize}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.turdSize}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            turdSize: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-red-600"
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500">
                        Minimum area of curves (removes noise)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Optimization Tolerance: {settings.optTolerance}
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.5"
                        step="0.05"
                        value={settings.optTolerance}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            optTolerance: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-red-600"
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-500">
                        Higher values = smoother curves
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="optCurve"
                        checked={settings.optCurve}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            optCurve: e.target.checked,
                          }))
                        }
                        className="mr-2 accent-red-600"
                        disabled={isProcessing}
                      />
                      <label
                        htmlFor="optCurve"
                        className="text-sm font-medium text-gray-700"
                      >
                        Optimize Curves
                      </label>
                    </div>
                  </>
                ) : (
                  // ImageTracer-specific settings
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Colors: {settings.numberOfColors}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="64"
                        value={settings.numberOfColors}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            numberOfColors: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-red-600"
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Line Threshold: {settings.ltres}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={settings.ltres}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            ltres: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-red-600"
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quad Threshold: {settings.qtres}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={settings.qtres}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            qtres: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-red-600"
                        disabled={isProcessing}
                      />
                    </div>
                  </>
                )}

                {/* Common settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scale: {settings.scale}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={settings.scale}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        scale: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-red-600"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stroke Width: {settings.strokeWidth}px
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={settings.strokeWidth}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        strokeWidth: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-red-600"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - File List & Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Files ({files.length})
              </h3>
              {files.length > 0 && (
                <div className="space-x-2">
                  {completedFiles.length > 1 && (
                    <button
                      onClick={downloadAll}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Download All
                    </button>
                  )}
                  <button
                    onClick={convertFiles}
                    disabled={isProcessing || files.length === 0}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isProcessing ? "Converting..." : "Convert Files"}
                  </button>
                </div>
              )}
            </div>

            {files.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No files selected. Upload some images to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((fileData) => (
                  <div
                    key={fileData.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              fileData.status === "completed"
                                ? "bg-green-500"
                                : fileData.status === "processing"
                                  ? "bg-red-500"
                                  : fileData.status === "error"
                                    ? "bg-red-500"
                                    : "bg-gray-300"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {fileData.file.name}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                {formatFileSize(fileData.originalSize)}
                              </span>
                              {fileData.compressedSize && (
                                <>
                                  <span>
                                    → {formatFileSize(fileData.compressedSize)}
                                  </span>
                                  <span className="text-green-600">
                                    {getCompressionRatio(
                                      fileData.originalSize,
                                      fileData.compressedSize,
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {fileData.status === "processing" && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-red-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${fileData.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {fileData.error && (
                          <p className="mt-1 text-xs text-red-600">
                            {fileData.error}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {fileData.status === "completed" && (
                          <>
                            <button
                              onClick={() => handlePreview(fileData)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                              title="Preview comparison"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => downloadFile(fileData)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Download
                            </button>
                          </>
                        )}
                        {fileData.status === "error" && (
                          <button
                            onClick={() => retryFile(fileData)}
                            disabled={isProcessing}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(fileData.id)}
                          disabled={isProcessing}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {files.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {files.length}
                    </p>
                    <p className="text-sm text-gray-500">Total Files</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {completedFiles.length}
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {files.filter((f) => f.status === "error").length}
                    </p>
                    <p className="text-sm text-gray-500">Errors</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Error Display */}
      {networkError && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Connection Error
              </h3>
              <div className="mt-1 text-sm text-red-700">{networkError}</div>
              <button
                onClick={() => setNetworkError("")}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Comparison Modal */}
      {previewFile && previewFile.svgContent && (
        <PreviewComparison
          originalFile={previewFile.file}
          svgContent={previewFile.svgContent}
          filename={previewFile.file.name}
          onDownload={handlePreviewDownload}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};
