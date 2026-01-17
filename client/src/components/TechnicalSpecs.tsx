import React from "react";
import { FileImage, Cpu, Settings, Zap, Check } from "lucide-react";

export const TechnicalSpecs: React.FC = () => {
  const engines = [
    {
      name: "Potrace",
      type: "Server-side (Node.js)",
      description: "Best for high-contrast, black & white line art.",
      features: [
        "Clean vector paths",
        "Minimal file size",
        "Perfect for logos",
        "Smooth curves",
      ],
      color: "bg-gray-900 text-white",
    },
    {
      name: "ImageTracer",
      type: "Client-side (Browser)",
      description: "Full-color vectorization for photos & artwork.",
      features: [
        "100% Private (Local)",
        "Color preservation",
        "Complex shapes",
        "Detailed rendering",
      ],
      color: "bg-red-600 text-white",
    },
  ];

  return (
    <section id="technical-specs" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Technical Specifications
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powered by industry-standard open source engines.
          </p>
        </div>

        {/* Engine Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
          {engines.map((engine, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-900">
                  {engine.name}
                </h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${engine.color === "bg-red-600 text-white" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                >
                  {engine.type}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-6 pb-6 border-b border-gray-100">
                {engine.description}
              </p>

              <ul className="space-y-3">
                {engine.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${engine.color === "bg-red-600 text-white" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"}`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Technical Specs Grid - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-gray-200 pt-12">
          <div className="text-center group">
            <div className="w-10 h-10 mx-auto mb-3 text-gray-900 group-hover:text-red-600 transition-colors">
              <FileImage className="w-full h-full" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Formats</h4>
            <p className="text-xs text-gray-500">PNG, JPG, BMP → SVG</p>
          </div>

          <div className="text-center group">
            <div className="w-10 h-10 mx-auto mb-3 text-gray-900 group-hover:text-red-600 transition-colors">
              <Cpu className="w-full h-full" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Processing</h4>
            <p className="text-xs text-gray-500">Hybrid (Client + Server)</p>
          </div>

          <div className="text-center group">
            <div className="w-10 h-10 mx-auto mb-3 text-gray-900 group-hover:text-red-600 transition-colors">
              <Settings className="w-full h-full" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Config</h4>
            <p className="text-xs text-gray-500">Fully Customizable</p>
          </div>

          <div className="text-center group">
            <div className="w-10 h-10 mx-auto mb-3 text-gray-900 group-hover:text-red-600 transition-colors">
              <Zap className="w-full h-full" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Performance</h4>
            <p className="text-xs text-gray-500">Batch & Zip Support</p>
          </div>
        </div>
      </div>
    </section>
  );
};
