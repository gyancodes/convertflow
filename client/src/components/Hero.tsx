import React from 'react';
import { ArrowRight, Zap, Shield, Globe, Sparkles } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative pt-32 pb-20 bg-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="max-w-7xl mx-auto px-6 text-center relative">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-blue-50 text-blue-700 text-sm font-medium animate-fade-in border border-blue-200">
            <Sparkles className="w-4 h-4" />
            Dual Engine Processing: Potrace & ImageTracer
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-black animate-fade-in-up">
            Professional Image
            <br />
            <span className="text-blue-600">to SVG Conversion</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Transform PNG and JPEG images into crisp, scalable vector graphics with our advanced dual-engine processing.
            <br className="hidden md:inline" />
            Choose between Potrace for line art or ImageTracer for complex images.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 focus-ring"
            >
              Start Converting
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:border-black transition-all duration-200 focus-ring">
              View Demo
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700 border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Dual Engine Support
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-sm text-green-700 border border-green-200">
              <Shield className="w-4 h-4" />
              Secure Processing
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-sm text-purple-700 border border-purple-200">
              <Zap className="w-4 h-4" />
              Batch Conversion
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">2</div>
              <div className="text-sm text-gray-600">Conversion Engines</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">PNG+JPEG</div>
              <div className="text-sm text-gray-600">Supported Formats</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">Auto</div>
              <div className="text-sm text-gray-600">Error Recovery</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};