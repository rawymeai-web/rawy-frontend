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
    <div className="bg-[#FFF9F0] text-[#243A61] font-sans overflow-x-hidden min-h-screen flex flex-col relative">
      
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" id="container_hero_bg">
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-40 bg-[#006b5d]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(circle, rgba(144,244,224,0.4) 0%, rgba(144,244,224,0) 70%)' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40vw] h-[40vw] rounded-full blur-3xl opacity-60" style={{ background: 'radial-gradient(circle, rgba(236,193,86,0.3) 0%, rgba(236,193,86,0) 70%)' }}></div>
      </div>

      {/* Minimal Header */}
      <header className="sticky top-0 w-full px-8 py-4 flex justify-between items-center z-50 bg-white/45 backdrop-blur-xl border-b border-white/20">
        <div className="text-2xl font-bold tracking-tight cursor-pointer" id="logo_main">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#F78F50]">Rawy</span>
            <img alt="Rawy Logo Mark" className="h-8 w-auto" src="https://lh3.googleusercontent.com/aida/ADBb0uiU37jKUtd9D-SXxdy4sLzW228B-NSd_3jCVN5NoN5enUEcv9IBnCa9FZJKIJiGteMjGWFSr67qvi8-zXxw_a4CJkKfhOBieiOHmU0HRMNZ-dtg35rdVliBPPM4p1kXl4apYcqMzYcYErhTY8jxDQRDEA8EG_8Z62tU7MtYY7dVqVIusQJsGf6j--RVk2OJQlsbkXfVyUoACQ0dKE2TS9ALarMNrhD7xA1K67PdpcspMwTpmyOZ2YFtAe7R0Mp_9vrSiXZgPzTdKQ" />
          </div>
        </div>
        
        {/* Utility Area */}
        <div className="flex items-center gap-6 text-[#243A61]">
          <div className="relative flex items-center gap-1 cursor-pointer group" id="dropdown_header_lang">
            <span className="material-symbols-outlined text-[20px]">language</span>
            <span className="font-bold text-xs uppercase tracking-wider">EN</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
          <div className="relative flex items-center gap-1 cursor-pointer group" id="dropdown_header_currency">
            <span className="font-bold text-xs uppercase tracking-wider">USD</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
          <a className="font-bold text-xs uppercase tracking-wider hover:text-[#994709] transition-colors flex items-center gap-2" href="#" id="btn_nav_my_orders">
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span>My Stories</span>
          </a>
          <a className="opacity-30 hover:opacity-100 transition-opacity flex items-center" href="#" id="btn_admin_entry" title="Admin Dashboard">
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-6 py-12 md:py-24">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24">
          
          {/* Text Content */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
            <h1 className="text-[48px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#001a40]">
              Make Your Child the <span className="relative inline-block text-[#F78F50]">Hero<svg className="absolute -bottom-1 left-0 w-full h-2 text-[#F78F50]/40" preserveAspectRatio="none" viewBox="0 0 100 10"><path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4"></path></svg></span> of Their Own Story.
            </h1>
            <p className="text-[18px] font-medium leading-[1.6] text-[#554339] max-w-xl">
              Create magical, personalized adventures filled with wonder and imagination. A premium digital storytelling experience.
            </p>
            <button 
              onClick={onStart}
              className="text-[24px] font-bold py-4 px-10 rounded-full shadow-[0px_20px_40px_rgba(247,143,80,0.3)] hover:shadow-[0px_0px_30px_rgba(247,143,80,0.6)] hover:scale-105 transition-all duration-300 flex items-center gap-3 relative overflow-hidden group bg-[#F78F50] text-white" 
              id="btn_start_journey"
            >
              <span className="absolute inset-0 bg-white/10 blur-md top-0 h-1/2 rounded-t-full pointer-events-none"></span>
              <span>Create a Story Now</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
                    <img alt="The Brave Explorer Book Cover" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/ADBb0uijLCk6JFyniMpH4kIzIcei32lJWEv1_PAKsoL0ow7IyuUrQrFr_ghCdsf8abIwYu-9PspnJdzDT7CNyvHkV0aDPNce3MbTjJuBKhNyqjIzSKgGE1ywltyBoKGAqmzttzLGTwYsEUgPODRtbBQfGc9xgCNDlUP0XeYBiV6imQD8XpTc8reW2zT2mrp8r9bYGWitcT_xr-bmSVmf8K7JNJqoS_vs3bCWITCKCn0YnBOL38GpOe4Z-vby_V_lD5fzElsytTT5xEu9cA" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white">
                      <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">The Brave Explorer</h2>
                      <p className="text-xl italic opacity-90 drop-shadow-md">A Magical Journey</p>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent"></div>
                  </div>
                </div>

                {/* Slide 2 */}
                <div className={`transition-all duration-700 ease-in-out absolute inset-0 ${currentSlide === 1 ? 'opacity-100 relative z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div className="relative aspect-square w-full bg-white rounded-r-2xl shadow-2xl overflow-hidden border-l-8 border-[#193056]">
                    <img alt="Galactic Odyssey Book Cover" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrRq8W8BUoD5QUtwwV4vsA5qbx6tZRZuAxJ9B79d34slamnvsX6fmAeuEGB_z-vUr-F9qD_yF2iLchJHjbqbH6M_WCNzMXKB-2ZNRgY2OM7g8VNdaXxcbPUak0Y2onLxV1oZnmmzyIoYp5q8L6013FJVe9R7uMNKxYPV41y7YMglGqK5U6P3LAU8MV7LaGdEeViN7lYtApQrqlfiLhofJcqlAJTvkTZPfMR5HYijR1rpTkikGqOK2ax1KcZxknALKvDsRIbLHtc_Gp" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white">
                      <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">Galactic Odyssey</h2>
                      <p className="text-xl italic opacity-90 drop-shadow-md">Beyond the Stars</p>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent"></div>
                  </div>
                </div>

                {/* Slide 3 */}
                <div className={`transition-all duration-700 ease-in-out absolute inset-0 ${currentSlide === 2 ? 'opacity-100 relative z-10 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div className="relative aspect-square w-full bg-white rounded-r-2xl shadow-2xl overflow-hidden border-l-8 border-[#006b5d]">
                    <img alt="The Secret Garden Book Cover" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxeU3IgQw3FRNjyzBeQPuQ2TPrfLQB7Gj2uMBf6O-0Q5O-bwxFO4S-A153WQB8RvEoJJozxZO4bRAfRGhQVrG73Vxp19a1_gZswSRwKuhFB0N9YW2fJd5gM753DYg3Gljck9MrU0D84a0EdEBApWaLC0wEY--Rgf0P_e93zY9ZzRQ0qr1zVaalmm9WMjj-3IAtMO4d3YIfgtMlhRHCemJxjjV4O9GlcM6VoKFAlId2jHgxMenOT79FT7JHN1094swDfg0K-WT0wQQ1" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white">
                      <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">The Secret Garden</h2>
                      <p className="text-xl italic opacity-90 drop-shadow-md">Nature's Whisper</p>
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

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-200/50 bg-[#FFF9F0]/80 backdrop-blur-md z-10 relative mt-auto px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none bg-white/45 backdrop-blur-xl border-[1.5px] border-white/40 rounded-full py-2 pl-4 pr-10 font-medium text-[#001a40] focus:outline-none focus:ring-2 focus:ring-[#f78f50] shadow-sm cursor-pointer" 
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#554339]">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
          <div className="font-bold text-xs uppercase tracking-wider text-[#554339] flex gap-6">
            <a className="hover:text-[#f78f50] transition-colors" href="#">Terms</a>
            <a className="hover:text-[#f78f50] transition-colors" href="#">Privacy</a>
          </div>
          <div className="font-bold text-xs uppercase tracking-wider text-[#554339]">
            © 2024 Rawy Storyweaver. Magical moments crafted with AI.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
