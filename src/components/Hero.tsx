import React from 'react';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-28 pb-20">
      {/* Decorative Blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[32rem] h-[32rem] bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[32rem] h-[32rem] bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-1 mb-6 rounded-full bg-white/80 shadow backdrop-blur border border-blue-100 text-blue-700 font-medium text-sm">
            <Zap className="w-4 h-4 text-yellow-400" />
            New: Now supports transparent PNGs!
          </div> */}

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Convert PNG to{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
              SVG
            </span>{' '}
            Instantly
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
            Transform your PNG images into crisp, scalable vector graphics in seconds.<br className="hidden md:inline" />
            <span className="text-blue-600 font-semibold">No quality loss.</span> <span className="text-purple-600 font-semibold">No uploads.</span> <span className="text-pink-600 font-semibold">No limits.</span>
          </p>

          {/* CTA & Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-14">
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              <span>Start Converting</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-2 text-gray-600 text-base bg-white/70 px-4 py-2 rounded-full shadow border border-gray-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>100% Free • No Limits • No Sign-up</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-3 bg-white/80 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="p-3 bg-blue-100 rounded-full shadow">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Lightning Fast</h3>
              <p className="text-gray-600 text-sm text-center">Convert images in seconds with our ultra-optimized engine.</p>
            </div>
            <div className="flex flex-col items-center space-y-3 bg-white/80 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="p-3 bg-purple-100 rounded-full shadow">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">100% Secure</h3>
              <p className="text-gray-600 text-sm text-center">All processing happens in your browser. <span className="font-medium text-purple-700">No uploads, ever.</span></p>
            </div>
            <div className="flex flex-col items-center space-y-3 bg-white/80 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="p-3 bg-green-100 rounded-full shadow">
                <Globe className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Universal Access</h3>
              <p className="text-gray-600 text-sm text-center">Works on any device, any browser, anywhere in the world.</p>
            </div>
          </div>

          {/* Extra Info */}
          <div className="mt-14 text-gray-500 text-sm flex flex-col md:flex-row items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-500" />
              Privacy-first: No files leave your device.
            </span>
            <span className="hidden md:inline">•</span>
            <span className="inline-flex items-center gap-1">
              <Globe className="w-4 h-4 text-blue-500" />
              Open source & free forever.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};