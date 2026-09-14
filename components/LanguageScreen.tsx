
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import type { Language } from '../types';
import { HeroGallery } from './HeroGallery';

interface LanguageScreenProps {
  onSelect: (language: Language) => void;
}

const LanguageScreen: React.FC<LanguageScreenProps> = ({ onSelect }) => {
  const [detectedLang, setDetectedLang] = useState<Language>('ar');

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const navLangs = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
      for (const raw of navLangs) {
        if (!raw) continue;
        const code = raw.toLowerCase().split('-')[0];
        if (code === 'ar') {
          setDetectedLang('ar');
          return;
        }
        if (['en', 'de', 'tr', 'zh', 'ja', 'fr', 'es', 'it', 'pt', 'ru'].includes(code)) {
          setDetectedLang(code as Language);
          return;
        }
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <HeroGallery />

      <div className="text-center flex flex-col items-center justify-center space-y-6 text-brand-navy py-12 px-4 w-full">
        <div className="bg-[#FFF9F0]/90 backdrop-blur-xl border border-amber-200/80 shadow-2xl rounded-[2.5rem] p-6 sm:p-10 w-full max-w-3xl">
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange/15 to-brand-yellow/15 border border-brand-orange/20 px-4 py-1 rounded-full text-xs font-black text-brand-navy mb-4">
            <span>✨</span>
            <span>{detectedLang === 'ar' ? 'اللغة المقترحة: العربية 🇸🇦' : 'Suggested: English 🇺🇸'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            ابدأ مغامرتك السحرية / Begin Your Adventure
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-gray-600 mt-2 mx-auto">
            اختر لغة القصة المفضلة لطفلك لنبدأ في صياغة كتاب مطبوع فريد ومخصص بالكامل.
            <br />
            Choose your child's storybook language to begin crafting their personalized keepsake.
          </p>

          <div className="flex flex-col gap-6 mt-8 justify-center w-full max-w-xl mx-auto">
            {/* Primary Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <button
                onClick={() => onSelect('ar')}
                className={`py-4 px-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 border-2 ${
                  detectedLang === 'ar'
                    ? 'bg-gradient-to-r from-brand-orange to-brand-yellow text-white border-brand-orange shadow-xl shadow-brand-orange/25 scale-[1.02]'
                    : 'bg-white text-brand-navy border-amber-200 hover:border-brand-orange/50 hover:bg-amber-50/50'
                }`}
              >
                <span className="text-2xl">🇸🇦</span>
                <span>العربية</span>
              </button>

              <button
                onClick={() => onSelect('en')}
                className={`py-4 px-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 border-2 ${
                  detectedLang === 'en'
                    ? 'bg-gradient-to-r from-brand-teal to-teal-600 text-white border-brand-teal shadow-xl shadow-brand-teal/25 scale-[1.02]'
                    : 'bg-white text-brand-navy border-amber-200 hover:border-brand-teal/50 hover:bg-teal-50/40'
                }`}
              >
                <span className="text-2xl">🇺🇸</span>
                <span>English</span>
              </button>
            </div>

            {/* Language Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-amber-200/60" />
              </div>
              <div className="relative flex justify-center text-xs font-black uppercase tracking-wider">
                <span className="px-3 bg-[#FFF9F0] text-gray-500">Or choose another language</span>
              </div>
            </div>

            {/* Secondary Languages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                { code: 'es', label: 'Español', flag: '🇪🇸' },
                { code: 'fr', label: 'Français', flag: '🇫🇷' },
                { code: 'it', label: 'Italiano', flag: '🇮🇹' },
                { code: 'pt', label: 'Português', flag: '🇵🇹' },
                { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                { code: 'ja', label: '日本語', flag: '🇯🇵' },
                { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onSelect(lang.code as Language)}
                  className="px-3 py-2.5 bg-white/80 hover:bg-white border border-amber-200/70 hover:border-brand-orange/40 rounded-xl transition-all text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
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
