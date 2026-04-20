import React, { useState, useMemo } from 'react';
import type { StoryData, Language } from '../types';
import { Button } from './Button';
import { ART_STYLE_OPTIONS } from '../constants';

interface StyleChoiceScreenProps {
    onNext: (data: Partial<StoryData>) => void;
    onBack: () => void;
    storyData: StoryData;
    language: Language;
}

const StyleChoiceScreen: React.FC<StyleChoiceScreenProps> = ({ onNext, onBack, storyData, language }) => {
    const defaultStyle = storyData.selectedStyleNames?.[0] || ART_STYLE_OPTIONS[0].name;
    const [selectedStyleName, setSelectedStyleName] = useState<string>(defaultStyle);

    const selectedStyleObj = useMemo(() => 
        ART_STYLE_OPTIONS.find(s => s.name === selectedStyleName) || ART_STYLE_OPTIONS[0], 
    [selectedStyleName]);

    const handleNext = () => {
        if (!selectedStyleObj) return;
        onNext({
            selectedStyleNames: [selectedStyleObj.name],
            selectedStylePrompt: selectedStyleObj.prompt,
            styleReferenceImageBase64: '' // We don't have a personalized ref yet
        });
    };

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    // Helper to get a catchy subtitle from the prompt
    const getVibeSubtitle = (prompt: string) => prompt.split('.')[0] + '.';

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('الخطوة الثالثة: اختر أسلوب الرسم', 'Step 3: Choose Art Style')}</h2>
                <p className="text-lg text-brand-navy/80 max-w-2xl mx-auto">
                    {t('شاهد كيف ستبدو قصتك وتفاعل مع الأنماط المختلفة!', 'See exactly how your story will look with our unique art styles.')}
                </p>
            </div>

            {/* Top: Hero Presentation Area */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-white flex flex-col md:flex-row animate-fade-in relative z-10 w-full max-w-5xl mx-auto">
                <div className="w-full md:w-1/2 relative aspect-square md:aspect-auto md:min-h-[500px]">
                    <img 
                        src={selectedStyleObj.sampleUrl} 
                        alt="Style Preview" 
                        className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                        key={selectedStyleObj.name} // force re-render for animation
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/90 hidden md:block"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent md:hidden"></div>
                    
                    {selectedStyleObj.isLimitedTime && (
                        <div className="absolute top-8 left-[-40px] bg-red-500 text-white font-black py-2 px-14 transform -rotate-45 shadow-xl text-sm tracking-widest border-b-4 border-red-700">
                            {t('فترة محدودة!', 'LIMITED TIME!')}
                        </div>
                    )}
                </div>

                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-center md:text-left space-y-6 relative z-10">
                    <div className="inline-block px-4 py-1 bg-brand-orange/10 text-brand-orange font-bold rounded-full text-sm w-max mx-auto md:mx-0">
                        {t('معاينة الأسلوب', 'Style Preview')}
                    </div>
                    
                    <h3 className="text-4xl md:text-6xl font-extrabold text-brand-navy leading-tight" key={`title-${selectedStyleObj.name}`}>
                        {selectedStyleObj.name}
                    </h3>
                    
                    <div className="bg-white/80 p-6 rounded-3xl shadow-inner border border-white">
                        <p className="text-lg text-brand-navy/70 font-medium italic">
                            "{getVibeSubtitle(selectedStyleObj.prompt)}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom: The Selector Bar */}
            <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border border-white overflow-hidden w-full max-w-5xl mx-auto">
                <div className="flex overflow-x-auto pb-4 pt-2 px-2 gap-4 md:gap-8 snap-x justify-start lg:justify-center custom-scrollbar">
                    {ART_STYLE_OPTIONS.map(style => {
                        const isSelected = selectedStyleName === style.name;
                        return (
                            <button
                                key={style.name}
                                onClick={() => setSelectedStyleName(style.name)}
                                className={`flex flex-col items-center gap-3 transition-all duration-300 w-24 md:w-32 flex-shrink-0 snap-center outline-none ${
                                    isSelected ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                }`}
                                aria-pressed={isSelected}
                            >
                                <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden transition-all duration-500 ${
                                    isSelected 
                                        ? 'ring-[6px] ring-brand-orange ring-offset-[6px] ring-offset-transparent shadow-2xl' 
                                        : 'shadow-md border-4 border-white'
                                }`}>
                                    <img src={style.sampleUrl} alt={style.name} className="w-full h-full object-cover" />
                                </div>
                                <span className={`text-xs md:text-sm font-bold text-center leading-tight px-1 ${
                                    isSelected ? 'text-brand-orange' : 'text-brand-navy'
                                }`}>
                                    {style.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-2xl bg-white/50 border-white hover:bg-white">
                    {t('رجوع', 'Back')}
                </Button>
                <Button onClick={handleNext} className="text-xl px-16 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all bg-brand-orange text-white">
                    {t('التالي', 'Next')}
                </Button>
            </div>
        </div>
    );
};

export default StyleChoiceScreen;