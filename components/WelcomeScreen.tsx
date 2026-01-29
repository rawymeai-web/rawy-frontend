
import React from 'react';
import { Button } from './Button';
import type { Language } from '../types';
import { HeroGallery } from './HeroGallery';

interface WelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
  language: Language;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onBack, language }) => {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="flex flex-col items-center w-full min-h-screen relative overflow-hidden bg-brand-white">

      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-teal/10 rounded-full blur-[120px] animate-float delay-1000"></div>

      {/* Main Content Area */}
      <div className="w-full flex-grow flex flex-col items-center justify-center relative z-10 pt-8 pb-20">

        {/* 3D Gallery - Now the Hero centerpiece */}
        <div className="w-full mb-2 scale-110 md:scale-100">
          <HeroGallery />
        </div>

        {/* Content Card */}
        <div className="relative z-10 w-full max-w-4xl px-6 text-center -mt-10">
          <div className="inline-block mb-4">
            <h1 className="text-7xl md:text-9xl font-black text-brand-navy font-fancy tracking-tighter drop-shadow-sm mb-4">
              {t('Rawy', 'Rawy')}
            </h1>
            <div className="h-3 w-32 bg-brand-orange rounded-full mx-auto shadow-lg shadow-brand-orange/30"></div>
          </div>

          <h3 className="text-2xl md:text-4xl text-brand-navy/90 font-bold mb-6 font-sans leading-tight">
            {t('حيث يصبح كل طفل بطلاً', 'Where Every Child Becomes the Hero')}
          </h3>

          <p className="max-w-xl text-lg md:text-xl text-gray-600 leading-relaxed mx-auto mb-10 font-medium">
            {t('لنصنع معًا قصة أطفال فريدة من نوعها لطفلك! حوّل مشاعرك إلى حكاية خالدة في دقائق.', "Let's create a unique story for your child! Turn your emotions into a timeless tale in minutes.")}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">

            <Button onClick={onStart} className="text-xl md:text-2xl px-12 py-5 w-full sm:w-auto shadow-xl shadow-brand-orange/30 hover:shadow-brand-orange/50 hover:scale-105 transition-all rounded-[2rem] bg-gradient-to-r from-brand-orange to-red-400 border-none">
              <span className="drop-shadow-md">{t('بـدء المـغـامـرة ✨', "Start Adventure ✨")}</span>
            </Button>

            {/* Secondary Action - Optional (e.g., How it Works?) */}
            <button onClick={() => { }} className="text-brand-teal font-bold hover:underline text-lg">
              {t('كيف يعمل؟', 'How does it work?')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
