import React from 'react';
import { FileImage, Cpu, Settings, Zap } from 'lucide-react';

export const TechnicalSpecs: React.FC = () => {
  const engines = [
    {
      name: 'Potrace',
      description: 'Optimized for line art and simple graphics',
      features: ['Clean vector paths', 'Minimal file size', 'Perfect for logos', 'Smooth curves'],
      bestFor: 'Line art, logos, simple graphics'
    },
    {
      name: 'ImageTracer',
      description: 'Advanced processing for complex images',
      features: ['Color preservation', 'Complex shapes', 'Detailed images', 'Multiple layers'],
      bestFor: 'Photos, complex artwork, detailed images'
    }
  ];

  const specs = [
    {
      icon: FileImage,
      title: 'Supported Formats',
      items: ['PNG (with transparency)', 'JPEG/JPG', 'Output: SVG vector format']
    },
    {
      icon: Cpu,
      title: 'Processing Power',
      items: ['Server-side processing', 'Dual engine architecture', 'Automatic load balancing']
    },
    {
      icon: Settings,
      title: 'Advanced Options',
      items: ['Threshold adjustment', 'Color optimization', 'Path simplification', 'Quality control']
    },
    {
      icon: Zap,
      title: 'Performance',
      items: ['Batch processing', 'Error recovery', 'Retry mechanisms', 'ZIP downloads']
    }
  ];

  return (
    <section id="technical-specs" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4 tracking-tight">
            Technical Specifications
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powered by advanced conversion engines with comprehensive format support and intelligent processing capabilities.
          </p>
        </div>

        {/* Engine Comparison */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-black mb-8 text-center">Conversion Engines</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {engines.map((engine, index) => (
              <div key={index} className="vercel-card p-8 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="text-2xl font-bold text-black">{engine.name}</h4>
                </div>
                <p className="text-gray-600 mb-6">{engine.description}</p>
                
                <div className="mb-6">
                  <h5 className="font-semibold text-black mb-3">Key Features:</h5>
                  <ul className="space-y-2">
                    {engine.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Best for: </span>
                  <span className="text-sm text-gray-700">{engine.bestFor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {specs.map((spec, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-white rounded-lg shadow-sm mb-6 mx-auto">
                <spec.icon className="w-8 h-8 text-gray-700" />
              </div>
              
              <h4 className="text-xl font-semibold text-black mb-4">
                {spec.title}
              </h4>
              
              <ul className="space-y-2">
                {spec.items.map((item, idx) => (
                  <li key={idx} className="text-gray-600 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};