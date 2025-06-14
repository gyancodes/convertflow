import React from 'react';
import { FileImage, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="text-center mb-12">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <FileImage className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          PNG to SVG
        </h1>
      </div>
      
      <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
        Convert your PNG images to scalable SVG format instantly. 
        Maintain quality while enabling infinite scaling.
      </p>
      
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Instant Conversion</span>
        </div>
        <div className="flex items-center space-x-2">
          <FileImage className="w-4 h-4 text-blue-500" />
          <span>Quality Preserved</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>100% Free</span>
        </div>
      </div>
    </header>
  );
};