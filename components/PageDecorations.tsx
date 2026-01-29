
import React from 'react';

export const PageDecorations: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft Gradient Background Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-orange-50/30"></div>

      {/* Animated Blob 1: Rawy Orange */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rawy-orange/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70"></div>
      
      {/* Animated Blob 2: Rawy Teal */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-rawy-green/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-70"></div>
      
      {/* Animated Blob 3: Rawy Yellow */}
      <div className="absolute -bottom-32 left-[20%] w-[500px] h-[500px] bg-rawy-yellow/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-60"></div>

      {/* Animated Blob 4: Rawy Navy Accent */}
      <div className="absolute bottom-[-20%] right-[-5%] w-[400px] h-[400px] bg-rawy-navy/5 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-6000"></div>
    </div>
  );
};

export default PageDecorations;
