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
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Now supports transparent PNGs
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-black animate-fade-in-up">
            Convert PNG to SVG
            <br />
            <span className="text-gray-600">in seconds</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Transform your PNG images into crisp, scalable vector graphics.
            <br className="hidden md:inline" />
            No quality loss. No uploads. No limits.
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
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              100% Free
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700">
              <Shield className="w-4 h-4" />
              Privacy First
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700">
              <Zap className="w-4 h-4" />
              Lightning Fast
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">10K+</div>
              <div className="text-sm text-gray-600">Images Converted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">100%</div>
              <div className="text-sm text-gray-600">Client-Side Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">0s</div>
              <div className="text-sm text-gray-600">Setup Time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};