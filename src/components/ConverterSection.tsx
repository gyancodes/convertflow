import React from 'react';
import { PngToSvgConverter } from './converter/PngToSvgConverter';

export const ConverterSection: React.FC = () => {

  return (
    <section id="converter" className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Start Converting Now
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your PNG files and watch them transform into scalable SVG format with advanced vectorization
          </p>
        </div>
        
        <PngToSvgConverter 
          enableBatchMode={true}
          maxBatchSize={10}
        />
      </div>
      
      {/* Background decoration */}
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
    </section>
  );
};