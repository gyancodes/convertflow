import React from 'react';
import { FileImage,  Github, } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-tr from-gray-900 via-gray-950 to-blue-950 text-white py-16 relative overflow-hidden">
      {/* Decorative blurred gradient circles */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-700 opacity-30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-700 opacity-20 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-600 to-fuchsia-500 rounded-xl shadow-lg">
                  <FileImage className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight drop-shadow">
                  ConvertFlow
                </span>
              </div>
              <p className="text-gray-300 mb-8 max-w-lg leading-relaxed text-lg">
                Effortlessly convert PNG to SVG with stunning accuracy. Fast, secure, and always free—designed for creators who care about quality.
              </p>
            </div>
            <div className="flex items-center space-x-5 mt-2">
              <a href="#" aria-label="GitHub" className="hover:scale-110 transition-transform hover:text-blue-400">
                <Github className="w-6 h-6" />
              </a>
              {/* <a href="#" aria-label="Twitter" className="hover:scale-110 transition-transform hover:text-blue-400">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" aria-label="Email" className="hover:scale-110 transition-transform hover:text-blue-400">
                <Mail className="w-6 h-6" />
              </a> */}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-lg tracking-wide">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  How it Works
                </a>
              </li>
              <li>
                <a href="#converter" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  Converter
                </a>
              </li>
              <li>
                <a href="#faq" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          {/* <div>
            <h3 className="font-semibold text-white mb-5 text-lg tracking-wide">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-400 hover:text-white transition-colors">
                  <span className="w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  Terms of Service
                </a>
              </li>
            </ul>
          </div> */}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 <span className="font-semibold text-white">ConvertFlow</span>. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>Made with ❣️</span>
              
              <span>for</span>
              <span className="font-semibold text-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              creators
              </span>
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};