import React, { useState, useEffect } from 'react';
import type { Language } from '../types';

interface WelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const COVER_METADATA = [
  {
    src: '/covers/cover2.png',
    title: 'The Hope Probe Mission',
    subtitle: 'Beyond the Stars to Mars',
    border: 'border-[#193056]'
  },
  {
    src: '/covers/cover3.png',
    title: '1001 Nights Magic',
    subtitle: 'The Flying Carpet Adventure',
    border: 'border-[#006b5d]'
  },
  {
    src: '/covers/cover4.png',
    title: 'Deep Blue Odyssey',
    subtitle: 'Secrets of the Coral Reef',
    border: 'border-[#0f547c]'
  },
  {
    src: '/covers/cover5.png',
    title: 'The Dinosaur Valley',
    subtitle: 'Land of the Gentle Giants',
    border: 'border-[#4b6a15]'
  },
  {
    src: '/covers/cover6.png',
    title: 'Whispering Woods',
    subtitle: 'The Forest of Talking Animals',
    border: 'border-[#8f5a1d]'
  },
  {
    src: '/covers/cover7.png',
    title: 'Skyward Balloonist',
    subtitle: 'Floating Above the Clouds',
    border: 'border-[#e69b00]'
  },
  {
    src: '/covers/cover8.png',
    title: 'The Crystal Kingdom',
    subtitle: 'Quest for the Ice Palace',
    border: 'border-[#1c4b75]'
  }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, language, setLanguage }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % COVER_METADATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="text-[#243A61] font-sans overflow-x-hidden flex flex-col relative w-full">
      
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" id="container_hero_bg">
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-40 bg-[#006b5d]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(circle, rgba(144,244,224,0.4) 0%, rgba(144,244,224,0) 70%)' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40vw] h-[40vw] rounded-full blur-3xl opacity-60" style={{ background: 'radial-gradient(circle, rgba(236,193,86,0.3) 0%, rgba(236,193,86,0) 70%)' }}></div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-6 py-6 md:py-12">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24">
          
          {/* Text Content */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
            <h1 className="text-[48px] text-[#001a40] apple-display-heading">
              Make Your Child the <span className="relative inline-block text-[#F78F50]">Hero<svg className="absolute -bottom-1 left-0 w-full h-2 text-[#F78F50]/40" preserveAspectRatio="none" viewBox="0 0 100 10"><path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4"></path></svg></span> of Their Own Story.
            </h1>
            <p className="text-[18px] font-medium leading-[1.6] text-[#554339] max-w-xl apple-body-text">
              Create magical, personalized adventures filled with wonder and imagination. A premium digital storytelling experience.
            </p>
            <button 
              onClick={onStart}
              className="text-[24px] font-bold py-4 px-10 rounded-full shadow-sm hover:shadow-[0px_10px_25px_rgba(247,143,80,0.45)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center gap-3 relative overflow-hidden group bg-[#F78F50] text-white" 
              id="btn_start_journey"
            >
              <span className="absolute inset-0 bg-white/10 blur-md top-0 h-1/2 rounded-t-full pointer-events-none"></span>
              <span>Create a Story Now</span>
            </button>
          </div>

          {/* Hero Image / Illustration Area */}
          <div className="flex-grow w-full max-w-md md:max-w-xl relative aspect-square" id="hero_carousel">
            <div className="relative group overflow-visible w-full h-full">
              
              {/* Book Shadow/Depth (Global) */}
              <div className="absolute inset-0 bg-black/20 rounded-r-2xl blur-xl transform translate-x-4 translate-y-4"></div>
              
              {/* Slides Container */}
              <div className="relative w-full h-full overflow-hidden rounded-r-2xl shadow-2xl">
                {COVER_METADATA.map((cover, index) => (
                  <div 
                    key={index} 
                    className={`transition-all duration-700 ease-in-out absolute inset-0 ${currentSlide === index ? 'opacity-100 relative z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                  >
                    <div className={`relative w-full h-full bg-white border-l-8 ${cover.border} overflow-hidden`}>
                      <img alt={cover.title} className="absolute inset-0 w-full h-full object-cover" src={cover.src} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white">
                        <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">{cover.title}</h2>
                        <p className="text-xl italic opacity-90 drop-shadow-md">{cover.subtitle}</p>
                      </div>
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-8 flex-wrap relative z-20">
                {COVER_METADATA.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setCurrentSlide(index)} 
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-[#F78F50] w-6' : 'bg-slate-300'}`}
                  ></button>
                ))}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
