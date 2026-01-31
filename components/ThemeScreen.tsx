import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import * as adminService from '../services/adminService';
import { getGuidelineComponentsForTheme } from '../services/storyGuidelines';
import { getStyleForWriteYourOwn, ART_STYLE_OPTIONS } from '../constants';
import type { StoryData, Language, StoryTheme } from '../types';

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
      ? 'bg-white shadow-xl ring-4 ring-brand-coral/30 translate-y-[-4px]'
      : 'bg-white/80 hover:bg-white hover:shadow-lg hover:translate-y-[-2px] border border-gray-100 hover:border-brand-baby-blue/30'
      }`}
    aria-pressed={isSelected}
  >
    <div className={`text-5xl mb-4 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} role="img">{emoji}</div>
    <h4 className={`font-bold text-lg leading-tight mb-2 transition-colors ${isSelected ? 'text-brand-coral' : 'text-brand-navy group-hover:text-brand-coral'}`}>{title}</h4>
    <p className="text-sm text-gray-500 leading-snug opacity-90 hidden sm:block">{description}</p>

    {isSelected && (
      <div className="absolute top-3 right-3 w-6 h-6 bg-brand-coral rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path></svg>
      </div>
    )}
  </button>
);


const ThemeScreen: React.FC<ThemeScreenProps> = ({ onNext, onBack, storyData, language }) => {
  const [themes, setThemes] = useState<StoryTheme[]>([]);
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
    adminService.getThemes().then(setThemes);
  }, []);

  useEffect(() => {
    if (isAdvancedMode && !customStylePrompt) {
      setCustomStylePrompt(getStyleForWriteYourOwn(storyData.childAge));
    }
  }, [isAdvancedMode, storyData.childAge, customStylePrompt]);

  const handleThemeClick = (themeOption: StoryTheme) => {
    // Always trigger selection to allow re-rolling logic if we wanted, 
    // but mainly to set the ID and fetch components.
    setSelectedThemeId(themeOption.id);
    setCustomTitle(themeOption.title[language]);

    // Fetch random goal/challenge for this theme
    const components = getGuidelineComponentsForTheme(themeOption.id);
    if (components) {
      setCustomGoal(components.goal);
      setCustomChallenge(components.challenge);
      setCustomIllustrationNotes(components.illustrationNotes);
    }
  };

  const handleCustomChange = () => setSelectedThemeId(null);

  const handleNextClick = () => {
    const selectedPredefinedTheme = themes.find(t => t.id === selectedThemeId);
    const finalThemeDescription = selectedPredefinedTheme
      ? selectedPredefinedTheme.description[language]
      : `A story where the hero wants to '${customGoal}', but faces the challenge of '${customChallenge}'.`;

    // Keep the style from the previous step unless a custom one is specified in advanced mode
    let finalStylePrompt = storyData.selectedStylePrompt;
    if (isAdvancedMode && !selectedThemeId && customStylePrompt) {
      finalStylePrompt = customStylePrompt;
    }

    onNext({
      title: customTitle,
      theme: finalThemeDescription,
      themeId: selectedPredefinedTheme?.id,
      customGoal,
      customChallenge,
      customIllustrationNotes,
      selectedStylePrompt: finalStylePrompt,
      // Pass the second hero if applicable
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
            title={themeOption.title[language]}
            description={themeOption.description[language]}
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <h2 className="text-4xl font-bold text-brand-navy text-center mb-8 drop-shadow-sm">{t('الخطوة الخامسة: موضوع القصة', 'Step 5: Story Theme')}</h2>
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/50">
        {valueThemes.length > 0 && <ThemeGrid themes={valueThemes} categoryTitle={t('قيم أخلاقية', 'Values')} icon={<ValuesCategoryIcon />} />}
        {adventureThemes.length > 0 && <ThemeGrid themes={adventureThemes} categoryTitle={t('مغامرات شيقة', 'Exciting Adventures')} icon={<AdventuresCategoryIcon />} />}

        {/* Special Input for Teamwork/Siblings Theme */}
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

        {/* Only show/edit the randomized fields if Advanced Mode is on OR a theme is selected (to show the user what they got) */}
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