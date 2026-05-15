import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { getGuidelineComponentsForTheme } from '../services/storyGuidelines';
import { getStyleForWriteYourOwn } from '../constants';
import type { StoryData, Language, StoryTheme } from '../types';
import { backendApi } from '../services/backendApi';

interface ThemeScreenProps {
  onNext: (data: Partial<StoryData>) => void;
  onBack: () => void;
  storyData: StoryData;
  language: Language;
}

const ValuesCategoryIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-coral" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const AdventuresCategoryIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v.01M12 12v.01M12 16v.01M12 4a8 8 0 00-8 8h16a8 8 0 00-8-8z" />
  </svg>
);

const LightbulbIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707.707M12 21v-1m0-16a5 5 0 00-5 5c0 2.21 1.79 4 4 4h2c2.21 0 4-1.79 4-4a5 5 0 00-5-5z" />
  </svg>
);

interface ThemeCardProps {
  emoji: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ emoji, title, description, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`relative p-8 rounded-[2.5rem] transition-all duration-500 flex flex-col items-center justify-center group overflow-hidden ${isSelected
      ? 'bg-brand-orange text-white shadow-2xl shadow-brand-orange/30 scale-[1.02] z-10'
      : 'glass-panel bg-white/30 hover:bg-white/60 hover:shadow-xl hover:-translate-y-2'
      }`}
    aria-pressed={isSelected}
  >
    {/* Selection Glow */}
    {isSelected && (
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
    )}
    
    <div className={`text-6xl mb-6 transition-all duration-500 ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-3'}`} role="img">{emoji}</div>
    <h4 className={`font-black text-xl leading-tight mb-3 transition-colors ${isSelected ? 'text-white' : 'text-brand-navy'}`}>{title}</h4>
    <p className={`text-xs font-medium leading-relaxed opacity-80 max-w-[150px] mx-auto ${isSelected ? 'text-white/90' : 'text-brand-navy/60'}`}>{description}</p>

    {isSelected ? (
      <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
        <span className="material-symbols-outlined text-white text-lg">check_circle</span>
      </div>
    ) : (
      <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="material-symbols-outlined text-brand-orange text-lg">arrow_forward</span>
      </div>
    )}
  </button>
);

const ThemeScreen: React.FC<ThemeScreenProps> = ({ onNext, onBack, storyData, language }) => {
  const [themes, setThemes] = useState<StoryTheme[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(storyData.themeId || null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(!!storyData.customGoal);
  const [customTitle, setCustomTitle] = useState(storyData.title);
  const [customGoal, setCustomGoal] = useState(storyData.customGoal || '');
  const [customChallenge, setCustomChallenge] = useState(storyData.customChallenge || '');
  const [customStoryText, setCustomStoryText] = useState(storyData.customStoryText || '');
  const [customIllustrationNotes, setCustomIllustrationNotes] = useState(storyData.customIllustrationNotes || '');
  const [customStylePrompt, setCustomStylePrompt] = useState(storyData.selectedStylePrompt || '');
  const [secondHeroName, setSecondHeroName] = useState((storyData.secondCharacter as any)?.name || '');

  useEffect(() => {
    backendApi.getCatalog().then((res: any) => {
      setThemes(res.themes);
      setIsLoadingCatalog(false);
    }).catch(err => {
      console.error("Failed to fetch catalog", err);
      setIsLoadingCatalog(false);
    });
  }, []);

  useEffect(() => {
    if (isAdvancedMode && !customStylePrompt) {
      setCustomStylePrompt(getStyleForWriteYourOwn(storyData.childAge));
    }
  }, [isAdvancedMode, storyData.childAge, customStylePrompt]);

  const getTranslation = (obj: any, lang: string): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj['en'] || Object.values(obj)[0] || '';
  };

  const handleThemeClick = (themeOption: StoryTheme) => {
    setSelectedThemeId(themeOption.id);
    setCustomTitle(getTranslation(themeOption.title, language));
    const components = getGuidelineComponentsForTheme(themeOption.id);
    if (components) {
      setCustomGoal(components.goal);
      setCustomChallenge(components.challenge);
      setCustomIllustrationNotes(components.illustrationNotes);
    } else if (themeOption.skeleton) {
      const cores = themeOption.skeleton.storyCores || [];
      const challenges = themeOption.skeleton.limiters || themeOption.skeleton.catalysts || [];
      setCustomGoal(cores.length ? cores[Math.floor(Math.random() * cores.length)] : '');
      setCustomChallenge(challenges.length ? challenges[Math.floor(Math.random() * challenges.length)] : '');
      setCustomIllustrationNotes(themeOption.visualDNA || '');
    } else {
      setCustomGoal('');
      setCustomChallenge('');
      setCustomIllustrationNotes('');
    }
  };

  const handleCustomChange = () => setSelectedThemeId(null);

  const handleNextClick = () => {
    const selectedPredefinedTheme = themes.find(t => t.id === selectedThemeId);
    const finalThemeDescription = selectedPredefinedTheme
      ? getTranslation(selectedPredefinedTheme.description, language)
      : `A story where the hero wants to '${customGoal}', but faces the challenge of '${customChallenge}'.`;

    let finalStylePrompt = storyData.selectedStylePrompt;
    if (isAdvancedMode && !selectedThemeId && customStylePrompt) {
      finalStylePrompt = customStylePrompt;
    }

    onNext({
      title: customTitle,
      theme: finalThemeDescription,
      themeId: selectedPredefinedTheme?.id,
      themeVisualDNA: selectedPredefinedTheme?.visualDNA || "",
      customGoal,
      customChallenge,
      customStoryText,
      customIllustrationNotes,
      selectedStylePrompt: finalStylePrompt,
      isCustomTheme: isCustomMode || !!customGoal || !!customChallenge,
      ...(selectedThemeId === 'val-teamwork' && secondHeroName ? {
        secondCharacter: {
          name: secondHeroName,
          type: 'person',
          images: [],
          imageBases64: [],
          description: 'The second hero joining the adventure.'
        }
      } : {})
    });
  };

  const t = (arText: string, enText: string) => language === 'ar' ? arText : enText;

  const ThemeGrid = ({ themes, categoryTitle, icon }: { themes: StoryTheme[], categoryTitle: string, icon: string }) => (
    <div className="mb-16">
      <div className="flex items-center gap-4 mb-8 px-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
           <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <div>
           <h3 className="text-2xl font-black text-brand-navy">{categoryTitle}</h3>
           <p className="text-[10px] font-black text-brand-navy/30 uppercase tracking-[0.2em]">{t('اختر عالم مغامرتك', 'CHOOSE YOUR WORLD')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
        {themes.map((themeOption) => (
          <ThemeCard
            key={themeOption.id}
            emoji={themeOption.emoji}
            title={getTranslation(themeOption.title, language)}
            description={getTranslation(themeOption.description, language)}
            isSelected={selectedThemeId === themeOption.id}
            onClick={() => handleThemeClick(themeOption)}
          />
        ))}
      </div>
    </div>
  );

  const adventureThemes = themes.filter(t => t.category === 'adventures');
  const valueThemes = themes.filter(t => t.category === 'values');
  const isCustomMode = selectedThemeId === null;
  const isTeamworkSelected = selectedThemeId === 'val-teamwork';

  const isNextDisabled = !customTitle ||
    (isAdvancedMode && isCustomMode && (!customGoal || !customChallenge)) ||
    (!isAdvancedMode && !selectedThemeId) ||
    (isTeamworkSelected && !secondHeroName);

  if (isLoadingCatalog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6 animate-pulse">
        <div className="w-20 h-20 rounded-full border-4 border-brand-orange/20 border-t-brand-orange animate-spin"></div>
        <p className="text-brand-navy font-black tracking-widest uppercase text-xs">{t('جاري تحميل المواضيع...', 'Unlocking Magic Worlds...')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-enter-forward">
      
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal/10 rounded-full mb-2">
           <span className="material-symbols-outlined text-brand-teal text-sm">auto_stories</span>
           <span className="text-xs font-bold text-brand-teal tracking-widest uppercase">{t('المواضيع والقصص', 'STORY THEMES')}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-brand-navy leading-tight">
          {t('اختر ', 'Pick a ')}
          <span className="text-brand-orange">{t('مغامرتك', 'Theme')}</span>
          {t(' المفضلة', ' for your story')}
        </h2>
      </div>

      <div className="space-y-4">
        {valueThemes.length > 0 && <ThemeGrid themes={valueThemes} categoryTitle={t('قيم وأخلاق', 'Life Values')} icon="favorite" />}
        {adventureThemes.length > 0 && <ThemeGrid themes={adventureThemes} categoryTitle={t('مغامرات سحرية', 'Magical Adventures')} icon="explore" />}
        
        {isTeamworkSelected && (
          <div className="glass-panel p-8 rounded-[2.5rem] border-2 border-brand-teal/20 animate-enter-forward max-w-2xl mx-auto mb-12">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                  <span className="material-symbols-outlined">diversity_3</span>
               </div>
               <h3 className="text-xl font-bold text-brand-navy">{t('من هو البطل الثاني؟', 'Who is the Second Hero?')}</h3>
            </div>
            <div>
              <label htmlFor="secondHero" className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('اسم الأخ/الأخت/الصديق', 'Sibling/Friend Name')}</label>
              <input
                type="text"
                id="secondHero"
                value={secondHeroName}
                onChange={(e) => setSecondHeroName(e.target.value)}
                className="w-full px-6 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-teal/50 focus:bg-white outline-none text-brand-navy font-bold text-lg"
                placeholder={t('مثال: علي', 'Example: Ali')}
              />
            </div>
          </div>
        )}

        <div className="text-center pt-8 mb-12">
          <button 
            onClick={() => setIsAdvancedMode(prev => !prev)} 
            className={`px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 mx-auto ${isAdvancedMode ? 'bg-brand-navy text-white' : 'glass-panel text-brand-navy/60 hover:text-brand-navy'}`}
          >
            <span className="material-symbols-outlined text-sm">{isAdvancedMode ? 'visibility_off' : 'settings'}</span>
            {isAdvancedMode ? t('إخفاء التفاصيل', 'Hide Advanced Options') : t('عرض التفاصيل المتقدمة', 'Show Advanced Options')}
          </button>
        </div>

        {isAdvancedMode && (
          <div className="animate-enter-forward glass-panel p-10 rounded-[3rem] space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 border-b border-brand-navy/5 pb-6">
               <span className="material-symbols-outlined text-brand-orange">psychology</span>
               <h3 className="text-2xl font-black text-brand-navy">{t('تفاصيل القصة المخصصة', 'Story Blueprints')}</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('عنوان القصة', 'Story Title')}</label>
                <input 
                  type="text" 
                  value={customTitle} 
                  onChange={(e) => { setCustomTitle(e.target.value); handleCustomChange(); }} 
                  className="w-full px-6 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy font-bold text-lg" 
                  placeholder={t('مثال: مغامرة سارة الشجاعة', 'Sarah\'s Brave Adventure')} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('الهدف من القصة', 'The Goal')}</label>
                  <textarea 
                    rows={3} 
                    value={customGoal} 
                    onChange={(e) => { setCustomGoal(e.target.value); handleCustomChange(); }} 
                    className="w-full px-6 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy font-bold" 
                    placeholder={t('ماذا يريد البطل أن يفعل؟', 'What does the hero want to do?')}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('التحدي الرئيسي', 'The Obstacle')}</label>
                  <textarea 
                    rows={3} 
                    value={customChallenge} 
                    onChange={(e) => { setCustomChallenge(e.target.value); handleCustomChange(); }} 
                    className="w-full px-6 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy font-bold" 
                    placeholder={t('ما هي العقبة؟', 'What is the challenge?')}
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('نص مخصص (اختياري)', 'Custom Content (Optional)')}</label>
                <textarea 
                  rows={4} 
                  value={customStoryText} 
                  onChange={(e) => { setCustomStoryText(e.target.value); handleCustomChange(); }} 
                  className="w-full px-6 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy/80 font-medium text-sm leading-relaxed" 
                  placeholder={t('إذا كان لديك نص معين أو أنشودة...', 'Paste specific text or poems here...')}
                ></textarea>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 mt-16 max-w-2xl mx-auto">
        <button 
          onClick={onBack} 
          className="flex-1 glass-panel py-5 rounded-full font-bold text-brand-navy hover:bg-white/60 transition-all active:scale-95"
        >
          {t('رجوع', 'Back')}
        </button>
        <button 
          onClick={handleNextClick} 
          disabled={isNextDisabled}
          className={`flex-[2] py-5 rounded-full font-black text-xl shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 group relative overflow-hidden ${isNextDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' : 'bg-brand-orange text-white shadow-brand-orange/20 hover:shadow-brand-orange/40'}`}
        >
           <span className="relative z-10 flex items-center justify-center gap-3">
             {t('ابدأ صناعة القصة!', 'Create My Story!')}
             <span className="material-symbols-outlined">rocket_launch</span>
           </span>
           {!isNextDisabled && <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none"></div>}
        </button>
      </div>
    </div>
  );
};

export default ThemeScreen;