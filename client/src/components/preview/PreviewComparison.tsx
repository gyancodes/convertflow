import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface PreviewComparisonProps {
  originalFile: File;
  svgContent: string;
  filename: string;
  onDownload: () => void;
  onClose?: () => void;
}

export const PreviewComparison: React.FC<PreviewComparisonProps> = ({
  originalFile,
  svgContent,
  filename,
  onDownload,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showConverted, setShowConverted] = useState(true);
  const [viewMode, setViewMode] = useState<
    "side-by-side" | "overlay" | "single"
  >("side-by-side");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");
  const [svgDataUrl, setSvgDataUrl] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLImageElement>(null);
  const svgImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Create object URL for original image
    const url = URL.createObjectURL(originalFile);
    setOriginalImageUrl(url);

    // Create data URL for SVG
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    setSvgDataUrl(svgUrl);

    return () => {
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(svgUrl);
    };
  }, [originalFile, svgContent]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const svgSize = new Blob([svgContent]).size;
  const compressionRatio = (
    ((originalFile.size - svgSize) / originalFile.size) *
    100
  ).toFixed(1);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50 ${
        isFullscreen ? "p-0" : "p-4"
      }`}
    >
      {/* Header */}
      <div className="bg-white rounded-t-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{filename}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>Original: {formatFileSize(originalFile.size)}</span>
            <span>SVG: {formatFileSize(svgSize)}</span>
            <span
              className={`font-medium ${
                parseFloat(compressionRatio) > 0
                  ? "text-green-600"
                  : "text-purple-600"
              }`}
            >
              {parseFloat(compressionRatio) > 0 ? "-" : "+"}
              {Math.abs(parseFloat(compressionRatio))}%
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Controls */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "side-by-side"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode("overlay")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "overlay"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setViewMode("single")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "single"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Single
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onDownload}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download SVG</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <svg
                className="w-5 h-5"
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
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-gray-100 rounded-b-lg overflow-hidden">
        {viewMode === "side-by-side" && (
          <div className="h-full flex">
            {/* Original Image */}
            <div className="flex-1 relative bg-white border-r border-gray-300">
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  Original ({originalFile.type})
                </div>
              </div>
              <div className="h-full flex items-center justify-center p-4 overflow-auto">
                <img
                  ref={originalImageRef}
                  src={originalImageUrl}
                  alt="Original"
                  className="max-w-none transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
            </div>

            {/* Converted SVG */}
            <div className="flex-1 relative bg-white">
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  Converted (SVG)
                </div>
              </div>
              <div className="h-full flex items-center justify-center p-4 overflow-auto">
                <img
                  ref={svgImageRef}
                  src={svgDataUrl}
                  alt="Converted SVG"
                  className="max-w-none transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === "overlay" && (
          <div className="h-full relative bg-white">
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  showOriginal
                    ? "bg-purple-600 text-white"
                    : "bg-black bg-opacity-75 text-white hover:bg-opacity-90"
                }`}
              >
                {showOriginal ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span>Original</span>
              </button>
              <button
                onClick={() => setShowConverted(!showConverted)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  showConverted
                    ? "bg-green-600 text-white"
                    : "bg-black bg-opacity-75 text-white hover:bg-opacity-90"
                }`}
              >
                {showConverted ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span>Converted</span>
              </button>
            </div>

            <div className="h-full flex items-center justify-center p-4 overflow-auto relative">
              {showOriginal && (
                <img
                  src={originalImageUrl}
                  alt="Original"
                  className="absolute max-w-none transition-all duration-200"
                  style={{
                    transform: `scale(${zoom})`,
                    opacity: showConverted ? 0.7 : 1,
                  }}
                />
              )}
              {showConverted && (
                <img
                  src={svgDataUrl}
                  alt="Converted SVG"
                  className="absolute max-w-none transition-all duration-200"
                  style={{
                    transform: `scale(${zoom})`,
                    opacity: showOriginal ? 0.7 : 1,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {viewMode === "single" && (
          <div className="h-full relative bg-white">
            <div className="absolute top-4 left-4 z-10">
              <div className="flex bg-black bg-opacity-75 rounded-lg p-1">
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    showOriginal
                      ? "bg-white text-gray-900"
                      : "text-white hover:bg-white hover:bg-opacity-20"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    !showOriginal
                      ? "bg-white text-gray-900"
                      : "text-white hover:bg-white hover:bg-opacity-20"
                  }`}
                >
                  Converted
                </button>
              </div>
            </div>

            <div className="h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={showOriginal ? originalImageUrl : svgDataUrl}
                alt={showOriginal ? "Original" : "Converted SVG"}
                className="max-w-none transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
