import React from 'react';
import { FileImage, Github, Twitter, Menu } from 'lucide-react';

export const Navigation: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <FileImage className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-black">
              ConvertFlow
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-black transition-colors text-sm font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-black transition-colors text-sm font-medium">
              How it Works
            </a>
            <a href="#converter" className="text-gray-600 hover:text-black transition-colors text-sm font-medium">
              Converter
            </a>
            <a href="#faq" className="text-gray-600 hover:text-black transition-colors text-sm font-medium">
              FAQ
            </a>
          </div>
          
          {/* Right side */}
          <div className="flex items-center space-x-4">
            <a 
              href="#" 
              className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-md"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-md"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            
            {/* Mobile menu button */}
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-md">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};