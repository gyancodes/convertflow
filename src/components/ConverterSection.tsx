import React from 'react';
import { PngToSvgConverter } from './converter/PngToSvgConverter';

export const ConverterSection: React.FC = () => {
  return (
    <section id="converter" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Start Converting Now
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your PNG or JPEG files and watch them transform into scalable SVG format
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <PngToSvgConverter 
            enableBatchMode={true}
            maxBatchSize={10}
          />
        </div>
      </div>
    </section>
  );
};