import React from "react";
import {
  Upload,
  Download,
  Layers,
  Sparkles,
  RefreshCw,
  Zap,
  Shield,
  Cpu,
} from "lucide-react";

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-3 tracking-tight">
            Advanced Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need for professional vectorized graphics, now faster
            and free.
          </p>
        </div>

        {/* Bento Grid Layout - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
          {/* Main Feature - Large Box */}
          <div className="md:col-span-2 md:row-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Dual Engine Technology
                </h3>
                <p className="text-base text-gray-600 leading-relaxed mb-4">
                  Switch seamlessly between two powerful vectorization engines.
                  Use
                  <span className="font-semibold text-gray-900">
                    {" "}
                    Potrace
                  </span>{" "}
                  for crisp black & white line art, logos, and signatures.
                  Switch to{" "}
                  <span className="font-semibold text-gray-900">
                    {" "}
                    ImageTracer
                  </span>{" "}
                  for full-color, detailed vectorization of photos and complex
                  illustrations.
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-black"></div>{" "}
                  Potrace (B&W)
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{" "}
                  ImageTracer (Color)
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Client Side */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 group">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Client-Side Speed
            </h3>
            <p className="text-sm text-gray-600">
              Processing happens directly in your browser. Zero latency.
            </p>
          </div>

          {/* Feature 3 - Batch Processing */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 group">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Batch Processing
            </h3>
            <p className="text-sm text-gray-600">
              Convert hundreds of images at once. Parallel processing.
            </p>
          </div>

          {/* Feature 4 - Tall Box */}
          <div className="md:row-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 relative group overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gray-50 rounded-full translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Smart Optimization
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Our engines automatically clean up noise, smooth curves, and
                optimize paths.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-600 text-xs">
                  <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                  Path Simplification
                </li>
                <li className="flex items-center gap-2 text-gray-600 text-xs">
                  <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                  Noise Reduction
                </li>
                <li className="flex items-center gap-2 text-gray-600 text-xs">
                  <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                  Curve Smoothing
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 group">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">100% Free</h3>
            <p className="text-sm text-gray-600">
              No paywalls, no limits. Open source logic.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 group">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:translate-x-1 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Flexible Export
            </h3>
            <p className="text-sm text-gray-600">
              Download SVG or ZIP. Your choice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
