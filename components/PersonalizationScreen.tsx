import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { CharacterInput } from './CharacterInput';
import type { StoryData, Character, Language } from '../types';
import { useStory } from '../context/StoryContext';
import { convertPrice } from '../services/currencyService';

const ALL_LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'ar', label: 'العربية', native: 'Arabic' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'Français', native: 'French' },
  { code: 'de', label: 'Deutsch', native: 'German' },
  { code: 'es', label: 'Español', native: 'Spanish' },
  { code: 'it', label: 'Italiano', native: 'Italian' },
  { code: 'pt', label: 'Português', native: 'Portuguese' },
  { code: 'ru', label: 'Русский', native: 'Russian' },
  { code: 'ja', label: '日本語', native: 'Japanese' },
  { code: 'tr', label: 'Türkçe', native: 'Turkish' }
];

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

      <form onSubmit={handleNext} className="max-w-2xl mx-auto space-y-5" noValidate>
        
        {/* 1. Main Character (The Hero) - Apple-Style Card */}
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

          {/* Photo Consent Checkbox (ONLY shows after photo upload) - Apple Card Style */}
          {hasMainPhoto && (
            <div className="animate-fade-in bg-white rounded-[24px] border border-[#d2d2d7] shadow-sm p-5 sm:p-6">
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

        {/* 2. Prompt to Add a Secondary Character - Apple Card Style */}
        <div className="bg-white rounded-[24px] border border-[#d2d2d7] hover:border-slate-400 transition-all shadow-sm p-1.5">
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
            className={`w-full flex items-center justify-between p-5 rounded-[20px] transition-all cursor-pointer ${localData.useSecondCharacter ? 'bg-brand-teal text-white shadow-md' : 'bg-slate-50/60 text-brand-navy hover:bg-slate-100/80'}`}
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-2xl">{localData.useSecondCharacter ? 'group_add' : 'person_add'}</span>
              <div className="text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-extrabold text-sm">{t('إضافة شخصية ثانية؟', 'Add a second character?')}</p>
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
            <div className="bg-white rounded-[24px] border border-[#d2d2d7] shadow-sm p-5 sm:p-6 flex items-center gap-4">
              <span className="text-sm font-bold text-brand-navy/70">{t('طبيعة الشخصية:', 'Character Type:')}</span>
              <div className="flex gap-3">
                {['person', 'object'].map((type) => (
                  <button 
                    key={type}
                    type="button"
                    onClick={() => setLocalData(prev => ({ ...prev, secondCharacter: { ...prev.secondCharacter!, type: type as any }}))}
                    className={`px-5 py-2 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${localData.secondCharacter?.type === type ? 'bg-brand-navy border-brand-navy text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-brand-navy/60 hover:border-brand-orange/30'}`}
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

        {/* 3. Creative Story Language Card (Apple Reference Layout with Fine Border) */}
        <div className="bg-white rounded-[24px] border border-[#d2d2d7] shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-start">
              <span className="text-base font-extrabold text-[#001A40] block">
                {t('لغة القصة', 'Story Language')}
              </span>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('تُكتب وتُطبع القصة بهذه اللغة:', 'Story written & printed in:')}{' '}
                <span className="font-bold text-[#F78F50]">
                  {ALL_LANGUAGES.find(l => l.code === localData.language)?.label || 'English'}
                </span>
              </p>
            </div>

            {/* Creative Apple-Style Segmented Language Switcher */}
            <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
              {/* Arabic Button */}
              <button
                type="button"
                onClick={() => {
                  setLocalData(prev => ({ ...prev, language: 'ar' }));
                  setIsChangingLanguage(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  localData.language === 'ar'
                    ? 'bg-white text-[#001A40] shadow-sm font-black'
                    : 'text-slate-600 hover:text-[#001A40]'
                }`}
              >
                العربية
              </button>

              {/* English Button */}
              <button
                type="button"
                onClick={() => {
                  setLocalData(prev => ({ ...prev, language: 'en' }));
                  setIsChangingLanguage(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  localData.language === 'en'
                    ? 'bg-white text-[#001A40] shadow-sm font-black'
                    : 'text-slate-600 hover:text-[#001A40]'
                }`}
              >
                English
              </button>

              {/* More Languages Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsChangingLanguage(prev => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  localData.language !== 'ar' && localData.language !== 'en'
                    ? 'bg-[#F78F50] text-white shadow-sm font-black'
                    : isChangingLanguage
                    ? 'bg-white text-[#001A40] shadow-sm'
                    : 'text-slate-500 hover:text-[#001A40]'
                }`}
              >
                <span>
                  {localData.language !== 'ar' && localData.language !== 'en'
                    ? ALL_LANGUAGES.find(l => l.code === localData.language)?.label
                    : t('لغات أخرى', 'More')}
                </span>
                <span className="material-symbols-outlined text-sm">
                  {isChangingLanguage ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>
          </div>

          {/* Expandable Grid for Other Global Languages */}
          {isChangingLanguage && (
            <div className="pt-3 border-t border-slate-100 animate-enter-forward space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {t('اختر من اللغات العالمية المتوفرة:', 'Choose from available languages:')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingLanguage(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {t('إغلاق ✕', 'Close ✕')}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {ALL_LANGUAGES.map((langOption) => (
                  <button
                    key={langOption.code}
                    type="button"
                    onClick={() => {
                      setLocalData(prev => ({ ...prev, language: langOption.code as Language }));
                      setIsChangingLanguage(false);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      localData.language === langOption.code
                        ? 'bg-[#001A40] border-[#001A40] text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-white hover:border-[#F78F50]'
                    }`}
                  >
                    {langOption.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Navigation */}
        <div className="flex items-center gap-4 pt-3">
          <button 
            type="button" 
            onClick={onBack} 
            className="flex-1 bg-white border border-[#d2d2d7] py-4 rounded-full font-bold text-brand-navy hover:bg-slate-50 shadow-sm transition-all active:scale-95 cursor-pointer"
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