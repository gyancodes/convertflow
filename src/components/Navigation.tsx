import React, { useState, useEffect } from 'react';
import { FileImage, Github, Twitter, Menu, X } from 'lucide-react';

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside or on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#converter', label: 'Converter' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <>
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
              {navLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href} 
                  className="text-gray-600 hover:text-black transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
            
            {/* Right side */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/gyancodes/convertflow" 
                className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-md"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </a>
             
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 hover:bg-gray-100 rounded-md mobile-menu-button"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          
          {/* Mobile Menu */}
          <div className="mobile-menu fixed top-0 right-0 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                    <FileImage className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-black">
                    ConvertFlow
                  </span>
                </div>
                <button 
                  onClick={closeMobileMenu}
                  className="p-2 hover:bg-gray-100 rounded-md"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 py-6">
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block px-6 py-3 text-gray-700 hover:text-black hover:bg-gray-50 transition-colors font-medium"
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <a 
                    href="https://github.com/gyancodes/convertflow" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-5 h-5" />
                    <span className="text-sm">GitHub</span>
                  </a>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    © 2025 ConvertFlow. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};