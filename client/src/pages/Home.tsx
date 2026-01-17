import React from "react";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { HowItWorks } from "../components/HowItWorks";
import { TechnicalSpecs } from "../components/TechnicalSpecs";
import { FAQ } from "../components/FAQ";
import { Navigation } from "../components/Navigation";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/converter");
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero onGetStarted={handleGetStarted} />
      <Features />
      <HowItWorks />
      <TechnicalSpecs />
      <FAQ />
      <Footer />
    </div>
  );
};
