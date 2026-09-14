import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { CharacterInput } from './CharacterInput';
import type { StoryData, Character, Language } from '../types';
import { useStory } from '../context/StoryContext';
import { convertPrice } from '../services/currencyService';

interface PersonalizationScreenProps {
  onNext: (data: Partial<StoryData>) => void;
  onBack: () => void;
  storyData: StoryData;
  language: Language;
}

const PersonalizationScreen: React.FC<PersonalizationScreenProps> = ({ onNext, onBack, storyData, language }) => {
  const { currency } = useStory();
  const [localData, setLocalData] = useState(storyData);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const normalizeName = (name: string): string => {
    return name.trim().split(' ').map(word => {
      if (!word) return '';
      if (/[a-zA-Z]/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    }).join(' ');
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedChildName = normalizeName(localData.mainCharacter.name).split(' ')[0];
    const normalizedMainCharName = normalizedChildName || 'Auto';
    const normalizedSecondCharName = localData.useSecondCharacter ? (normalizeName(localData.secondCharacter.name) || 'Auto') : '';
    const { childAge, mainCharacter, useSecondCharacter, secondCharacter } = localData;

    if (!normalizedChildName.trim()) { alert(language === 'ar' ? 'الرجاء إدخال اسم الطفل.' : "Please enter the child's name."); return; }
    if (!childAge.trim()) { alert(language === 'ar' ? 'الرجاء إدخال عمر الطفل.' : "Please enter the child's age."); return; }
    const numericAge = parseInt(childAge, 10);
    if (!isNaN(numericAge) && numericAge >= 6 && !localData.childGender) { alert(language === 'ar' ? 'الرجاء تحديد ما إذا كان البطل ولداً أم بنتاً للاستمرار.' : "Please select if the hero is a boy or a girl to continue."); return; }
    
    const hasMainImage = (mainCharacter.images && mainCharacter.images.length > 0) || (mainCharacter.imageBases64 && mainCharacter.imageBases64.length > 0);
    if (!hasMainImage) { alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الرئيسية.' : 'Please upload an image for the main character.'); return; }
    if (mainCharacter.qualityAnalysis?.score === 'not_usable') {
      alert(language === 'ar' 
        ? 'الصورة المرفوعة غير صالحة للاستخدام. يرجى مراجعة فحص الجودة ورفع صورة أخرى واضحة للوجه.' 
        : 'The uploaded image is not usable. Please review the photo quality check and upload a clearer face photo.');
      return;
    }
    if (useSecondCharacter) {
      if (!secondCharacter || !secondCharacter.name.trim()) {
        alert(language === 'ar' ? 'الرجاء إدخال اسم الشخصية الثانية.' : "Please enter the second character's name.");
        return;
      }
      if (secondCharacter.type === 'person') {
        if (!secondCharacter.age || !secondCharacter.age.trim()) {
          alert(language === 'ar' ? 'الرجاء إدخال عمر الشخصية الثانية.' : "Please enter the second character's age.");
          return;
        }
        const secAge = parseInt(secondCharacter.age, 10);
        if (!isNaN(secAge) && secAge >= 6 && !secondCharacter.gender) {
          alert(language === 'ar' ? 'الرجاء تحديد ما إذا كان البطل الثاني ولداً أم بنتاً للاستمرار.' : "Please select if the second hero is a boy or a girl to continue.");
          return;
        }
      }
      const hasSecondImage = (secondCharacter.images && secondCharacter.images.length > 0) || (secondCharacter.imageBases64 && secondCharacter.imageBases64.length > 0);
      if (!hasSecondImage) { alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الثانوية.' : "Please upload an image for the second character."); return; }
      if (secondCharacter.qualityAnalysis?.score === 'not_usable') {
        alert(language === 'ar' 
          ? 'صورة الشخصية الثانوية غير صالحة للاستخدام. يرجى مراجعة فحص الجودة ورفع صورة أخرى واضحة للوجه.' 
          : 'The uploaded image for the second character is not usable. Please review the photo quality check and upload a clearer face photo.');
        return;
      }
    }

    if (!consentChecked) {
      alert(language === 'ar' 
        ? 'يرجى الموافقة على شروط الاستخدام والإذن بالصور للمتابعة.' 
        : 'Please confirm that you own or have permission to use these photos to continue.');
      return;
    }

    onNext({
      ...localData,
      childName: normalizedChildName,
      mainCharacter: { ...localData.mainCharacter, name: normalizedMainCharName },
      secondCharacter: localData.secondCharacter ? { ...localData.secondCharacter, name: normalizedSecondCharName } : undefined,
      isCustomTheme: !!localData.occasion?.trim()
    });
  };

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const hasMainPhoto = Boolean(
    (localData.mainCharacter.images && localData.mainCharacter.images.length > 0) ||
    (localData.mainCharacter.imageBases64 && localData.mainCharacter.imageBases64.length > 0)
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-enter-forward">
      <div className="text-center space-y-2 mb-8 sm:mb-10">
        <div className="flex items-center justify-center gap-1.5 text-brand-orange mb-1">
           <span className="material-symbols-outlined text-sm">edit_note</span>
           <span className="text-[10px] font-black tracking-[0.2em] uppercase">{t('تخصيص بطل القصة', 'PERSONALIZE YOUR HERO')}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl text-brand-navy apple-display-heading">
          {t('أخبرنا عن ', 'Tell us about ')}
          <span className="text-brand-teal">{t('بطل القصة', 'the hero')}</span>
        </h2>
        <p className="text-brand-navy/60 max-w-xl mx-auto text-xs sm:text-sm apple-body-text">
          {t('كل تفصيل هنا يساعدنا في صنع تجربة سحرية فريدة لطفلك.', 'Every detail helps us craft a unique magical experience for your child.')}
        </p>
      </div>

      <form onSubmit={handleNext} className="max-w-2xl mx-auto space-y-6" noValidate>
        
        {/* 1. Main Character (The Hero) - Full Width */}
        <div className="space-y-4">
          <CharacterInput
            label={t('الشخصية الرئيسية (بطل القصة)', 'Main Character (The Hero)')}
            character={localData.mainCharacter}
            onCharacterChange={(char) => setLocalData({ ...localData, mainCharacter: char })}
            isMain={true}
            language={language}
            childAge={localData.childAge}
            onAgeChange={(age) => setLocalData({ ...localData, childAge: age })}
            childGender={localData.childGender}
            onGenderChange={(gender) => setLocalData({ ...localData, childGender: gender })}
          />

          {/* Photo Consent Checkbox (ONLY shows after photo upload) */}
          {hasMainPhoto && (
            <div className="animate-fade-in glass-panel p-5 rounded-2xl border border-white/80 bg-white/70 shadow-sm">
              <label className="flex items-start gap-3.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={consentChecked} 
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange cursor-pointer shrink-0"
                  required
                />
                <span className="text-xs font-bold text-brand-navy/70 leading-relaxed text-start">
                  {language === 'ar' ? (
                    <>
                      أؤكد أنني أملك حقوق هذه الصور أو لدي الإذن باستخدامها، وأوافق على استخدامها لإنشاء القصة الشخصية لطفلي وفقاً لـ{' '}
                      <a href="/tos.html" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">شروط الخدمة</a>{' '}
                      و{' '}
                      <a href="/policy.html" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">سياسة الخصوصية</a>.
                    </>
                  ) : (
                    <>
                      I confirm that I own or have permission to use these photos, and consent to their use for creating my custom storybook in accordance with the{' '}
                      <a href="/tos.html" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Terms of Service</a>{' '}
                      and{' '}
                      <a href="/policy.html" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Privacy Policy</a>.
                    </>
                  )}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* 2. Prompt to Add a Secondary Character */}
        <div className="p-1 glass-panel rounded-[2rem]">
          <button 
            type="button" 
            onClick={() => {
              const isChecked = !localData.useSecondCharacter;
              setLocalData(prev => ({
                ...prev,
                useSecondCharacter: isChecked,
                secondCharacter: isChecked && !prev.secondCharacter ? { name: '', type: 'person', images: [], imageBases64: [], description: '', relationship: '' } : prev.secondCharacter
              }));
            }}
            className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] transition-all cursor-pointer ${localData.useSecondCharacter ? 'bg-brand-teal text-white shadow-lg' : 'bg-white/50 text-brand-navy hover:bg-white/80'}`}
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-2xl">{localData.useSecondCharacter ? 'group_add' : 'person_add'}</span>
              <div className="text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-sm">{t('إضافة شخصية ثانية؟', 'Add a second character?')}</p>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                    localData.useSecondCharacter 
                      ? 'bg-white text-brand-teal border-white' 
                      : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                  }`}>
                    {t('ميزة إضافية', 'PREMIUM')} • +{convertPrice(1.5, currency)}
                  </span>
                </div>
                <p className={`text-[11px] ${localData.useSecondCharacter ? 'text-white/85' : 'text-brand-navy/50'}`}>
                  {t('صديق، أخ، أو حتى لعبة مفضلة!', 'A friend, sibling, or favorite toy!')}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-2xl">{localData.useSecondCharacter ? 'check_circle' : 'add_circle'}</span>
          </button>
        </div>

        {localData.useSecondCharacter && localData.secondCharacter && (
          <div className="animate-enter-forward space-y-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
              <span className="text-sm font-bold text-brand-navy/70">{t('طبيعة الشخصية:', 'Character Type:')}</span>
              <div className="flex gap-3">
                {['person', 'object'].map((type) => (
                  <button 
                    key={type}
                    type="button"
                    onClick={() => setLocalData(prev => ({ ...prev, secondCharacter: { ...prev.secondCharacter!, type: type as any }}))}
                    className={`px-5 py-2 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${localData.secondCharacter?.type === type ? 'bg-brand-navy border-brand-navy text-white shadow-sm' : 'bg-white/60 border-brand-navy/10 text-brand-navy/60 hover:border-brand-orange/30'}`}
                  >
                    {type === 'person' ? t('إنسان', 'Person') : t('شيء / حيوان', 'Object / Pet')}
                  </button>
                ))}
              </div>
            </div>
            <CharacterInput
              label={t('الشخصية الثانوية', 'Second Character')}
              character={localData.secondCharacter}
              onCharacterChange={(char) => setLocalData({ ...localData, secondCharacter: char })}
              isMain={false}
              language={language}
            />
          </div>
        )}

        {/* 3. Story Language (Short, streamlined, minimal) */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/80 bg-white/50 shadow-sm">
          {!isChangingLanguage ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                  <span className="material-symbols-outlined text-xl">translate</span>
                </div>
                <div className="text-start">
                  <span className="text-[11px] font-bold text-brand-navy/50 block uppercase tracking-wider">
                    {t('لغة القصة', 'Story Language')}
                  </span>
                  <p className="text-base font-extrabold text-brand-navy">
                    {[
                      { code: 'ar', label: 'العربية' },
                      { code: 'en', label: 'English' },
                      { code: 'de', label: 'Deutsch' },
                      { code: 'es', label: 'Español' },
                      { code: 'fr', label: 'Français' },
                      { code: 'it', label: 'Italiano' },
                      { code: 'pt', label: 'Português' },
                      { code: 'ru', label: 'Русский' },
                      { code: 'ja', label: '日本語' },
                      { code: 'tr', label: 'Türkçe' }
                    ].find(l => l.code === localData.language)?.label || 'English'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingLanguage(true)}
                className="px-4 py-1.5 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-full text-xs font-black uppercase tracking-wider hover:bg-brand-orange hover:text-white transition-all duration-150 active:scale-95 cursor-pointer"
              >
                {t('تغيير', 'Change')}
              </button>
            </div>
          ) : (
            <div className="animate-enter-forward space-y-3">
              <div className="flex items-center justify-between border-b border-brand-navy/5 pb-2">
                <span className="text-xs font-bold text-brand-navy/80">{t('اختر لغة القصة', 'Select Story Language')}</span>
                <button
                  type="button"
                  onClick={() => setIsChangingLanguage(false)}
                  className="text-xs font-bold text-brand-navy/60 hover:text-brand-orange cursor-pointer"
                >
                  {t('إلغاء', 'Cancel')}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { code: 'ar', label: 'العربية' },
                  { code: 'en', label: 'English' },
                  { code: 'de', label: 'Deutsch' },
                  { code: 'es', label: 'Español' },
                  { code: 'fr', label: 'Français' },
                  { code: 'it', label: 'Italiano' },
                  { code: 'pt', label: 'Português' },
                  { code: 'ru', label: 'Русский' },
                  { code: 'ja', label: '日本語' },
                  { code: 'tr', label: 'Türkçe' }
                ].map((langOption) => (
                  <button
                    key={langOption.code}
                    type="button"
                    onClick={() => {
                      setLocalData({ ...localData, language: langOption.code as Language });
                      setIsChangingLanguage(false);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${localData.language === langOption.code ? 'bg-brand-orange border-brand-orange text-white shadow-md shadow-brand-orange/20' : 'bg-white/60 border-brand-navy/5 text-brand-navy/70 hover:border-brand-orange/30'}`}
                  >
                    <span className="text-xs font-bold">{langOption.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Navigation */}
        <div className="flex items-center gap-4 pt-4">
          <button 
            type="button" 
            onClick={onBack} 
            className="flex-1 glass-panel py-4 rounded-full font-bold text-brand-navy hover:bg-white/80 transition-all active:scale-95 cursor-pointer"
          >
            {t('رجوع', 'Back')}
          </button>
          <button 
            type="submit" 
            className="flex-[2] bg-brand-orange text-white py-4 rounded-full font-black text-lg shadow-xl shadow-brand-orange/20 hover:shadow-brand-orange/40 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group relative overflow-hidden cursor-pointer"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {t('متابعة المغامرة', 'Continue Adventure')}
              <span className="material-symbols-outlined">{language === 'ar' ? 'arrow_back' : 'arrow_forward'}</span>
            </span>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none"></div>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalizationScreen;