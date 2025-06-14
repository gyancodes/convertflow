import React from 'react';
import { Download, FileImage, CheckCircle } from 'lucide-react';
import { ConvertedFile } from '../types';
import { downloadSvg } from '../utils/converter';

interface ImagePreviewProps {
  convertedFiles: ConvertedFile[];
  onClearAll: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ convertedFiles, onClearAll }) => {
  const handleDownload = (file: ConvertedFile) => {
    downloadSvg(file.svgContent, file.fileName);
  };

  const handleDownloadAll = () => {
    convertedFiles.forEach(file => {
      setTimeout(() => downloadSvg(file.svgContent, file.fileName), 100);
    });
  };

  if (convertedFiles.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Converted Files ({convertedFiles.length})
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadAll}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Download All</span>
          </button>
          <button
            onClick={onClearAll}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {convertedFiles.map((file) => (
          <div key={file.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="relative mb-4">
              <img
                src={file.originalUrl}
                alt={file.fileName}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 bg-green-100 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 truncate" title={file.fileName}>
                {file.fileName}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <FileImage className="w-4 h-4" />
                  <span>PNG → SVG</span>
                </div>
                <span>{(file.originalFile.size / 1024).toFixed(1)} KB</span>
              </div>
              
              <button
                onClick={() => handleDownload(file)}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};