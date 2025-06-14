import React from 'react';
import { Upload, Zap, Download } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Your PNG',
      description: 'Drag and drop your PNG files or click to browse from your device',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Zap,
      title: 'Instant Conversion',
      description: 'Our advanced algorithm converts your PNG to SVG while preserving quality',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Download,
      title: 'Download SVG',
      description: 'Download your converted SVG files individually or all at once',
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert your PNG images to SVG format in just three simple steps
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-purple-200"></div>
            <div className="hidden md:block absolute top-16 left-2/3 right-0 h-0.5 bg-gradient-to-r from-purple-200 to-green-200"></div>
            
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-6 shadow-lg relative z-10`}>
                  <step.icon className="w-8 h-8" />
                </div>
                
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shadow-md z-20">
                  {index + 1}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
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