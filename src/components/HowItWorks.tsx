import React from 'react';
import { Upload, Settings, Zap, Download } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Images',
      description: 'Drag and drop PNG or JPEG files, or click to browse. Support for batch uploads.',
      number: '01'
    },
    {
      icon: Settings,
      title: 'Choose Engine & Options',
      description: 'Select Potrace for line art or ImageTracer for complex images. Adjust conversion settings.',
      number: '02'
    },
    {
      icon: Zap,
      title: 'Server Processing',
      description: 'Our backend processes your images with automatic error recovery and retry mechanisms.',
      number: '03'
    },
    {
      icon: Download,
      title: 'Download Results',
      description: 'Download individual SVG files or get all converted files in a convenient ZIP archive.',
      number: '04'
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
            Professional image conversion in four simple steps with advanced engine selection and error handling
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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