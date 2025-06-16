import React, { useRef } from "react";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { ConverterSection } from "./components/ConverterSection";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";

function App() {
  const converterRef = useRef<HTMLDivElement>(null);

  const scrollToConverter = () => {
    converterRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Analytics />
      <Navigation />
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
