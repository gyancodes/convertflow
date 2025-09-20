import React from 'react';
import { Upload, Download, Layers, Smartphone, Settings, RefreshCw, Zap, Shield } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: Settings,
      title: 'Dual Engine Selection',
      description: 'Choose between Potrace for clean line art or ImageTracer for complex images with multiple colors.'
    },
    {
      icon: Upload,
      title: 'Batch Processing',
      description: 'Upload multiple PNG and JPEG files simultaneously. Process dozens of images in one go.'
    },
    {
      icon: RefreshCw,
      title: 'Smart Error Recovery',
      description: 'Automatic retry mechanism with exponential backoff. Manual retry options for failed conversions.'
    },
    {
      icon: Zap,
      title: 'Server-Side Processing',
      description: 'Powerful backend processing ensures consistent results and handles large files efficiently.'
    },
    {
      icon: Download,
      title: 'Flexible Downloads',
      description: 'Download individual SVG files or batch download all converted files as a ZIP archive.'
    },
    {
      icon: Shield,
      title: 'Robust Architecture',
      description: 'Built with modern web technologies, comprehensive error handling, and network resilience.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4 tracking-tight">
            Professional-Grade Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced dual-engine processing with intelligent error handling and robust server-side architecture for reliable image conversion.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="vercel-card p-6 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4 group-hover:bg-black group-hover:text-white transition-all duration-200">
                <feature.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-semibold text-black mb-2">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};