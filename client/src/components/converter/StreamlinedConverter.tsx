import React, { useState, useCallback, useRef } from "react";
import { convertImageToSvg, downloadSvg, validateImageFile, ConversionOptions } from "../../utils/converter";
import { Upload, Download, Settings, Eye, X, CheckCircle, AlertCircle, Loader } from "lucide-react";

interface ConversionFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  svgContent?: string;
  error?: string;
  originalSize: number;
  compressedSize?: number;
  previewUrl?: string;
}

interface QuickSettings {
  engine: 'potrace' | 'imagetracer';
  quality: 'fast' | 'balanced' | 'high';
  colorMode: 'preserve' | 'simplify' | 'monochrome';
}

export const StreamlinedConverter: React.FC = () => {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [settings, setSettings] = useState<QuickSettings>({
    engine: 'imagetracer',
    quality: 'balanced',
    colorMode: 'preserve'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quality presets mapping
  const getConversionOptions = (settings: QuickSettings): ConversionOptions => {
    const baseOptions = {
      mode: 'vectorize' as const,
      engine: settings.engine,
    };

    if (settings.engine === 'imagetracer') {
      const colorCounts = {
        fast: 8,
        balanced: 16,
        high: 32
      };
      
      const colors = settings.colorMode === 'monochrome' ? 2 : 
                    settings.colorMode === 'simplify' ? Math.min(colorCounts[settings.quality], 8) :
                    colorCounts[settings.quality];

      return {
        ...baseOptions,
        numberOfColors: colors,
        scale: settings.quality === 'high' ? 1.2 : 1,
        strokeWidth: 1,
        ltres: settings.quality === 'fast' ? 2 : 1,
        qtres: settings.quality === 'fast' ? 2 : 1
      };
    } else {
      return {
        ...baseOptions,
        threshold: settings.quality === 'fast' ? 150 : settings.quality === 'balanced' ? 128 : 100,
        turdSize: settings.quality === 'fast' ? 4 : 2,
        optCurve: true,
        optTolerance: settings.quality === 'high' ? 0.1 : 0.2
      };
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: ConversionFile[] = [];
    Array.from(fileList).forEach((file) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        alert(`${file.name}: ${validationError}`);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending',
        progress: 0,
        originalSize: file.size,
        previewUrl
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const convertFiles = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const conversionOptions = getConversionOptions(settings);

    for (const fileData of files) {
      if (fileData.status === 'completed') continue;

      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'processing', progress: 0 } : f
      ));

      try {
        const svgContent = await convertImageToSvg(fileData.file, conversionOptions);
        
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'completed', 
            progress: 100, 
            svgContent: svgContent,
            compressedSize: new Blob([svgContent]).size
          } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Conversion failed'
          } : f
        ));
      }
    }

    setIsProcessing(false);
  }, [files, settings]);

  const downloadFile = useCallback((fileData: ConversionFile) => {
    if (fileData.svgContent) {
      downloadSvg(fileData.svgContent, fileData.file.name);
    }
  }, []);

  const downloadAll = useCallback(() => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.svgContent);
    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
      downloadFile(completedFiles[0]);
    } else {
      // Create ZIP for multiple files
      import('jszip').then(({ default: JSZip }) => {
        const zip = new JSZip();
        completedFiles.forEach(fileData => {
          if (fileData.svgContent) {
            const fileName = fileData.file.name.replace(/\.[^/.]+$/, '.svg');
            zip.file(fileName, fileData.svgContent);
          }
        });
        
        zip.generateAsync({ type: 'blob' }).then(content => {
          const url = URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'converted-svgs.zip';
          a.click();
          URL.revokeObjectURL(url);
        });
      });
    }
  }, [files, downloadFile]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedFiles = files.filter(f => f.status === 'completed');
  const hasFiles = files.length > 0;
  const canConvert = files.some(f => f.status === 'pending') && !isProcessing;
  const canDownload = completedFiles.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PNG to SVG Converter
        </h1>
        <p className="text-gray-600">
          Convert your images to scalable vector graphics instantly
        </p>
      </div>

      {/* Main Upload Area */}
      {!hasFiles && (
        <div 
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="mb-4">
            <Upload className="mx-auto h-16 w-16 text-gray-400" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Choose files or drag them here
          </h3>
          <p className="text-gray-500 mb-6">
            PNG, JPEG files up to 10MB each
          </p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Select Files
          </button>
        </div>
      )}

      {/* Files List */}
      {hasFiles && (
        <div className="space-y-6">
          {/* Settings Bar */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                
                <div className="text-sm text-gray-500">
                  Engine: <span className="font-medium">{settings.engine === 'imagetracer' ? 'ImageTracer (Color)' : 'Potrace (B&W)'}</span>
                  {' • '}
                  Quality: <span className="font-medium capitalize">{settings.quality}</span>
                </div>
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add More Files
              </button>
            </div>

            {/* Expanded Settings */}
            {showSettings && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
                  <select
                    value={settings.engine}
                    onChange={(e) => setSettings(prev => ({ ...prev, engine: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    disabled={isProcessing}
                  >
                    <option value="imagetracer">🌈 ImageTracer (Color)</option>
                    <option value="potrace">🖤 Potrace (B&W)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                  <select
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    disabled={isProcessing}
                  >
                    <option value="fast">⚡ Fast</option>
                    <option value="balanced">⚖️ Balanced</option>
                    <option value="high">🎯 High Quality</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Mode</label>
                  <select
                    value={settings.colorMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, colorMode: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    disabled={isProcessing || settings.engine === 'potrace'}
                  >
                    <option value="preserve">🌈 Preserve Colors</option>
                    <option value="simplify">🎨 Simplify Colors</option>
                    <option value="monochrome">⚫ Monochrome</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((fileData) => (
              <div key={fileData.id} className="bg-white rounded-lg border p-4">
                {/* File Preview */}
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {fileData.previewUrl && (
                    <img 
                      src={fileData.previewUrl} 
                      alt={fileData.file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileData.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileData.originalSize)}
                        {fileData.compressedSize && (
                          <> → {formatFileSize(fileData.compressedSize)}</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {fileData.status === 'pending' && (
                      <div className="flex items-center text-gray-500 text-xs">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                        Ready to convert
                      </div>
                    )}
                    {fileData.status === 'processing' && (
                      <div className="flex items-center text-blue-600 text-xs">
                        <Loader className="w-3 h-3 animate-spin mr-2" />
                        Converting...
                      </div>
                    )}
                    {fileData.status === 'completed' && (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3 mr-2" />
                          Converted
                        </div>
                        <button
                          onClick={() => downloadFile(fileData)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Download
                        </button>
                      </div>
                    )}
                    {fileData.status === 'error' && (
                      <div className="flex items-center text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3 mr-2" />
                        <span className="truncate">{fileData.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {canConvert && (
              <button
                onClick={convertFiles}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Converting...' : 'Convert to SVG'}
              </button>
            )}
            
            {canDownload && (
              <button
                onClick={downloadAll}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download {completedFiles.length > 1 ? 'All' : 'SVG'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for additional uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
};