import React from 'react';
import { Upload, Download, Layers, Smartphone, Clock, Lock } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: Upload,
      title: 'Drag & Drop Upload',
      description: 'Simply drag your PNG files or click to browse. Supports multiple files at once.'
    },
    {
      icon: Layers,
      title: 'Quality Preservation',
      description: 'Maintains original image quality while converting to scalable vector format.'
    },
    {
      icon: Download,
      title: 'Instant Download',
      description: 'Download individual files or batch download all converted SVGs at once.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Fully responsive design that works perfectly on all devices and screen sizes.'
    },
    {
      icon: Clock,
      title: 'No Time Limits',
      description: 'Convert as many files as you need without any restrictions or time limits.'
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'All processing happens locally in your browser. Your files never leave your device.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4 tracking-tight">
            Why Choose ConvertFlow?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built with modern web technologies to provide the best PNG to SVG conversion experience.
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