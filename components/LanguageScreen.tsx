
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
          <div className="flex flex-col gap-6 mt-6 justify-center w-full max-w-2xl">
            {/* Primary Languages */}
            <div className="flex gap-4 justify-center w-full">
              <Button onClick={() => onSelect('ar')} className="text-2xl px-12 py-4 flex-1">
                العربية
              </Button>
              <Button onClick={() => onSelect('en')} variant="secondary" className="text-2xl px-12 py-4 flex-1">
                English
              </Button>
            </div>

            {/* Language Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500 uppercase">Or choose another language</span>
              </div>
            </div>

            {/* Secondary Languages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { code: 'de', label: 'Deutsch' },
                { code: 'es', label: 'Español' },
                { code: 'fr', label: 'Français' },
                { code: 'it', label: 'Italiano' },
                { code: 'pt', label: 'Português' },
                { code: 'ru', label: 'Русский' },
                { code: 'ja', label: '日本語' },
                { code: 'tr', label: 'Türkçe' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onSelect(lang.code as Language)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-brand-gold/10 hover:border-brand-gold transition-colors text-gray-700 font-medium"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageScreen;
