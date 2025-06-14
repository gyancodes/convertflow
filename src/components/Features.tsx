import React from 'react';
import { Upload, Download, Layers, Smartphone, Clock, Lock } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: Upload,
      title: 'Drag & Drop Upload',
      description: 'Simply drag your PNG files or click to browse. Supports multiple files at once.',
      color: 'blue'
    },
    {
      icon: Layers,
      title: 'Quality Preservation',
      description: 'Maintains original image quality while converting to scalable vector format.',
      color: 'purple'
    },
    {
      icon: Download,
      title: 'Instant Download',
      description: 'Download individual files or batch download all converted SVGs at once.',
      color: 'green'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Fully responsive design that works perfectly on all devices and screen sizes.',
      color: 'orange'
    },
    {
      icon: Clock,
      title: 'No Time Limits',
      description: 'Convert as many files as you need without any restrictions or time limits.',
      color: 'red'
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'All processing happens locally in your browser. Your files never leave your device.',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-gradient-to-tr from-blue-500 to-blue-300 text-white shadow-blue-100',
      purple: 'bg-gradient-to-tr from-purple-500 to-purple-300 text-white shadow-purple-100',
      green: 'bg-gradient-to-tr from-green-500 to-green-300 text-white shadow-green-100',
      orange: 'bg-gradient-to-tr from-orange-500 to-orange-300 text-white shadow-orange-100',
      red: 'bg-gradient-to-tr from-red-500 to-red-300 text-white shadow-red-100',
      indigo: 'bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white shadow-indigo-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Why Choose <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">ConvertFlow?</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            Built with modern web technologies to provide the <span className="font-semibold text-blue-600">best PNG to SVG conversion</span> experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-white/80 backdrop-blur rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden"
            >
              <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none ${getColorClasses(feature.color)}`}></div>
              <div className={`inline-flex items-center justify-center p-4 rounded-2xl mb-7 shadow-lg transition-transform duration-300 group-hover:scale-110 ${getColorClasses(feature.color)}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed text-base font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};