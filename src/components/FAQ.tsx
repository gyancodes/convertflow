import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does PNG to SVG conversion work?',
      answer: 'Our converter uses advanced vectorization algorithms to trace the edges and shapes in your PNG image, then converts them into scalable vector paths. You can choose between different algorithms optimized for logos, photos, or line art to get the best results for your specific image type.'
    },
    {
      question: 'What types of PNG images work best?',
      answer: 'Simple graphics, logos, icons, and line art typically convert best to SVG format. Complex photographs may not vectorize as effectively, but our "photo" algorithm can still create good results. Images with clear edges and solid colors generally produce the cleanest SVG output.'
    },
    {
      question: 'Can I adjust the conversion settings?',
      answer: 'Yes! You can customize color count (2-256 colors), smoothing level, path simplification, and choose between different processing algorithms. The "Auto" mode detects the best settings for your image, while manual settings give you full control over the output quality and file size.'
    },
    {
      question: 'Will my transparent PNG backgrounds be preserved?',
      answer: 'Absolutely! Our converter fully supports PNG transparency and preserves alpha channel information in the output SVG. You can enable or disable transparency preservation in the settings based on your needs.'
    },
    {
      question: 'How large can my PNG files be?',
      answer: 'We support PNG files up to 10MB each, with a maximum of 20 files per batch. For optimal performance, we recommend keeping images under 4096x4096 pixels. Larger images are automatically resized to prevent browser memory issues.'
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Yes, completely! All image processing happens entirely in your browser using client-side JavaScript. Your files never leave your device or get uploaded to any server. This ensures 100% privacy and security for your images.'
    },
    {
      question: 'What browsers and devices are supported?',
      answer: 'ConvertFlow works on all modern browsers including Chrome, Firefox, Safari, and Edge on desktop and mobile devices. No plugins, extensions, or downloads required - just open the website and start converting.'
    },
    {
      question: 'Can I use the converted SVGs commercially?',
      answer: 'Yes! The SVG files you create are yours to use however you like, including commercial projects. However, make sure you have the rights to use the original PNG images you\'re converting.'
    },
    {
      question: 'Why choose SVG over PNG?',
      answer: 'SVG files are infinitely scalable without quality loss, often smaller in file size, editable with code or design tools, SEO-friendly, and perfect for responsive web design. They\'re ideal for logos, icons, and simple graphics that need to look crisp at any size.'
    },
    {
      question: 'What if the conversion doesn\'t look right?',
      answer: 'Try adjusting the settings! Increase color count for more detail, change the algorithm (shapes/photo/lineart), or adjust path simplification. For complex images, the "photo" algorithm with higher color count usually works best. Simple graphics work well with the "shapes" algorithm.'
    },
    {
      question: 'Is there a limit to how many files I can convert?',
      answer: 'No limits! ConvertFlow is completely free with no usage restrictions, account requirements, or hidden fees. Convert as many files as you need, whenever you need them.'
    },
    {
      question: 'Can I batch convert multiple files?',
      answer: 'Yes! You can select up to 20 PNG files at once for batch conversion. Each file is processed individually with the same settings, and you can download them all together or individually as needed.'
    }
  ];

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get answers to common questions about our PNG to SVG converter, 
            vectorization algorithms, and how to get the best results
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="vercel-card overflow-hidden"
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus-ring"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-black pr-4 text-lg">
                  {faq.question}
                </span>
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {openIndex === index ? (
                    <Minus className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5 border-t border-gray-100">
                  <p className="text-gray-600 leading-relaxed pt-4">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};