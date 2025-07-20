import React from 'react';
import { Upload, Settings, Zap, Download, FileImage, Check } from 'lucide-react';

export const ConverterDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 p-6">
      {/* Demo Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-black mb-4">
          Enhanced Converter Design
        </h2>
        <p className="text-xl text-gray-600">
          Clean, step-by-step interface inspired by Vercel's design principles
        </p>
      </div>

      {/* Step 1: Configuration */}
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-black text-white rounded-full text-sm font-medium mb-2">
            1
          </div>
          <h3 className="text-lg font-semibold text-black">Configure Settings</h3>
          <p className="text-gray-600">Adjust conversion parameters for optimal results</p>
        </div>
        
        <div className="vercel-card p-8 space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-black mb-2">Conversion Settings</h3>
            <p className="text-gray-600">Fine-tune your PNG to SVG conversion</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-black">Color Count</label>
                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">16</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-lg">
                <div className="w-1/4 h-2 bg-black rounded-lg"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-black">Algorithm</label>
              <div className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-white">
                Auto - Detect best algorithm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: File Upload */}
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-black text-white rounded-full text-sm font-medium mb-2">
            2
          </div>
          <h3 className="text-lg font-semibold text-black">Upload Files</h3>
          <p className="text-gray-600">Select your PNG images to convert</p>
        </div>
        
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-gray-300 transition-all duration-200">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-6 rounded-2xl bg-gray-100 text-gray-600">
              <Upload className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-black">Upload PNG Images</h3>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Drag and drop your PNG files here, or click to browse
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 rounded-full">Up to 10 files</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">Max 10MB each</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">PNG only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Selected Files */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-black">Selected Files (2)</h4>
            <button className="text-sm text-gray-500 hover:text-black transition-colors px-3 py-1 hover:bg-gray-100 rounded-md">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['logo.png', 'icon.png'].map((filename, i) => (
              <div key={i} className="vercel-card p-4 group hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-200">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black">{filename}</p>
                    <p className="text-xs text-gray-500">2.4 MB</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: Process */}
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-black text-white rounded-full text-sm font-medium mb-2">
            3
          </div>
          <h3 className="text-lg font-semibold text-black">Convert</h3>
          <p className="text-gray-600">Process your images to SVG format</p>
        </div>

        <div className="flex justify-center space-x-4">
          <button className="btn-primary px-8 py-3 rounded-lg font-medium">
            Start Conversion
          </button>
          <button className="btn-secondary px-8 py-3 rounded-lg font-medium">
            Reset
          </button>
        </div>
      </div>

      {/* Step 4: Results */}
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-medium mb-2">
            ✓
          </div>
          <h3 className="text-lg font-semibold text-black">Conversion Complete</h3>
          <p className="text-gray-600">Your SVG is ready for download</p>
        </div>

        <div className="vercel-card p-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-black mb-2">Success!</h4>
              <p className="text-gray-600">Your PNG has been converted to SVG</p>
            </div>
            <div className="flex justify-center space-x-4">
              <button className="btn-primary px-8 py-3 rounded-lg font-medium">
                Download SVG
              </button>
              <button className="btn-secondary px-8 py-3 rounded-lg font-medium">
                Convert Another
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterDemo;