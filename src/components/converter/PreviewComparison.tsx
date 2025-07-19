import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ProcessingResult } from '../../types/converter';

interface PreviewComparisonProps {
  /** Original PNG file for comparison */
  originalFile: File;
  /** Processing result containing SVG data */
  result: ProcessingResult;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Callback when user wants to download the SVG */
  onDownload?: () => void;
}

interface ViewState {
  /** Current zoom level (1.0 = 100%) */
  zoom: number;
  /** Pan offset X coordinate */
  panX: number;
  /** Pan offset Y coordinate */
  panY: number;
  /** Whether user is currently dragging */
  isDragging: boolean;
  /** Last mouse position for drag calculations */
  lastMousePos: { x: number; y: number } | null;
}

export const PreviewComparison: React.FC<PreviewComparisonProps> = ({
  originalFile,
  result,
  loading = false,
  onDownload
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastMousePos: null
  });

  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [svgDataUrl, setSvgDataUrl] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const originalRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<HTMLImageElement>(null);

  // Create object URLs for display
  useEffect(() => {
    const originalUrl = URL.createObjectURL(originalFile);
    setOriginalImageUrl(originalUrl);

    const svgBlob = new Blob([result.svgContent], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    setSvgDataUrl(svgUrl);

    return () => {
      URL.revokeObjectURL(originalUrl);
      URL.revokeObjectURL(svgUrl);
    };
  }, [originalFile, result.svgContent]);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Calculate size reduction percentage
  const sizeReduction = useCallback((): number => {
    if (result.originalSize === 0) return 0;
    return ((result.originalSize - result.vectorSize) / result.originalSize) * 100;
  }, [result.originalSize, result.vectorSize]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 5.0)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1)
    }));
  }, []);

  const handleZoomReset = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: 1.0,
      panX: 0,
      panY: 0
    }));
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5.0, prev.zoom * delta))
    }));
  }, []);

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setViewState(prev => ({
      ...prev,
      isDragging: true,
      lastMousePos: { x: e.clientX, y: e.clientY }
    }));
  }, []);

  // Handle pan move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!viewState.isDragging || !viewState.lastMousePos) return;

    const deltaX = e.clientX - viewState.lastMousePos.x;
    const deltaY = e.clientY - viewState.lastMousePos.y;

    setViewState(prev => ({
      ...prev,
      panX: prev.panX + deltaX,
      panY: prev.panY + deltaY,
      lastMousePos: { x: e.clientX, y: e.clientY }
    }));
  }, [viewState.isDragging, viewState.lastMousePos]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      isDragging: false,
      lastMousePos: null
    }));
  }, []);

  // Transform style for images
  const imageTransform = `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`;

  if (loading) {
    return (
      <div className="preview-comparison bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating preview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-comparison bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with controls */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Preview & Comparison</h3>
          
          {/* Zoom controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <span className="text-sm text-gray-600 min-w-[4rem] text-center">
              {Math.round(viewState.zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <button
              onClick={handleZoomReset}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>
        </div>

        {/* File size comparison */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Original PNG</div>
            <div className="font-semibold text-gray-800">{formatFileSize(result.originalSize)}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Generated SVG</div>
            <div className="font-semibold text-gray-800">{formatFileSize(result.vectorSize)}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Size Change</div>
            <div className={`font-semibold ${sizeReduction() > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {sizeReduction() > 0 ? '-' : '+'}{Math.abs(sizeReduction()).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Image comparison area */}
      <div 
        ref={containerRef}
        className="relative h-96 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 grid grid-cols-2">
          {/* Original image */}
          <div className="relative border-r border-gray-200 overflow-hidden bg-gray-50">
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-10">
              Original PNG
            </div>
            <div className="flex items-center justify-center h-full">
              <img
                ref={originalRef}
                src={originalImageUrl}
                alt="Original PNG"
                className="max-w-none transition-transform duration-150 ease-out"
                style={{ transform: imageTransform }}
                draggable={false}
              />
            </div>
          </div>

          {/* SVG image */}
          <div className="relative overflow-hidden bg-gray-50">
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-10">
              Generated SVG
            </div>
            <div className="flex items-center justify-center h-full">
              <img
                ref={svgRef}
                src={svgDataUrl}
                alt="Generated SVG"
                className="max-w-none transition-transform duration-150 ease-out"
                style={{ transform: imageTransform }}
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* Pan instruction overlay */}
        {viewState.zoom > 1.0 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs">
            Click and drag to pan
          </div>
        )}
      </div>

      {/* Footer with download button */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Processing time: {result.processingTime.toFixed(0)}ms • 
            Colors: {result.colorCount} • 
            Paths: {result.pathCount}
          </div>
          
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download SVG
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewComparison;