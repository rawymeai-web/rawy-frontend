
import React, { useState } from 'react';
import type { StoryData, Language } from '../types';
import { Button } from './Button';

interface DebugMethodScreenProps {
  onNext: (data: Partial<StoryData>) => void;
  onBack: () => void;
  storyData: StoryData;
  language: Language;
}

const DEBUG_METHODS = [
    { id: 'method1', name: 'Method 1: Character Sheet (Pro)', description: 'Highest consistency using a pre-generated character model. Uses Nano 3.' },
    { id: 'method2', name: 'Method 2: Direct Photo - Structured (Pro)', description: 'Uses the photo directly with a detailed prompt structure. Uses Nano 3.' },
    { id: 'method3', name: 'Method 3: Direct Photo - Simple (Pro)', description: 'Uses the photo directly with a simple, creative prompt. Uses Nano 3.' },
    { id: 'method4', name: 'Method 4: Direct Style Transformation (Pro)', description: 'Photo-to-style transformation ensuring strict likeness and style integration. Uses Nano 3.' },
];


const DebugMethodScreen: React.FC<DebugMethodScreenProps> = ({ onNext, onBack, storyData, language }) => {
    const [selectedMethods, setSelectedMethods] = useState<string[]>(storyData.selectedDebugMethods || []);

    const handleToggleMethod = (methodId: string) => {
        setSelectedMethods(prev => 
            prev.includes(methodId)
                ? prev.filter(id => id !== methodId)
                : [...prev, methodId]
        );
    };

    const handleNext = () => {
        if (selectedMethods.length === 0) {
            alert(language === 'ar' ? 'الرجاء اختيار طريقة واحدة على الأقل.' : 'Please select at least one method.');
            return;
        }
        onNext({ selectedDebugMethods: selectedMethods });
    };
    
    const handleSelectAll = () => {
        if (selectedMethods.length === DEBUG_METHODS.length) {
            setSelectedMethods([]); // Deselect all
        } else {
            setSelectedMethods(DEBUG_METHODS.map(s => s.id)); // Select all
        }
    };

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-brand-navy text-center">{t('الخطوة الخامسة: اختر طرق الإنشاء للمقارنة', 'Step 5: Choose Generation Methods to Compare')}</h2>
            <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                {t('حدد طرق إنشاء الصور التي ترغب في تشغيلها. ستظهر النتائج جنبًا إلى جنب في "عرض تصحيح الأخطاء" للمقارنة.', 'Select which image generation methods you want to run. The results will appear side-by-side in the "Debug View" for comparison.')}
            </p>

            <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex justify-end mb-4">
                    <Button onClick={handleSelectAll} variant="outline" className="!px-4 !py-1.5 text-sm">
                        {selectedMethods.length === DEBUG_METHODS.length ? t('إلغاء تحديد الكل', 'Deselect All') : t('تحديد الكل', 'Select All')}
                    </Button>
                </div>
                <div className="space-y-4">
                    {DEBUG_METHODS.map(method => (
                        <label
                            key={method.id}
                            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedMethods.includes(method.id)
                                    ? 'bg-brand-baby-blue/30 border-brand-coral'
                                    : 'bg-white hover:bg-gray-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedMethods.includes(method.id)}
                                onChange={() => handleToggleMethod(method.id)}
                                className="h-5 w-5 text-brand-coral border-gray-300 rounded focus:ring-brand-coral mt-1"
                            />
                            <div className="mx-3">
                                <span className="font-semibold text-brand-navy">{method.name}</span>
                                <p className="text-sm text-gray-600">{method.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4">
                    {t('رجوع', 'Back')}
                </Button>
                <Button onClick={handleNext} className="text-xl px-12 py-4" disabled={selectedMethods.length === 0}>
                    {t('التالي: اختيار الحجم', 'Next: Choose Size')}
                </Button>
            </div>
        </div>
    );
};

export default DebugMethodScreen;
