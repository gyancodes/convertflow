import React from "react";
import {
  ArrowRight,
  Github,
  Sparkles,
  Zap,
  Shield,
  Image as ImageIcon,
} from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-20 pb-12 overflow-hidden bg-white">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-red-100/50 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-orange-100/50 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-rose-100/50 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-red-100 shadow-sm mb-6 animate-fade-in hover:border-red-200 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-800">
              v1.0 is now Open Source
            </span>
            
            
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 animate-fade-in-up leading-tight">
            Convert Images to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              Vector Graphics
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl leading-relaxed animate-fade-in-up delay-100">
            Professional-grade PNG & JPG to SVG converter. Now running
            significantly faster with{" "}
            <span className="text-red-600 font-semibold">
              Client-Side Processing
            </span>
            . Privacy-focused, unlimited, and free forever.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up delay-200 mb-12">
            <button
              onClick={onGetStarted}
              className="min-w-[160px] group flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold text-base hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
            >
              Start Converting
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://github.com/gyancodes/convertflow"
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[160px] flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full font-semibold text-base hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <Github className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>

          {/* Feature Pills */}
          <div className="w-full animate-fade-in-up delay-300">
            <p className="text-xs text-gray-500 font-medium mb-4 uppercase tracking-wider">
              Trusted by developers for
            </p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-1.5 bg-red-50 rounded-lg text-red-600 shadow-sm">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Unlimited</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-1.5 bg-red-50 rounded-lg text-red-600 shadow-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">100% Private</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-1.5 bg-red-50 rounded-lg text-red-600 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">High Quality</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
