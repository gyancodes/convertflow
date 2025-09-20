import React, { useState, useCallback } from "react";
import { convertPngToSvg, downloadSvg, validateImageFile } from "../../utils/converter";

interface PngToSvgConverterProps {
  enableBatchMode?: boolean;
  maxBatchSize?: number;
}

interface ConversionState {
  isProcessing: boolean;
  progress: number;
  message: string;
  error: string | null;
}

export const PngToSvgConverter: React.FC<PngToSvgConverterProps> = ({
  enableBatchMode = false,
  maxBatchSize = 10,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [conversionState, setConversionState] = useState<ConversionState>({
    isProcessing: false,
    progress: 0,
    message: "Ready to convert",
    error: null,
  });
  const [convertedSvgs, setConvertedSvgs] = useState<Array<{ name: string; content: string }>>([]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateImageFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setConversionState(prev => ({
        ...prev,
        error: errors.join(", ")
      }));
      return;
    }

    if (enableBatchMode && validFiles.length > maxBatchSize) {
      setConversionState(prev => ({
        ...prev,
        error: `Too many files. Maximum ${maxBatchSize} files allowed.`
      }));
      return;
    }

    setSelectedFiles(validFiles);
    setConversionState(prev => ({
      ...prev,
      error: null,
      message: `${validFiles.length} file(s) selected`
    }));
  }, [enableBatchMode, maxBatchSize]);

  const handleConvert = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setConversionState({
      isProcessing: true,
      progress: 0,
      message: "Converting files...",
      error: null,
    });

    const results: Array<{ name: string; content: string }> = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setConversionState(prev => ({
          ...prev,
          progress: (i / selectedFiles.length) * 100,
          message: `Converting ${file.name}...`
        }));

        const svgContent = await convertPngToSvg(file);
        results.push({
          name: file.name,
          content: svgContent
        });
      }

      setConvertedSvgs(results);
      setConversionState({
        isProcessing: false,
        progress: 100,
        message: `Successfully converted ${results.length} file(s)`,
        error: null,
      });
    } catch (error) {
      setConversionState({
        isProcessing: false,
        progress: 0,
        message: "Conversion failed",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }, [selectedFiles]);

  const handleDownload = useCallback((svgData: { name: string; content: string }) => {
    downloadSvg(svgData.content, svgData.name);
  }, []);

  const handleDownloadAll = useCallback(() => {
    convertedSvgs.forEach((svgData) => {
      downloadSvg(svgData.content, svgData.name);
    });
  }, [convertedSvgs]);

  const resetConverter = useCallback(() => {
    setSelectedFiles([]);
    setConvertedSvgs([]);
    setConversionState({
      isProcessing: false,
      progress: 0,
      message: "Ready to convert",
      error: null,
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Image to SVG Converter</h2>
        <p className="text-gray-600">
          Convert your PNG and JPEG images to SVG format while preserving quality
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select PNG or JPEG Files
        </label>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
          multiple={enableBatchMode}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={conversionState.isProcessing}
        />
        {enableBatchMode && (
          <p className="text-xs text-gray-500 mt-1">
            You can select up to {maxBatchSize} files at once
          </p>
        )}
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selected Files:</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convert Button */}
      {selectedFiles.length > 0 && !conversionState.isProcessing && convertedSvgs.length === 0 && (
        <div className="mb-6 text-center">
          <button
            onClick={handleConvert}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Convert to SVG
          </button>
        </div>
      )}

      {/* Progress */}
      {conversionState.isProcessing && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {conversionState.message}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(conversionState.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${conversionState.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {conversionState.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{conversionState.error}</p>
        </div>
      )}

      {/* Success Message */}
      {!conversionState.isProcessing && convertedSvgs.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{conversionState.message}</p>
        </div>
      )}

      {/* Download Section */}
      {convertedSvgs.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Converted Files:</h3>
            {convertedSvgs.length > 1 && (
              <button
                onClick={handleDownloadAll}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                Download All
              </button>
            )}
          </div>
          <div className="space-y-2">
            {convertedSvgs.map((svgData, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">
                  {svgData.name.replace(/\.[^/.]+$/, "")}.svg
                </span>
                <button
                  onClick={() => handleDownload(svgData)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition duration-200"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(selectedFiles.length > 0 || convertedSvgs.length > 0) && !conversionState.isProcessing && (
        <div className="text-center">
          <button
            onClick={resetConverter}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};
