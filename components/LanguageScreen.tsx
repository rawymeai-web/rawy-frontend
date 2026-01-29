
import React from 'react';
import { Button } from './Button';
import type { Language } from '../types';
import { HeroGallery } from './HeroGallery';

interface LanguageScreenProps {
  onSelect: (language: Language) => void;
}

const LanguageScreen: React.FC<LanguageScreenProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center w-full">
      <HeroGallery />
      
      <div className="text-center flex flex-col items-center justify-center space-y-6 text-brand-navy py-16 w-full">
        <div className="bg-gray-50/90 backdrop-blur-sm shadow-lg p-8 w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold whitespace-nowrap text-center">
            ابدأ مغامرتك السحرية / Begin Your Magical Adventure
          </h2>
          <p className="max-w-3xl text-lg text-gray-700 mt-4 mx-auto text-center">
            Every great story has a beginning. Choose the language of your adventure, and let's start writing a tale that's uniquely yours with Rawy.
            <br />
            كل قصة عظيمة لها بداية. اختر لغة مغامرتك، ودعنا نبدأ في كتابة حكاية فريدة من نوعها لك مع راوي.
          </p>
          <div className="flex gap-4 mt-6 justify-center">
            <Button onClick={() => onSelect('ar')} className="text-2xl px-12 py-4">
              العربية
            </Button>
            <Button onClick={() => onSelect('en')} variant="secondary" className="text-2xl px-12 py-4">
              English
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageScreen;
