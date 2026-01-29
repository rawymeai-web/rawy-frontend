
import React, { useState, useEffect } from 'react';
import type { StoryData, Language } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';
import * as geminiService from '../services/geminiService';
import { ART_STYLE_OPTIONS } from '../constants';

interface StyleCharacterScreenProps {
  onNext: (data: Partial<StoryData>) => void;
  onBack: () => void;
  storyData: StoryData;
  language: Language;
}

type GenerationStatus = 'pending' | 'loading' | 'done' | 'error';
interface StylePreview {
  name: string;
  prompt: string;
  status: GenerationStatus;
  imageBase64?: string;
}

const StyleCard: React.FC<{
  preview: StylePreview;
  isSelected: boolean;
  onClick: () => void;
}> = ({ preview, isSelected, onClick }) => (
    <button
        onClick={onClick}
        disabled={preview.status !== 'done'}
        className={`p-4 text-center rounded-xl shadow-md transition-all h-full flex flex-col items-center justify-start border-2 w-full ${
            isSelected
                ? 'bg-brand-baby-blue/30 border-brand-coral scale-105 ring-2 ring-brand-coral ring-offset-2'
                : 'bg-white hover:bg-gray-50 hover:border-brand-baby-blue border-gray-200'
        } ${preview.status !== 'done' ? 'cursor-not-allowed' : ''}`}
        aria-pressed={isSelected}
    >
        <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
            {preview.status === 'loading' && <Spinner />}
            {preview.status === 'error' && <div className="text-red-500 p-2 text-xs">Failed to generate</div>}
            {preview.status === 'done' && preview.imageBase64 && (
                <img src={`data:image/jpeg;base64,${preview.imageBase64}`} alt={preview.name} className="w-full h-full object-cover"/>
            )}
        </div>
        <h4 className="font-bold text-brand-navy text-sm md:text-base leading-tight">{preview.name}</h4>
    </button>
);


const StyleCharacterScreen: React.FC<StyleCharacterScreenProps> = ({ onNext, onBack, storyData, language }) => {
    const [previews, setPreviews] = useState<StylePreview[]>(
        ART_STYLE_OPTIONS.map(opt => ({ ...opt, status: 'pending' }))
    );
    const [selectedStyleName, setSelectedStyleName] = useState<string | null>(null);

    useEffect(() => {
        const generateAllPreviews = async () => {
            if (!storyData.mainCharacter.imageBases64) return;

            // Use a dummy theme description for style generation
            const themeDescription = "A magical adventure in a wondrous land.";

            for (const option of ART_STYLE_OPTIONS) {
                setPreviews(prev => prev.map(p => p.name === option.name ? { ...p, status: 'loading' } : p));
                try {
                    // FIX: Destructure imageBase64 from response object
                    const { imageBase64 } = await geminiService.generateThemeStylePreview(
                        storyData.mainCharacter,
                        undefined,
                        themeDescription,
                        option.prompt
                    );
                    setPreviews(prev => prev.map(p => p.name === option.name ? { ...p, status: 'done', imageBase64 } : p));
                } catch (error) {
                    console.error(`Failed to generate preview for ${option.name}:`, error);
                    setPreviews(prev => prev.map(p => p.name === option.name ? { ...p, status: 'error' } : p));
                }
            }
        };

        generateAllPreviews();
    }, [storyData.mainCharacter.imageBases64]);

    const handleNext = () => {
        if (!selectedStyleName) return;
        const selected = previews.find(p => p.name === selectedStyleName);
        if (!selected || !selected.imageBase64) return;

        onNext({
            selectedStylePrompt: selected.prompt,
            styleReferenceImageBase64: selected.imageBase64,
        });
    };

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const isNextDisabled = !selectedStyleName || previews.find(p => p.name === selectedStyleName)?.status !== 'done';

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-brand-navy text-center">{t('الخطوة الثانية: اختر أسلوب الرسم', 'Step 2: Choose Your Art Style')}</h2>
            <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                {t('لقد أنشأنا معاينات لشخصيتك بأنماط مختلفة. اختر المفضل لديك لتحديد شكل الكتاب بأكمله!', 'We\'ve generated previews of your character in different styles. Pick your favorite to set the look for the entire book!')}
            </p>
            
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previews.map(preview => (
                        <StyleCard
                            key={preview.name}
                            preview={preview}
                            isSelected={selectedStyleName === preview.name}
                            onClick={() => setSelectedStyleName(preview.name)}
                        />
                    ))}
                </div>
            </div>

            <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4">
                    {t('رجوع', 'Back')}
                </Button>
                <Button onClick={handleNext} className="text-xl px-12 py-4" disabled={isNextDisabled}>
                    {t('اختيار موضوع القصة', 'Choose Story Theme')}
                </Button>
            </div>
        </div>
    );
};

export default StyleCharacterScreen;
