import React from 'react';
import { FileImage, Github, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                <FileImage className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-semibold">ConvertFlow</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Convert PNG to SVG with precision. Fast, secure, and always free.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/gyancodes/convertflow" 
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-900 rounded-md"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
             
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#converter" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Converter
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 ConvertFlow. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Made with ❤️ for creators
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};