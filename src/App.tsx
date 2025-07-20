import React, { useRef, useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { ConverterSection } from "./components/ConverterSection";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { Documentation } from "./components/Documentation";
import { Analytics } from "@vercel/analytics/react";

function App() {
  const converterRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState<'home' | 'docs'>('home');

  const scrollToConverter = () => {
    converterRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showDocs = () => {
    setCurrentView('docs');
  };

  const showHome = () => {
    setCurrentView('home');
  };

  // Handle URL-based navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/docs') {
        setCurrentView('docs');
      } else {
        setCurrentView('home');
      }
    };

    // Set initial view based on URL
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when view changes
  useEffect(() => {
    const path = currentView === 'docs' ? '/docs' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [currentView]);

  if (currentView === 'docs') {
    return (
      <div className="min-h-screen">
        <Analytics />
        <Documentation onBack={showHome} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Analytics />
      <Navigation onDocsClick={showDocs} />
      <Hero onGetStarted={scrollToConverter} />
      <Features />
      <HowItWorks />
      <div ref={converterRef}>
        <ConverterSection />
      </div>
      <FAQ />
      <Footer />
    </div>
  );
}

export default App;
