import React, { useState } from 'react';
import type { Language, StoryData } from '../types';
import { Button } from './Button';

interface ModeSelectionScreenProps {
  onNext: (data: Partial<StoryData>) => void;
  onBack: () => void;
  language: Language;
}

const ModeCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ title, description, icon, isSelected, onClick }) => (
  <button
    type="button"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`relative p-8 text-center rounded-3xl transition-all duration-300 h-full flex flex-col items-center justify-start border w-full md:w-80 group cursor-pointer ${
      isSelected
        ? 'bg-white shadow-2xl scale-105 border-brand-coral ring-4 ring-brand-coral/20'
        : 'bg-white/60 backdrop-blur-md hover:bg-white hover:scale-105 border-white/50 hover:border-brand-baby-blue hover:shadow-xl'
    }`}
    aria-pressed={isSelected}
  >
    {/* Floating Icon Background */}
    <div className={`p-4 rounded-full mb-6 transition-colors duration-300 ${isSelected ? 'bg-brand-coral/10 text-brand-coral' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-baby-blue/10 group-hover:text-brand-baby-blue'}`}>
        {icon}
    </div>
    
    <h3 className="text-2xl font-bold text-brand-navy mb-3">{title}</h3>
    <p className="text-base text-gray-600 leading-relaxed">{description}</p>
    
    {isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-brand-coral rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path></svg>
        </div>
    )}
  </button>
);

const IconClassic: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const IconPortals: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
);


const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ onNext, onBack, language }) => {
  const [selectedMode, setSelectedMode] = useState<'classic' | 'portals' | null>(null);
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleNext = () => {
    if (!selectedMode) return;
    onNext({ storyMode: selectedMode });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 text-center py-8">
      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('الخطوة الثانية: اختر وضع القصة', 'Step 2: Choose Your Story Mode')}</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
            {t('كيف تريد أن تصنع قصتك؟ اختر بين التجربة الكلاسيكية أو مغامرة البوابات السحرية الجديدة!', 'How would you like to create your story? Choose between the classic experience or our magical new portals adventure!')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 px-4">
        <ModeCard
          title={t('الوضع الكلاسيكي', 'Classic Mode')}
          description={t('اختر موضوعًا وأسلوبًا فنيًا واحدًا لإنشاء كتاب متناسق وجميل.', 'Choose a theme and a single art style to create a consistent, beautiful book.')}
          icon={<IconClassic />}
          isSelected={selectedMode === 'classic'}
          onClick={() => setSelectedMode('classic')}
        />
        <ModeCard
          title={t('بوابات العجائب', 'Portals of Wonder')}
          description={t('انطلق في رحلة سحرية عبر عوالم مختلفة، مع أسلوب فني جديد في كل صفحة!', 'Embark on a magical journey through different worlds, with a new art style on every page!')}
          icon={<IconPortals />}
          isSelected={selectedMode === 'portals'}
          onClick={() => setSelectedMode('portals')}
        />
      </div>

      <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-6">
        <Button onClick={onBack} variant="outline" className="text-xl px-10 py-4 rounded-xl border-2">
          {t('رجوع', 'Back')}
        </Button>
        <Button onClick={handleNext} className="text-xl px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow" disabled={!selectedMode}>
          {t('التالي', 'Next')}
        </Button>
      </div>
    </div>
  );
};

export default ModeSelectionScreen;