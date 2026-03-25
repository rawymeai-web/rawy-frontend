
import React from 'react';
import { Button } from './Button';
import type { Language } from '../types';
import { HeroGallery } from './HeroGallery';

interface WelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onBack, language, setLanguage }) => {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="flex flex-col items-center w-full min-h-screen relative overflow-hidden bg-brand-white">

      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-teal/10 rounded-full blur-[120px] animate-float delay-1000"></div>



      {/* Main Content Area */}
      <div className="w-full h-screen flex flex-col xl:flex-row items-center justify-center relative z-10 p-4 max-w-7xl mx-auto gap-2 xl:gap-12">

        {/* 3D Gallery - Left Side on Desktop, Top on Mobile (Scaled down) */}
        <div className="w-full xl:w-1/2 max-w-2xl mx-auto scale-[0.5] sm:scale-[0.6] xl:scale-[0.85] origin-center -mt-32 sm:-mt-20 xl:mt-0 xl:origin-right">
          <HeroGallery />
        </div>

        {/* Content Card - Right Side on Desktop */}
        <div className="relative z-10 w-full xl:w-1/2 px-4 text-center xl:text-right flex flex-col justify-center -mt-32 sm:-mt-16 xl:mt-0">
          <div className="inline-block mb-2">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-brand-navy font-fancy tracking-tighter drop-shadow-sm mb-2">
              {t('Rawy', 'Rawy')}
            </h1>
            <div className="h-2 w-24 xl:ml-auto bg-brand-orange rounded-full shadow-lg shadow-brand-orange/30 xl:mr-0 mx-auto"></div>
          </div>

          <h3 className="text-xl md:text-3xl text-brand-navy/90 font-bold mb-3 font-sans leading-tight">
            {t('حيث يصبح كل طفل بطلاً', 'Where Every Child Becomes the Hero')}
          </h3>

          <p className="max-w-lg text-base md:text-lg text-gray-600 leading-relaxed mx-auto mb-6 font-medium">
            {t('اختر لغة مغامرتك للبدء في صنع حكايتك مع راوي.', "Choose the language of your adventure to start creating your tale with Rawy.")}
          </p>

          <div className="flex flex-col gap-4 justify-center w-full max-w-xl mx-auto">
            {/* Primary Languages */}
            <div className="flex gap-3 justify-center w-full">
              <Button onClick={() => { setLanguage('ar'); onStart(); }} className="text-lg md:text-xl px-8 py-3 flex-1 shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 hover:-translate-y-1 transition-all rounded-[1.5rem] bg-gradient-to-r from-brand-orange to-red-400 border-none">
                العربية
              </Button>
              <Button onClick={() => { setLanguage('en'); onStart(); }} variant="secondary" className="text-lg md:text-xl px-8 py-3 flex-1 shadow-lg shadow-gray-200/50 hover:shadow-gray-300/50 hover:-translate-y-1 transition-all rounded-[1.5rem]">
                English
              </Button>
            </div>

            {/* Language Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-brand-white text-gray-400 uppercase tracking-widest text-xs font-bold">{t('أو لغة أخرى', 'Or another language')}</span>
              </div>
            </div>

            {/* Secondary Languages Grid */}
            <div className="grid grid-cols-4 gap-2">
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
                  onClick={() => { setLanguage(lang.code as Language); onStart(); }}
                  className="px-2 py-2 text-sm bg-white/60 backdrop-blur-sm border border-brand-navy/10 rounded-xl hover:bg-brand-orange/5 hover:border-brand-orange/30 hover:text-brand-orange transition-all text-gray-600 font-bold shadow-sm hover:shadow-md"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {/* Secondary Action - Optional (e.g., How it Works?) */}
            <button onClick={() => { }} className="text-brand-teal font-bold hover:underline text-base">
              {t('كيف يعمل؟', 'How does it work?')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
