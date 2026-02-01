import React, { useState, useEffect, useMemo } from 'react';
import type { StoryData, Language } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';
import * as geminiService from '../services/geminiService';
import * as adminService from '../services/adminService';
import { ART_STYLE_OPTIONS } from '../constants';

interface StyleSelectionScreenProps {
    onNext: (data: Partial<StoryData>) => void;
    onBack: () => void;
    storyData: StoryData;
    language: Language;
}

type GenerationStatus = 'pending' | 'loading' | 'done' | 'error';
interface StylePreview {
    id: string;
    name: string;
    prompt: string;
    status: GenerationStatus;
    imageBase64?: string;
    errorMessage?: string;
}

const StyleCard: React.FC<{
    preview: StylePreview;
    isSelected: boolean;
    onClick: () => void;
    language: Language;
}> = ({ preview, isSelected, onClick, language }) => {
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    return (
        <button
            onClick={onClick}
            disabled={preview.status !== 'done'}
            className={`relative p-3 text-center rounded-2xl transition-all duration-300 h-full flex flex-col items-center justify-start w-full group ${isSelected
                ? 'bg-white shadow-2xl ring-4 ring-brand-coral scale-105 z-10'
                : 'bg-white/60 backdrop-blur-md hover:bg-white hover:shadow-xl hover:scale-105 border border-white/50'
                } ${preview.status !== 'done' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
            aria-pressed={isSelected}
        >
            <div className="relative aspect-square w-full bg-gray-100/50 rounded-xl flex items-center justify-center mb-4 overflow-hidden shadow-inner">
                {preview.status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Spinner />
                        <span className="text-xs text-gray-500 mt-2 font-medium animate-pulse">Rendering...</span>
                    </div>
                )}
                {preview.status === 'done' && preview.imageBase64 && (
                    <img src={`data:image/jpeg;base64,${preview.imageBase64}`} alt={preview.name} className="w-full h-full object-cover" />
                )}
                {preview.status === 'error' && (
                    <div className="flex flex-col items-center justify-center text-red-500 p-2 text-center h-full w-full absolute inset-0 bg-white/90 z-20">
                        <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="text-[10px] font-bold">Failed</span>
                        {/* Exposed Error Message for Debugging */}
                        <span className="text-[9px] mt-1 break-words w-full px-1 leading-tight text-red-700 opacity-80 overflow-y-auto max-h-[80px]" title={preview.errorMessage || "Unknown Error"}>
                            {preview.errorMessage || "Unknown Error"}
                        </span>
                    </div>
                )}
                {isSelected && (
                    <div className="absolute inset-0 border-4 border-brand-coral flex items-start justify-end p-2">
                        <div className="bg-white text-brand-coral rounded-full p-2 shadow-lg transform scale-125">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                )}
            </div>
            <h4 className={`font-bold text-sm md:text-base transition-colors ${isSelected ? 'text-brand-coral' : 'text-brand-navy'}`}>
                {t('معاينة', 'Preview')} {preview.id}
            </h4>
        </button>
    );
};

const StyleSelectionScreen: React.FC<StyleSelectionScreenProps> = ({ onNext, onBack, storyData, language }) => {
    const [isLocking, setIsLocking] = useState(false);
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    // Generate 4 variations of the SELECTED style category
    const [previews, setPreviews] = useState<StylePreview[]>(
        [1, 2, 3, 4].map(i => ({
            id: i.toString(),
            name: storyData.selectedStyleNames?.[0] || 'Default',
            prompt: storyData.selectedStylePrompt,
            status: 'pending'
        }))
    );
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        const generateVariations = async () => {
            if (storyData.mainCharacter.imageBases64.length === 0) return;
            const settings = await adminService.getSettings();

            for (let i = 0; i < previews.length; i++) {
                if (previews[i].status === 'done') continue;
                if (i > 0) await new Promise(resolve => setTimeout(resolve, settings.generationDelay));

                setPreviews(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'loading' } : p));
                try {
                    const { imageBase64 } = await geminiService.generateThemeStylePreview(
                        storyData.mainCharacter,
                        undefined,
                        storyData.theme || "Likeness Portrait",
                        storyData.selectedStylePrompt,
                        storyData.childAge || "5",
                        Math.floor(Math.random() * 1000000) // Random seed for variations
                    );
                    setPreviews(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', imageBase64 } : p));
                    if (selectedIndex === null) setSelectedIndex(i); // Auto-select first done
                } catch (e: any) {
                    console.error(`Preview ${i} failed:`, e);
                    setPreviews(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', errorMessage: e.message || "Unknown error" } : p));
                }
            }
        };
        generateVariations();
    }, [storyData.mainCharacter, storyData.selectedStylePrompt]);

    const handleNext = async () => {
        if (selectedIndex === null) return;
        const selected = previews[selectedIndex];
        if (!selected.imageBase64) return;

        setIsLocking(true);
        try {
            const guide = await geminiService.generateTechnicalStyleGuide(selected.imageBase64, selected.prompt);
            onNext({
                styleReferenceImageBase64: selected.imageBase64,
                technicalStyleGuide: guide,
                styleSeed: Math.floor(Math.random() * 1000000)
            });
        } catch (e) {
            onNext({ styleReferenceImageBase64: selected.imageBase64 });
        } finally {
            setIsLocking(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('معاينة بطل القصة', 'Verify The Hero')}</h2>
                <p className="text-lg text-brand-navy/80 max-w-2xl mx-auto">
                    {t('شاهد طفلك داخل عالم القصة! اختر الصورة التي تمثل روحه بأفضل شكل.', 'Your child, entering the story world! Choose the version that best captures their spirit in this theme.')}
                </p>
            </div>

            <div className="p-8 bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {previews.map((p, i) => (
                        <StyleCard key={i} preview={p} isSelected={selectedIndex === i} onClick={() => setSelectedIndex(i)} language={language} />
                    ))}
                </div>
            </div>

            <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-6">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-2xl">{t('رجوع', 'Back')}</Button>
                <Button onClick={handleNext} className="text-xl px-12 py-4 rounded-2xl shadow-xl" disabled={selectedIndex === null || isLocking}>
                    {isLocking ? t('جاري القفل...', 'Locking DNA...') : t('اعتماد الأسلوب المختار', 'Lock Art Style')}
                </Button>
            </div>
        </div>
    );
};

export default StyleSelectionScreen;