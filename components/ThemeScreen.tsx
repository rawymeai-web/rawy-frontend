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
    className={`relative p-5 text-center rounded-2xl transition-all duration-300 h-full flex flex-col items-center justify-start group ${isSelected
      ? 'bg-brand-coral text-white shadow-xl ring-4 ring-brand-coral ring-offset-2 scale-[1.04]'
      : 'bg-white/80 hover:bg-white hover:shadow-lg hover:translate-y-[-2px] border border-gray-100 hover:border-brand-baby-blue/30'
      }`}
    aria-pressed={isSelected}
  >
    <div className={`text-5xl mb-4 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} role="img">{emoji}</div>
    <h4 className={`font-bold text-lg leading-tight mb-2 transition-colors ${isSelected ? 'text-white' : 'text-brand-navy group-hover:text-brand-coral'}`}>{title}</h4>
    <p className={`text-sm leading-snug opacity-90 hidden sm:block ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{description}</p>

    {isSelected && (
      <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
        <svg className="w-4 h-4 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path></svg>
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
  const [customIllustrationNotes, setCustomIllustrationNotes] = useState(storyData.customIllustrationNotes || '');
  const [customStylePrompt, setCustomStylePrompt] = useState(storyData.selectedStylePrompt || '');

  // New: Second Hero Name for Teamwork/Siblings theme
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

    // ALWAYS overwrite details from the library — never let stale order data linger
    const components = getGuidelineComponentsForTheme(themeOption.id);
    if (components) {
      setCustomGoal(components.goal);
      setCustomChallenge(components.challenge);
      setCustomIllustrationNotes(components.illustrationNotes);
    } else if (themeOption.skeleton) {
      // Use backend skeleton if available
      const cores = themeOption.skeleton.storyCores || [];
      const challenges = themeOption.skeleton.limiters || themeOption.skeleton.catalysts || [];
      
      setCustomGoal(cores.length ? cores[Math.floor(Math.random() * cores.length)] : '');
      setCustomChallenge(challenges.length ? challenges[Math.floor(Math.random() * challenges.length)] : '');
      setCustomIllustrationNotes(themeOption.visualDNA || '');
    } else {
      // Fallback: clear the fields so old order data doesn't show
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
      : `A story where the hero wants to '\${customGoal}', but faces the challenge of '\${customChallenge}'.`;

    let finalStylePrompt = storyData.selectedStylePrompt;
    if (isAdvancedMode && !selectedThemeId && customStylePrompt) {
      finalStylePrompt = customStylePrompt;
    }

    // Extract Visual DNA string from skeleton
    const thematicVisualDNA = selectedPredefinedTheme?.visualDNA || "";

    onNext({
      title: customTitle,
      theme: finalThemeDescription,
      themeId: selectedPredefinedTheme?.id,
      themeVisualDNA: thematicVisualDNA, // NEW: Pass the actual visual instructions
      customGoal,
      customChallenge,
      customIllustrationNotes,
      selectedStylePrompt: finalStylePrompt,
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

  const t = (arText: string, enText: string) => {
    if (language === 'ar') return arText;
    return enText; // Default to English for UI labels not in the theme object
  };

  const ThemeGrid = ({ themes, categoryTitle, icon }: { themes: StoryTheme[], categoryTitle: string, icon: React.ReactNode }) => (
    <div className="mb-10">
      <div className="flex items-center mb-6 px-2">
        <div className="text-brand-coral bg-brand-coral/10 p-2 rounded-lg">{icon}</div>
        <h3 className="text-2xl font-bold text-brand-navy mx-3">{categoryTitle}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
  const otherThemes = themes.filter(t => t.category !== 'adventures' && t.category !== 'values');
  const isCustomMode = selectedThemeId === null;
  const isTeamworkSelected = selectedThemeId === 'val-teamwork';

  const isNextDisabled = !customTitle ||
    (isAdvancedMode && isCustomMode && (!customGoal || !customChallenge)) ||
    (!isAdvancedMode && !selectedThemeId) ||
    (isTeamworkSelected && !secondHeroName);

  if (isLoadingCatalog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-coral"></div>
        <p className="text-brand-navy font-medium">{t('جاري تحميل المواضيع...', 'Loading Themes...')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <h2 className="text-4xl font-bold text-brand-navy text-center mb-8 drop-shadow-sm">{t('الخطوة الخامسة: موضوع القصة', 'Step 5: Story Theme')}</h2>
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/50">
        {valueThemes.length > 0 && <ThemeGrid themes={valueThemes} categoryTitle={t('قيم أخلاقية', 'Values')} icon={<ValuesCategoryIcon />} />}
        {adventureThemes.length > 0 && <ThemeGrid themes={adventureThemes} categoryTitle={t('مغامرات شيقة', 'Exciting Adventures')} icon={<AdventuresCategoryIcon />} />}
        {otherThemes.length > 0 && <ThemeGrid themes={otherThemes} categoryTitle={t('مواضيع أخرى', 'Other Themes')} icon={<LightbulbIcon />} />}

        {isTeamworkSelected && (
          <div className="mt-8 mb-8 p-6 bg-brand-baby-blue/10 rounded-2xl border-2 border-brand-baby-blue/30 animate-fade-in">
            <h3 className="text-xl font-bold text-brand-navy mb-4">{t('من هو البطل الثاني؟', 'Who is the Second Hero?')}</h3>
            <label htmlFor="secondHero" className="block text-sm font-medium text-gray-700 mb-1">{t('اسم الأخ/الأخت/الصديق', 'Sibling/Friend Name')}</label>
            <input
              type="text"
              id="secondHero"
              value={secondHeroName}
              onChange={(e) => setSecondHeroName(e.target.value)}
              className="mt-1 block w-full md:w-1/2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-brand-coral"
              placeholder={t('مثال: علي', 'Example: Ali')}
            />
          </div>
        )}

        <div className="text-center border-t border-gray-200/60 pt-8 mt-4">
          <Button variant="outline" onClick={() => setIsAdvancedMode(prev => !prev)} className="rounded-full px-8">
            {isAdvancedMode ? t('إخفاء الخيارات المتقدمة', 'Hide Details') : t('عرض تفاصيل القصة (متقدم)', 'show Details (Advanced)')}
          </Button>
        </div>

        {isAdvancedMode && (
          <div className="animate-fade-in mt-8">
            <h3 className="text-xl font-bold text-brand-navy mb-4 flex items-center"><LightbulbIcon />{t('تفاصيل القصة', 'Story Details')}</h3>
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-inner space-y-6">
              <div>
                <label htmlFor="storyTitle" className="block text-sm font-medium text-gray-700 mb-1">{t('عنوان القصة', 'Story Title')}</label>
                <input type="text" id="storyTitle" value={customTitle} onChange={(e) => { setCustomTitle(e.target.value); handleCustomChange(); }} className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" placeholder={t('مثال: مغامرة سارة الشجاعة', 'Example: Sarah\'s Brave Adventure')} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customGoal" className="block text-sm font-medium text-gray-700 mb-1">{t('الهدف من القصة', 'The Goal of the Story')}</label>
                  <textarea id="customGoal" rows={3} value={customGoal} onChange={(e) => { setCustomGoal(e.target.value); handleCustomChange(); }} className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" placeholder={t('ماذا يريد البطل أن يفعل أو يجد؟', 'What does the hero want to do or find?')} required></textarea>
                </div>
                <div>
                  <label htmlFor="customChallenge" className="block text-sm font-medium text-gray-700 mb-1">{t('التحدي الرئيسي', 'The Main Challenge')}</label>
                  <textarea id="customChallenge" rows={3} value={customChallenge} onChange={(e) => { setCustomChallenge(e.target.value); handleCustomChange(); }} className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900" placeholder={t('ما هي العقبة التي تجعل القصة مثيرة؟', 'What obstacle makes the story exciting?')} required></textarea>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-xl">{t('رجوع', 'Back')}</Button>
        <Button onClick={handleNextClick} className="text-xl px-12 py-4 rounded-xl shadow-lg hover:shadow-xl" disabled={isNextDisabled}>
          {t('ابدأ صناعة القصة!', 'Create the Story Now!')}
        </Button>
      </div>
    </div>
  );
};

export default ThemeScreen;