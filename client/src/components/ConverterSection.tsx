import React from 'react';
import { ProfessionalConverter } from './converter/ProfessionalConverter';

export const ConverterSection: React.FC = () => {
  return (
    <section id="converter" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <ProfessionalConverter />
      </div>
    </section>
  );
};