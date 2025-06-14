import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is the difference between PNG and SVG?',
      answer: 'PNG is a raster image format made of pixels, while SVG is a vector format made of mathematical descriptions. SVG files are scalable without quality loss and often smaller in file size.'
    },
    {
      question: 'Will the conversion affect image quality?',
      answer: 'Our conversion process embeds the original PNG data within the SVG container, preserving 100% of the original image quality while adding scalability benefits.'
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Yes, we support files up to 10MB per image. This covers most use cases while ensuring optimal performance in your browser.'
    },
    {
      question: 'Are my files uploaded to your servers?',
      answer: 'No, all processing happens locally in your browser. Your files never leave your device, ensuring complete privacy and security.'
    },
    {
      question: 'Can I convert multiple files at once?',
      answer: 'Absolutely! You can select multiple PNG files at once or drag and drop them together. All files will be converted simultaneously.'
    },
    {
      question: 'What browsers are supported?',
      answer: 'ConvertFlow works on all modern browsers including Chrome, Firefox, Safari, and Edge. No plugins or extensions required.'
    },
    {
      question: 'Is ConvertFlow really free?',
      answer: 'Yes, ConvertFlow is completely free to use with no hidden costs, registration requirements, or usage limits.'
    }
  ];

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about PNG to SVG conversion
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">
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