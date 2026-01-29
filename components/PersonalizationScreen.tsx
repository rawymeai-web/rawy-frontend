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
        // Only normalize if it contains English characters
        if (/[a-zA-Z]/.test(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
    }).join(' ');
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedChildName = normalizeName(localData.childName);
    const normalizedMainCharName = normalizeName(localData.mainCharacter.name);
    const normalizedSecondCharName = localData.secondCharacter 
        ? normalizeName(localData.secondCharacter.name) 
        : '';

    const { childAge, mainCharacter, useSecondCharacter, secondCharacter } = localData;

    if (!normalizedChildName.trim()) {
        alert(language === 'ar' ? 'الرجاء إدخال اسم الطفل.' : "Please enter the child's name.");
        return;
    }
    if (!childAge.trim()) {
        alert(language === 'ar' ? 'الرجاء إدخال عمر الطفل.' : "Please enter the child's age.");
        return;
    }
    if (!normalizedMainCharName.trim()) {
        alert(language === 'ar' ? 'الرجاء إدخال اسم الشخصية الرئيسية.' : "Please enter the main character's name.");
        return;
    }
    if (mainCharacter.images.length === 0) {
        alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الرئيسية.' : 'Please upload an image for the main character.');
        return;
    }
    
    if (useSecondCharacter) {
        if (!normalizedSecondCharName.trim()) {
            alert(language === 'ar' ? 'الرجاء إدخال اسم الشخصية الثانوية.' : "Please enter the second character's name.");
            return;
        }
        if (secondCharacter && secondCharacter.images.length === 0) {
            alert(language === 'ar' ? 'الرجاء رفع صورة للشخصية الثانوية.' : "Please upload an image for the second character.");
            return;
        }
    }

    onNext({
        ...localData,
        childName: normalizedChildName,
        mainCharacter: { ...localData.mainCharacter, name: normalizedMainCharName },
        secondCharacter: localData.secondCharacter ? { ...localData.secondCharacter, name: normalizedSecondCharName } : undefined
    });
  }
  
  const handleSecondCharacterChange = (updatedChar: Partial<Character>) => {
    setLocalData(prev => ({
        ...prev,
        secondCharacter: { ...prev.secondCharacter!, ...updatedChar }
    }));
  };

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <form onSubmit={handleNext} className="max-w-3xl mx-auto space-y-8 pb-8" noValidate>
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('الخطوة الأولى: التخصيص', 'Step 1: Personalization')}</h2>
        <p className="text-lg text-brand-navy/80 font-medium">
            {t('أخبرنا قليلاً عن بطل القصة.', 'Tell us a little about the hero of the story.')}
        </p>
      </div>
      
      {/* Glassmorphism Container 1 */}
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 space-y-6">
        <h3 className="text-2xl font-bold text-brand-coral flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {t('معلومات الطفل', "Child's Information")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label htmlFor="childName" className="block text-sm font-bold text-gray-700 mb-1">{t('اسم الطفل الكامل', "Child's Full Name")}</label>
            <input
                type="text"
                id="childName"
                value={localData.childName}
                onChange={(e) => setLocalData({ ...localData, childName: e.target.value })}
                className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-coral focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder={t('مثال: سارة أحمد', 'Example: Sarah Ahmed')}
                required
            />
            </div>
            <div>
            <label htmlFor="childAge" className="block text-sm font-bold text-gray-700 mb-1">{t('عمر الطفل', "Child's Age")}</label>
            <input
                type="number"
                id="childAge"
                value={localData.childAge}
                onChange={(e) => setLocalData({ ...localData, childAge: e.target.value })}
                className="block w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-coral focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder={t('مثال: 5', 'Example: 5')}
                min="1"
                max="12"
                required
            />
            </div>
        </div>
      </div>
      
      {/* Glassmorphism Container 2 */}
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 space-y-6">
        <h3 className="text-2xl font-bold text-brand-coral flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {t('الشخصيات', 'Characters')}
        </h3>

        <CharacterInput
          label={t('الشخصية الرئيسية', 'Main Character')}
          character={localData.mainCharacter}
          onCharacterChange={(char) => setLocalData({ ...localData, mainCharacter: char })}
          isMain={true}
          onManualEdit={() => setIsCharacterNameManuallyEdited(true)}
          language={language}
        />
        
        <div className="flex items-center p-4 bg-brand-baby-blue/10 rounded-xl border border-brand-baby-blue/20">
          <input
            id="add-second-character"
            type="checkbox"
            checked={localData.useSecondCharacter}
            onChange={(e) => setLocalData({ ...localData, useSecondCharacter: e.target.checked })}
            className="h-5 w-5 text-brand-coral border-gray-300 rounded focus:ring-brand-coral transition-colors"
          />
          <label htmlFor="add-second-character" className="mx-3 block text-base font-medium text-brand-navy cursor-pointer">
            {t('إضافة شخصية ثانوية (صديق، أخ، أو حتى لعبة مفضلة!)', 'Add a second character (friend, sibling, or even a favorite toy!)')}
          </label>
        </div>

        {localData.useSecondCharacter && localData.secondCharacter && (
          <div className="animate-enter-forward p-6 border border-gray-200/50 rounded-2xl bg-white/40 space-y-4">
             <div>
              <span className="block text-sm font-bold text-gray-700 mb-2">{t('ما هي طبيعة الشخصية الثانوية؟', 'What is the second character?')}</span>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-brand-coral transition-colors">
                  <input type="radio" name="char-type" value="person" checked={localData.secondCharacter.type === 'person'} onChange={() => handleSecondCharacterChange({ type: 'person'})} className="h-4 w-4 text-brand-coral border-gray-300 focus:ring-brand-coral"/>
                  <span className="mx-2 text-sm font-medium">{t('شخص', 'Person')}</span>
                </label>
                <label className="flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-brand-coral transition-colors">
                  <input type="radio" name="char-type" value="object" checked={localData.secondCharacter.type === 'object'} onChange={() => handleSecondCharacterChange({ type: 'object'})} className="h-4 w-4 text-brand-coral border-gray-300 focus:ring-brand-coral"/>
                  <span className="mx-2 text-sm font-medium">{t('شيء (لعبة، حيوان أليف..)', 'Object (toy, pet..)')}</span>
                </label>
              </div>
            </div>

            {localData.secondCharacter.type === 'person' && (
                <div className="animate-fade-in">
                    <label htmlFor="secondCharacterAge" className="block text-sm font-medium text-gray-700 mb-1">{t('عمر الشخصية الثانوية (اختياري)', "Second Character's Age (optional)")}</label>
                    <input
                        type="number"
                        id="secondCharacterAge"
                        value={localData.secondCharacter.age}
                        onChange={(e) => handleSecondCharacterChange({ age: e.target.value })}
                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-coral focus:border-transparent text-gray-900"
                        placeholder={t('مثال: 7', 'Example: 7')}
                        min="0"
                        max="99"
                    />
                </div>
            )}
            <CharacterInput
              label={t('الشخصية الثانوية', 'Second Character')}
              character={localData.secondCharacter}
              onCharacterChange={(char) => setLocalData({ ...localData, secondCharacter: char })}
              isMain={false}
              language={language}
            />
          </div>
        )}
      </div>

      <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
        <Button type="button" onClick={onBack} variant="outline" className="text-xl px-10 py-4 rounded-2xl border-2">
            {t('رجوع', 'Back')}
        </Button>
        <Button type="submit" className="text-xl px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
          {t('التالي: اختيار وضع القصة', 'Next: Choose Story Mode')}
        </Button>
      </div>
    </form>
  );
};

export default PersonalizationScreen;