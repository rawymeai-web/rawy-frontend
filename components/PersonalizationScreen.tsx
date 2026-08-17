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
    
    if (mainCharacter.images.length === 0) { alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الرئيسية.' : 'Please upload an image for the main character.'); return; }
    if (mainCharacter.qualityAnalysis?.score === 'not_usable') {
      alert(language === 'ar' 
        ? 'الصورة المرفوعة غير صالحة للاستخدام. يرجى مراجعة فحص الجودة ورفع صورة أخرى واضحة للوجه.' 
        : 'The uploaded image is not usable. Please review the photo quality check and upload a clearer face photo.');
      return;
    }
    if (useSecondCharacter) {
      if (secondCharacter && secondCharacter.images.length === 0) { alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الثانوية.' : "Please upload an image for the second character."); return; }
      if (secondCharacter && secondCharacter.qualityAnalysis?.score === 'not_usable') {
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

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 animate-enter-forward">
      <div className="text-center space-y-3 mb-12">
        <div className="flex items-center justify-center gap-1.5 text-brand-orange mb-1">
           <span className="material-symbols-outlined text-sm">edit_note</span>
           <span className="text-[10px] font-black tracking-[0.2em] uppercase">{t('تخصيص بطل القصة', 'PERSONALIZE YOUR HERO')}</span>
        </div>
        <h2 className="text-4xl text-brand-navy apple-display-heading">
          {t('أخبرنا عن ', 'Tell us about ')}
          <span className="text-brand-teal">{t('بطل القصة', 'the hero')}</span>
        </h2>
        <p className="text-brand-navy/60 max-w-xl mx-auto text-sm apple-body-text">
          {t('كل تفصيل هنا يساعدنا في صنع تجربة سحرية فريدة لطفلك.', 'Every detail helps us craft a unique magical experience for your child.')}
        </p>
      </div>

      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" noValidate>
        
        {/* Left Column: Hero Details */}
        <div className="lg:col-span-6 space-y-6">
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
        </div>

        {/* Right Column: Addons and Settings */}
        <div className="lg:col-span-6 space-y-6">

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
              className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] transition-all ${localData.useSecondCharacter ? 'bg-brand-teal text-white shadow-lg' : 'bg-white/40 text-brand-navy hover:bg-white/60'}`}
            >
              <div className="flex items-center gap-4">
                 <span className="material-symbols-outlined">{localData.useSecondCharacter ? 'group_add' : 'person_add'}</span>
                  <div className="text-start">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm">{t('إضافة شخصية ثانية؟', 'Add a second character?')}</p>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                        localData.useSecondCharacter 
                          ? 'bg-white text-brand-teal border-white' 
                          : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                      }`}>
                        {t('ميزة إضافية', 'PREMIUM')} • +{convertPrice(2.0, currency)}
                      </span>
                    </div>
                    <p className={`text-[10px] ${localData.useSecondCharacter ? 'text-white/80' : 'text-brand-navy/40'}`}>
                      {t('صديق، أخ، أو حتى لعبة مفضلة!', 'A friend, sibling, or favorite toy!')}
                    </p>
                  </div>
              </div>
              <span className="material-symbols-outlined">{localData.useSecondCharacter ? 'check_circle' : 'add_circle'}</span>
            </button>
          </div>

          {localData.useSecondCharacter && localData.secondCharacter && (
            <div className="animate-enter-forward space-y-6">
               <div className="glass-panel p-6 rounded-[2rem] flex items-center gap-6">
                  <span className="text-sm font-bold text-brand-navy/60">{t('طبيعة الشخصية:', 'Character Type:')}</span>
                  <div className="flex gap-4">
                    {['person', 'object'].map((type) => (
                      <button 
                        key={type}
                        type="button"
                        onClick={() => setLocalData(prev => ({ ...prev, secondCharacter: { ...prev.secondCharacter!, type: type as any }}))}
                        className={`px-6 py-2 rounded-full text-xs font-bold border-2 transition-all ${localData.secondCharacter?.type === type ? 'bg-brand-navy border-brand-navy text-white' : 'bg-white/50 border-brand-navy/10 text-brand-navy/60'}`}
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

          {/* Story Language Override */}
          <div className="glass-panel p-6 rounded-[2rem] space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                   <div className="text-start">
                     <span className="text-sm font-bold text-brand-navy/80">{t('لغة القصة', 'Story Language')}</span>
                     <p className="text-[10px] text-brand-navy/40">
                       {t('بأي لغة تريد كتابة قصتك؟', 'Which language should we write your story in?')}
                     </p>
                   </div>
                </div>
                
                {!isChangingLanguage && (
                  <button
                    type="button"
                    onClick={() => setIsChangingLanguage(true)}
                    className="px-4 py-1.5 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-full text-xs font-black uppercase tracking-wider hover:bg-brand-orange hover:text-white transition-all duration-150 active:scale-95"
                  >
                    {t('تغيير', 'Change')}
                  </button>
                )}
             </div>

             {!isChangingLanguage ? (
               <div className="flex items-center bg-white/40 p-4 rounded-2xl border border-white/60">
                 <div className="text-start">
                   <p className="text-sm font-bold text-brand-navy">
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
                   <p className="text-[10px] text-brand-navy/50">
                     {t('اللغة المختارة للقصة', 'Selected story language')}
                   </p>
                 </div>
               </div>
             ) : (
               <div className="animate-enter-forward space-y-4 pt-2">
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
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
                       className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all group ${localData.language === langOption.code ? 'bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'bg-white/50 border-brand-navy/5 text-brand-navy/60 hover:border-brand-orange/30'}`}
                     >
                       <span className="text-[10px] font-black uppercase tracking-tighter">{langOption.label}</span>
                     </button>
                   ))}
                 </div>
                 
                 <div className="flex justify-end">
                   <button
                     type="button"
                     onClick={() => setIsChangingLanguage(false)}
                     className="px-4 py-1.5 bg-brand-navy text-white rounded-full text-xs font-bold hover:bg-brand-navy/80 transition-all"
                   >
                     {t('إلغاء', 'Cancel')}
                   </button>
                 </div>
               </div>
             )}
          </div>

           {/* Legal Consent Checkbox */}
           <div className="glass-panel p-6 rounded-[2rem] border border-white/60 bg-white/40 shadow-sm">
             <label className="flex items-start gap-4 cursor-pointer select-none">
               <input 
                 type="checkbox" 
                 checked={consentChecked} 
                 onChange={(e) => setConsentChecked(e.target.checked)}
                 className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange cursor-pointer shrink-0"
                 required
               />
                <span className="text-[11px] font-bold text-brand-navy/70 leading-relaxed text-start">
                  {language === 'ar' ? (
                    <>
                      أؤكد أنني أملك حقوق هذه الصور أو لدي الإذن باستخدامها، وأوافق على استخدامها لإنشاء القصة الشخصية لطلفي وفقاً لـ{' '}
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

          {/* Navigation */}
          <div className="flex items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={onBack} 
              className="flex-1 glass-panel py-5 rounded-full font-bold text-brand-navy hover:bg-white/60 transition-all active:scale-95"
            >
              {t('رجوع', 'Back')}
            </button>
            <button 
              type="submit" 
              className="flex-[2] bg-brand-orange text-white py-5 rounded-full font-black text-lg shadow-xl shadow-brand-orange/20 hover:shadow-brand-orange/40 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 group relative overflow-hidden"
            >
               <span className="relative z-10 flex items-center justify-center gap-2">
                 {t('متابعة المغامرة', 'Continue Adventure')}
                 <span className="material-symbols-outlined">arrow_forward</span>
               </span>
               <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none"></div>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PersonalizationScreen;