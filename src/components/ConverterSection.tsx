import React, { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { ImagePreview } from './ImagePreview';
import { ConvertedFile } from '../types';
import { convertPngToSvg } from '../utils/converter';

export const ConverterSection: React.FC = () => {
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsConverting(true);
    
    try {
      const newConvertedFiles: ConvertedFile[] = [];
      
      for (const file of files) {
        try {
          const svgContent = await convertPngToSvg(file);
          const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
          
          const convertedFile: ConvertedFile = {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            originalFile: file,
            originalUrl: URL.createObjectURL(file),
            svgContent,
            svgUrl: URL.createObjectURL(svgBlob),
            fileName: file.name,
          };
          
          newConvertedFiles.push(convertedFile);
        } catch (error) {
          console.error(`Failed to convert ${file.name}:`, error);
        }
      }
      
      setConvertedFiles(prev => [...prev, ...newConvertedFiles]);
    } finally {
      setIsConverting(false);
    }
  }, []);

  const handleClearAll = useCallback(() => {
    // Clean up object URLs to prevent memory leaks
    convertedFiles.forEach(file => {
      URL.revokeObjectURL(file.originalUrl);
      URL.revokeObjectURL(file.svgUrl);
    });
    setConvertedFiles([]);
  }, [convertedFiles]);

  return (
    <section id="converter" className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Start Converting Now
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your PNG files and watch them transform into scalable SVG format instantly
          </p>
        </div>
        
        <div className="space-y-12">
          <FileUpload 
            onFilesSelected={handleFilesSelected}
            isConverting={isConverting}
          />
          
          <ImagePreview 
            convertedFiles={convertedFiles}
            onClearAll={handleClearAll}
          />
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
    </section>
  );
};