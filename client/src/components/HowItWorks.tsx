import React from "react";
import { Upload, Settings, Zap, Download, ArrowRight } from "lucide-react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload Images",
      description: "Drag & drop PNG/JPEG files.",
      number: "01",
    },
    {
      icon: Settings,
      title: "Select Engine",
      description: "Choose Potrace or ImageTracer.",
      number: "02",
    },
    {
      icon: Zap,
      title: "Auto Process",
      description: "Instant client-side vectorization.",
      number: "03",
    },
    {
      icon: Download,
      title: "Get SVG",
      description: "Download crisp vector files.",
      number: "04",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="text-left max-w-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              Professional vectorization in{" "}
              <span className="text-red-600 font-semibold">4 simple steps</span>
              .
            </p>
          </div>

          <div className="hidden md:block h-px flex-1 bg-gray-100 mx-8"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-gradient-to-r from-red-100 via-red-50 to-transparent -z-10"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-red-100 h-full">
                {/* Number Watermark */}
                <div className="absolute top-4 right-4 text-4xl font-black text-gray-50 opacity-50 group-hover:text-red-50 transition-colors pointer-events-none select-none">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <step.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                  {step.title}
                </h3>

                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow for mobile/tablet (visual flow) */}
              {index < steps.length - 1 && (
                <div className="hidden sm:flex lg:hidden absolute top-1/2 -right-3 -translate-y-1/2 text-gray-200 z-10 bg-white rounded-full">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
