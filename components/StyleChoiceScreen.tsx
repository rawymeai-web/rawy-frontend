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

const StyleCard: React.FC<{
    style: typeof ART_STYLE_OPTIONS[0];
    isSelected: boolean;
    onClick: () => void;
    language: Language;
}> = ({ style, isSelected, onClick, language }) => (
    <button
        onClick={onClick}
        className={`relative p-3 text-center rounded-2xl transition-all duration-300 h-full flex flex-col items-center justify-start w-full group ${isSelected
            ? 'bg-white shadow-2xl ring-4 ring-brand-orange scale-105 z-10'
            : 'bg-white/60 backdrop-blur-md hover:bg-white hover:scale-105 border border-white/50'
            }`}
        aria-pressed={isSelected}
    >
        <div className="relative aspect-square w-full bg-gray-100/50 rounded-xl flex items-center justify-center mb-4 overflow-hidden shadow-inner">
            <img
                src={style.sampleUrl}
                alt={style.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {isSelected && (
                <div className="absolute inset-0 bg-brand-orange/20 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-white text-brand-orange rounded-full p-2 shadow-lg transform scale-125">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                </div>
            )}
        </div>
        <h4 className={`font-bold text-sm md:text-base leading-tight transition-colors ${isSelected ? 'text-brand-orange' : 'text-brand-navy'}`}>{style.name}</h4>
    </button>
);

const CATEGORIES = [
    { id: 'all', label: { ar: 'الكل', en: 'All' } },
    { id: 'painterly', label: { ar: 'رسم يدوي', en: 'Painterly & Soft' } },
    { id: '3d', label: { ar: 'سينمائي 3D', en: '3D & Cinematic' } },
    { id: 'graphic', label: { ar: 'حديث وجرافيك', en: 'Modern & Graphic' } },
    { id: 'textured', label: { ar: 'مبتكر', en: 'Creative & Textured' } },
];

const StyleChoiceScreen: React.FC<StyleChoiceScreenProps> = ({ onNext, onBack, storyData, language }) => {
    const [selectedStyleName, setSelectedStyleName] = useState<string | null>(storyData.selectedStyleNames?.[0] || null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const handleNext = () => {
        const selected = ART_STYLE_OPTIONS.find(s => s.name === selectedStyleName);
        if (!selected) {
            alert(language === 'ar' ? 'الرجاء اختيار أسلوب رسم.' : 'Please select an art style.');
            return;
        }
        onNext({
            selectedStyleNames: [selected.name],
            selectedStylePrompt: selected.prompt,
            styleReferenceImageBase64: '' // We don't have a personalized ref yet
        });
    };

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const filteredStyles = useMemo(() => {
        if (selectedCategory === 'all') return ART_STYLE_OPTIONS;
        // @ts-ignore - category is added in constants but ts might definition might be lagging in types.ts if strict
        return ART_STYLE_OPTIONS.filter(s => s.category === selectedCategory);
    }, [selectedCategory]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('الخطوة الثالثة: فئات الرسم', 'Step 3: Art Categories')}</h2>
                <p className="text-lg text-brand-navy/80 max-w-2xl mx-auto">
                    {t('اختر الفئة الفنية التي تفضلها. في الخطوة التالية، سنقوم بإنشاء معاينات مخصصة لك!', 'Pick your favorite art category. In the next step, we will create personalized previews for you!')}
                </p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat.id
                            ? 'bg-brand-orange text-white shadow-lg scale-105'
                            : 'bg-white text-gray-500 hover:bg-orange-50 hover:text-brand-orange'
                            }`}
                    >
                        {cat.label[language]}
                    </button>
                ))}
            </div>

            <div className="p-8 bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 min-h-[500px]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-fade-in">
                    {filteredStyles.map(style => (
                        <StyleCard
                            key={style.name}
                            style={style}
                            isSelected={selectedStyleName === style.name}
                            onClick={() => setSelectedStyleName(style.name)}
                            language={language}
                        />
                    ))}
                </div>
                {filteredStyles.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        {t('لا توجد أنماط في هذه الفئة', 'No styles found in this category')}
                    </div>
                )}
            </div>

            <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-6">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-2xl bg-white/50 border-white hover:bg-white">
                    {t('رجوع', 'Back')}
                </Button>
                <Button onClick={handleNext} className="text-xl px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" disabled={!selectedStyleName}>
                    {t('التالي', 'Next')}
                </Button>
            </div>
        </div>
    );
};

export default StyleChoiceScreen;