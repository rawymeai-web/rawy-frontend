import React, { useState, useEffect } from 'react';
import type { Language } from '../types';

interface WelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, language, setLanguage }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
          <div className="flex-1 w-full max-w-md md:max-w-xl relative" id="hero_carousel">
            <div className="relative group overflow-visible">
              
              {/* Book Shadow/Depth (Global) */}
              <div className="absolute inset-0 bg-black/20 rounded-r-2xl blur-xl transform translate-x-4 translate-y-4"></div>
              
              {/* Slides Container */}
              <div className="relative w-full overflow-hidden">
                
                {/* Slide 1 */}
                <div className={`transition-all duration-700 ease-in-out absolute inset-0 ${currentSlide === 0 ? 'opacity-100 relative z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div className="relative aspect-square w-full bg-white rounded-r-2xl shadow-2xl overflow-hidden border-l-8 border-[#994709]">
                    <img alt="The Lost City of Ubar Book Cover" className="absolute inset-0 w-full h-full object-cover" src="/covers/cover1.png" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white">
                      <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">The Lost City of Ubar</h2>
                      <p className="text-xl italic opacity-90 drop-shadow-md">A Desert Treasure Hunt</p>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent"></div>
                  </div>
                </div>

                {/* Slide 2 */}
                <div className={`transition-all duration-700 ease-in-out absolute inset-0 ${currentSlide === 1 ? 'opacity-100 relative z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div className="relative aspect-square w-full bg-white rounded-r-2xl shadow-2xl overflow-hidden border-l-8 border-[#193056]">
                    <img alt="The Hope Probe Mission Book Cover" className="absolute inset-0 w-full h-full object-cover" src="/covers/cover2.png" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white">
                      <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">The Hope Probe Mission</h2>
                      <p className="text-xl italic opacity-90 drop-shadow-md">Beyond the Stars to Mars</p>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent"></div>
                  </div>
                </div>

                {/* Slide 3 */}
                <div className={`transition-all duration-700 ease-in-out absolute inset-0 ${currentSlide === 2 ? 'opacity-100 relative z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div className="relative aspect-square w-full bg-white rounded-r-2xl shadow-2xl overflow-hidden border-l-8 border-[#006b5d]">
                    <img alt="1001 Nights Magic Book Cover" className="absolute inset-0 w-full h-full object-cover" src="/covers/cover3.png" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white">
                      <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">1001 Nights Magic</h2>
                      <p className="text-xl italic opacity-90 drop-shadow-md">The Flying Carpet Adventure</p>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent"></div>
                  </div>
                </div>

              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-3 mt-8">
                <button 
                  onClick={() => setCurrentSlide(0)} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 0 ? 'bg-[#F78F50] w-6' : 'bg-slate-300'}`}
                ></button>
                <button 
                  onClick={() => setCurrentSlide(1)} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'bg-[#F78F50] w-6' : 'bg-slate-300'}`}
                ></button>
                <button 
                  onClick={() => setCurrentSlide(2)} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 2 ? 'bg-[#F78F50] w-6' : 'bg-slate-300'}`}
                ></button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
