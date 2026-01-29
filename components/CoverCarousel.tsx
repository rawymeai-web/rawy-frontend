import React from 'react';
import { coverImageData } from './coverImageData';

export const CoverCarousel: React.FC = () => {
  const images = coverImageData;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center space-x-8 px-4 sm:px-8 py-4">
        {images.map((src, index) => (
          <div key={index} className="flex-shrink-0">
            <img
              src={src}
              alt={`Book cover ${index + 1}`}
              className="h-64 sm:h-80 w-auto rounded-lg shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
};