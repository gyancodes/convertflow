import React from 'react';
import { Upload, Zap, Download } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Your PNG',
      description: 'Drag and drop your PNG files or click to browse from your device',
      number: '01'
    },
    {
      icon: Zap,
      title: 'Instant Conversion',
      description: 'Our advanced algorithm converts your PNG to SVG while preserving quality',
      number: '02'
    },
    {
      icon: Download,
      title: 'Download SVG',
      description: 'Download your converted SVG files individually or all at once',
      number: '03'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert your PNG images to SVG format in just three simple steps
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                {/* Step Number */}
                <div className="text-6xl font-bold text-gray-100 mb-4 group-hover:text-gray-200 transition-colors">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-black text-white rounded-lg mb-6 mx-auto group-hover:bg-gray-800 transition-colors">
                  <step.icon className="w-8 h-8" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-semibold text-black mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};