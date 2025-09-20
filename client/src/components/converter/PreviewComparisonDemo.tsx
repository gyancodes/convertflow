import React, { useState, useCallback } from 'react';
import { PreviewComparison } from './PreviewComparison';
import { ProcessingResult } from '../../types/converter';

/**
 * Demo component showing how to use PreviewComparison component
 * This demonstrates the preview and comparison functionality with mock data
 */
export const PreviewComparisonDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<'simple' | 'complex' | 'photo'>('simple');
  const [isLoading, setIsLoading] = useState(false);

  // Mock file data for different scenarios
  const mockFiles = {
    simple: new File(['mock-simple-png-data'], 'simple-logo.png', { type: 'image/png' }),
    complex: new File(['mock-complex-png-data'], 'detailed-artwork.png', { type: 'image/png' }),
    photo: new File(['mock-photo-png-data'], 'photograph.png', { type: 'image/png' })
  };

  // Mock processing results for different scenarios
  const mockResults: Record<string, ProcessingResult> = {
    simple: {
      svgContent: `
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect x="50" y="50" width="100" height="100" fill="#3B82F6" rx="10"/>
          <circle cx="100" cy="100" r="30" fill="#FFFFFF"/>
          <text x="100" y="105" text-anchor="middle" fill="#3B82F6" font-family="Arial" font-size="12">LOGO</text>
        </svg>
      `,
      originalSize: 2048,
      vectorSize: 387,
      processingTime: 850,
      colorCount: 2,
      pathCount: 3
    },
    complex: {
      svgContent: `
        <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          ${Array.from({ length: 25 }, (_, i) => {
            const x = (i % 5) * 60 + 30;
            const y = Math.floor(i / 5) * 60 + 30;
            const hue = (i * 14) % 360;
            return `<rect x="${x}" y="${y}" width="40" height="40" fill="hsl(${hue}, 70%, 60%)" rx="5"/>`;
          }).join('\n')}
          <circle cx="150" cy="150" r="80" fill="none" stroke="#333" stroke-width="3"/>
        </svg>
      `,
      originalSize: 15360,
      vectorSize: 2847,
      processingTime: 3200,
      colorCount: 26,
      pathCount: 26
    },
    photo: {
      svgContent: `
        <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#87CEEB"/>
              <stop offset="100%" style="stop-color:#E0F6FF"/>
            </linearGradient>
            <linearGradient id="ground" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#90EE90"/>
              <stop offset="100%" style="stop-color:#228B22"/>
            </linearGradient>
          </defs>
          <rect width="400" height="150" fill="url(#sky)"/>
          <rect y="150" width="400" height="150" fill="url(#ground)"/>
          <ellipse cx="80" cy="80" rx="30" ry="30" fill="#FFD700"/>
          <polygon points="150,200 180,150 210,200" fill="#8B4513"/>
          <ellipse cx="180" cy="140" rx="25" ry="40" fill="#228B22"/>
        </svg>
      `,
      originalSize: 524288, // 512KB
      vectorSize: 1024,
      processingTime: 8500,
      colorCount: 8,
      pathCount: 5
    }
  };

  const handleDownload = useCallback(() => {
    const result = mockResults[selectedDemo];
    const blob = new Blob([result.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted-${selectedDemo}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [selectedDemo]);

  const handleLoadingDemo = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Preview & Comparison Demo
        </h2>
        <p className="text-gray-600">
          Interactive demo of the PNG to SVG preview and comparison component
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Demo Controls</h3>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={() => setSelectedDemo('simple')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedDemo === 'simple'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Simple Logo (2KB → 387B)
          </button>
          
          <button
            onClick={() => setSelectedDemo('complex')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedDemo === 'complex'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Complex Artwork (15KB → 2.8KB)
          </button>
          
          <button
            onClick={() => setSelectedDemo('photo')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedDemo === 'photo'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Photo-like (512KB → 1KB)
          </button>
          
          <button
            onClick={handleLoadingDemo}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Show Loading State
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>Current Demo:</strong> {selectedDemo.charAt(0).toUpperCase() + selectedDemo.slice(1)} conversion scenario
          </p>
          <p>
            Use the zoom controls to inspect details, drag to pan when zoomed in, and compare the original vs converted output.
          </p>
        </div>
      </div>

      {/* Preview Component */}
      <PreviewComparison
        originalFile={mockFiles[selectedDemo]}
        result={mockResults[selectedDemo]}
        loading={isLoading}
        onDownload={handleDownload}
      />

      {/* Feature Highlights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Component Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">🔍 Zoom & Pan</h4>
            <p className="text-sm text-gray-600">
              Zoom from 10% to 500% with mouse wheel or buttons. Pan by dragging when zoomed in.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">📊 Size Comparison</h4>
            <p className="text-sm text-gray-600">
              Real-time file size comparison showing original PNG vs generated SVG with percentage change.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">⚡ Processing Stats</h4>
            <p className="text-sm text-gray-600">
              Display processing time, color count, and path count for transparency into conversion quality.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">👀 Side-by-Side View</h4>
            <p className="text-sm text-gray-600">
              Compare original and converted images simultaneously with synchronized zoom and pan.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">💾 Download Ready</h4>
            <p className="text-sm text-gray-600">
              One-click download of the generated SVG file when satisfied with the conversion quality.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">🎯 Loading States</h4>
            <p className="text-sm text-gray-600">
              Smooth loading indicators during processing with clear user feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`import { PreviewComparison } from './components/converter';

function MyConverter() {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ProcessingResult>();
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    // Download logic here
  };

  return (
    <PreviewComparison
      originalFile={file}
      result={result}
      loading={loading}
      onDownload={handleDownload}
    />
  );
}`}
        </pre>
      </div>
    </div>
  );
};

export default PreviewComparisonDemo;