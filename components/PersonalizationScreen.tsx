import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { CharacterInput } from './CharacterInput';
import type { StoryData, Character, Language } from '../types';

interface PersonalizationScreenProps {
  onNext: (data: Partial<StoryData>) => void;
  onBack: () => void;
  storyData: StoryData;
  language: Language;
}

const PersonalizationScreen: React.FC<PersonalizationScreenProps> = ({ onNext, onBack, storyData, language }) => {
  const [localData, setLocalData] = useState(storyData);
  const [isCharacterNameManuallyEdited, setIsCharacterNameManuallyEdited] = useState(false);

  useEffect(() => {
    if (!isCharacterNameManuallyEdited) {
      const firstName = localData.childName.split(' ')[0];
      setLocalData(prev => ({
        ...prev,
        mainCharacter: { ...prev.mainCharacter, name: firstName },
      }));
    }
  }, [localData.childName, isCharacterNameManuallyEdited]);

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
    const normalizedChildName = normalizeName(localData.childName).split(' ')[0];
    const normalizedParentName = normalizeName(localData.parentName || '');
    const normalizedMainCharName = normalizedChildName || 'Auto';
    const normalizedSecondCharName = localData.useSecondCharacter ? (normalizeName(localData.secondCharacter.name) || 'Auto') : '';
    const { childAge, parentEmail, mainCharacter, useSecondCharacter, secondCharacter } = localData;

    if (!normalizedParentName.trim()) { alert(language === 'ar' ? 'الرجاء إدخال اسم الوالد/الأم.' : "Please enter the parent's full name."); return; }
    if (!parentEmail?.trim() || !parentEmail.includes('@')) { alert(language === 'ar' ? 'الرجاء إدخال بريد إلكتروني صحيح.' : "Please enter a valid email address."); return; }
    if (!normalizedChildName.trim()) { alert(language === 'ar' ? 'الرجاء إدخال اسم الطفل.' : "Please enter the child's name."); return; }
    if (!childAge.trim()) { alert(language === 'ar' ? 'الرجاء إدخال عمر الطفل.' : "Please enter the child's age."); return; }
    const numericAge = parseInt(childAge, 10);
    if (!isNaN(numericAge) && numericAge >= 6 && !localData.childGender) { alert(language === 'ar' ? 'الرجاء تحديد ما إذا كان البطل ولداً أم بنتاً للاستمرار.' : "Please select if the hero is a boy or a girl to continue."); return; }
    
    if (mainCharacter.images.length === 0) { alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الرئيسية.' : 'Please upload an image for the main character.'); return; }
    if (useSecondCharacter) {
      if (secondCharacter && secondCharacter.images.length === 0) { alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الثانوية.' : "Please upload an image for the second character."); return; }
    }

    onNext({
      ...localData,
      childName: normalizedChildName,
      parentName: normalizedParentName,
      mainCharacter: { ...localData.mainCharacter, name: normalizedMainCharName },
      secondCharacter: localData.secondCharacter ? { ...localData.secondCharacter, name: normalizedSecondCharName } : undefined,
      isCustomTheme: !!localData.occasion?.trim()
    });
  };

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 animate-enter-forward">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 rounded-full mb-2">
           <span className="material-symbols-outlined text-brand-orange text-sm">edit_note</span>
           <span className="text-xs font-bold text-brand-orange tracking-widest uppercase">{t('تخصيص بطل القصة', 'PERSONALIZE YOUR HERO')}</span>
        </div>
        <h2 className="text-4xl font-black text-brand-navy leading-tight">
          {t('أخبرنا عن ', 'Tell us about ')}
          <span className="text-brand-teal">{t('بطل القصة', 'the hero')}</span>
        </h2>
        <p className="text-brand-navy/60 max-w-xl mx-auto">
          {t('كل تفصيل هنا يساعدنا في صنع تجربة سحرية فريدة لطفلك.', 'Every detail helps us craft a unique magical experience for your child.')}
        </p>
      </div>

      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" noValidate>
        
        {/* Left Column: Form Info */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Customer Panel */}
          <div className="glass-panel p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3 border-b border-brand-navy/5 pb-4">
              <span className="material-symbols-outlined text-brand-orange">person</span>
              <h3 className="text-xl font-bold text-brand-navy">{t('معلومات التواصل', 'Contact Info')}</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('اسم الوالد/الأم', "Parent's Name")}</label>
                <input 
                  type="text" 
                  value={localData.parentName || ''} 
                  onChange={(e) => setLocalData({ ...localData, parentName: e.target.value })} 
                  className="w-full px-5 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy font-bold" 
                  placeholder={t('شادي أيمن', 'Shady Ayman')} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('البريد الإلكتروني', "Email")}</label>
                <input 
                  type="email" 
                  value={localData.parentEmail || ''} 
                  onChange={(e) => setLocalData({ ...localData, parentEmail: e.target.value })} 
                  className="w-full px-5 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy font-bold" 
                  placeholder="name@example.com" 
                />
              </div>
            </div>
          </div>

          {/* Child Panel */}
          <div className="glass-panel p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3 border-b border-brand-navy/5 pb-4">
              <span className="material-symbols-outlined text-brand-teal">child_care</span>
              <h3 className="text-xl font-bold text-brand-navy">{t('معلومات الطفل', "Child's Info")}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('الاسم الأول', "First Name")}</label>
                <input 
                  type="text" 
                  value={localData.childName} 
                  onChange={(e) => setLocalData({ ...localData, childName: e.target.value })} 
                  className="w-full px-5 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy font-bold text-lg" 
                  placeholder={t('سارة', 'Sarah')} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('العمر', "Age")}</label>
                <input 
                  type="number" 
                  value={localData.childAge} 
                  onChange={(e) => setLocalData({ ...localData, childAge: e.target.value })} 
                  className="w-full px-5 py-4 bg-white/50 border border-brand-navy/5 rounded-2xl focus:ring-2 focus:ring-brand-orange/50 focus:bg-white outline-none text-brand-navy font-bold text-lg text-center" 
                  min="1" max="12" 
                />
              </div>
            </div>

            {parseInt(localData.childAge, 10) >= 6 && (
              <div className="animate-enter-forward">
                <label className="block text-[10px] font-black text-brand-navy/40 uppercase tracking-widest mb-2">{t('جنس البطل', "Hero's Gender")}</label>
                <div className="flex gap-3">
                  {['boy', 'girl'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setLocalData({ ...localData, childGender: g as any })}
                      className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${localData.childGender === g ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white/50 border-brand-navy/5 text-brand-navy/60 hover:border-brand-orange/30'}`}
                    >
                      {g === 'boy' ? t('ولد', 'Boy') : t('بنت', 'Girl')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-[2rem] flex items-center justify-between">
             <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-brand-teal">celebration</span>
                <span className="text-sm font-bold text-brand-navy/80">{t('مناسبة خاصة؟', 'Special Occasion?')}</span>
             </div>
             <input 
                type="text" 
                value={localData.occasion || ''} 
                onChange={(e) => setLocalData({ ...localData, occasion: e.target.value })} 
                className="bg-transparent border-b-2 border-brand-navy/5 focus:border-brand-orange outline-none px-2 py-1 text-sm font-bold text-brand-navy placeholder:text-brand-navy/20"
                placeholder={t('مثال: عيد ميلاد', 'e.g. Birthday')}
             />
          </div>
        </div>

        {/* Right Column: Character Visuals */}
        <div className="lg:col-span-7 space-y-6">
          <CharacterInput
            label={t('الشخصية الرئيسية (بطل القصة)', 'Main Character (The Hero)')}
            character={localData.mainCharacter}
            onCharacterChange={(char) => setLocalData({ ...localData, mainCharacter: char })}
            isMain={true}
            onManualEdit={() => setIsCharacterNameManuallyEdited(true)}
            language={language}
          />

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
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{t('إضافة شخصية ثانية؟', 'Add a second character?')}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${localData.useSecondCharacter ? 'bg-white text-brand-teal' : 'bg-brand-teal/10 text-brand-teal'}`}>
                        + 2.000 KWD
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
          <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
             <div className="flex items-center gap-3 border-b border-brand-navy/5 pb-4">
                <span className="material-symbols-outlined text-brand-orange">translate</span>
                <h3 className="text-xl font-bold text-brand-navy">{t('لغة القصة', 'Story Language')}</h3>
             </div>
             
             <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                {t('بأي لغة تريد كتابة قصتك؟', 'Which language should we write your story in?')}
             </p>

             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
                    { code: 'en', label: 'English', flag: '🇺🇸' },
                    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                    { code: 'es', label: 'Español', flag: '🇪🇸' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
                    { code: 'pt', label: 'Português', flag: '🇵🇹' },
                    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                    { code: 'ja', label: '日本語', flag: '🇯🇵' },
                    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                ].map((langOption) => (
                    <button
                        key={langOption.code}
                        type="button"
                        onClick={() => setLocalData({ ...localData, language: langOption.code as Language })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all group ${localData.language === langOption.code ? 'bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'bg-white/50 border-brand-navy/5 text-brand-navy/60 hover:border-brand-orange/30'}`}
                    >
                        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{langOption.flag}</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{langOption.label}</span>
                    </button>
                ))}
             </div>
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