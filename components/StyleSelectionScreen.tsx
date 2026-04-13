import React, { useState, useEffect, useMemo } from 'react';
import type { StoryData, Language } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { backendApi } from '../services/backendApi';
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
    secondImageBase64?: string;
    errorMessage?: string;
}

const StyleCard: React.FC<{
    preview: StylePreview;
    isSelected: boolean;
    onClick: () => void;
    language: Language;
    displayType?: 'primary' | 'secondary';
}> = ({ preview, isSelected, onClick, language, displayType = 'primary' }) => {
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
                {preview.status === 'done' && (
                    <div className="w-full h-full p-2">
                        {displayType === 'primary' && preview.imageBase64 && (
                            <img
                                src={`data:image/jpeg;base64,${preview.imageBase64}`}
                                alt={preview.name}
                                className="w-full h-full object-cover rounded-lg shadow-sm"
                            />
                        )}
                        {displayType === 'secondary' && preview.secondImageBase64 && (
                            <img
                                src={`data:image/jpeg;base64,${preview.secondImageBase64}`}
                                alt="Second Hero"
                                className="w-full h-full object-cover rounded-lg shadow-sm"
                            />
                        )}
                    </div>
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
    const [selectedPrimaryIndex, setSelectedPrimaryIndex] = useState<number | null>(null);
    const [selectedSecondaryIndex, setSelectedSecondaryIndex] = useState<number | null>(null);

    const lastRequestKey = React.useRef<string>("");

    const [debugStatus, setDebugStatus] = useState<string>("Initializing...");

    useEffect(() => {
        let isMounted = true;

        const generateVariations = async () => {
            // 1. Validation
            if (!storyData.mainCharacter.imageBases64 || storyData.mainCharacter.imageBases64.length === 0) {
                if (isMounted) setDebugStatus("Waiting for Reference Image...");
                return;
            }

            // 2. Dedup Logic (Strict Mode Safe + Retry Safe)
            const currentKey = `${storyData.mainCharacter.name}-${storyData.selectedStylePrompt}-${storyData.childAge}`;

            if (lastRequestKey.current === currentKey) {
                // SAFETY: Only skip if we are ACTUALLY working or done.
                // If the key is locked but everything is 'pending', we are stuck. Break the lock.
                const isWorking = previews.some(p => p.status === 'done' || p.status === 'loading');
                if (isWorking) {
                    if (isMounted) setDebugStatus("Ready (Cached)");
                    return;
                }
                console.warn("Detected Stuck Cache Lock (No Progress). Forcing Reboot of Logic...");
            }

            // Lock it immediately
            lastRequestKey.current = currentKey;

            if (isMounted) setDebugStatus("Starting Generation Engine...");
            console.log("Starting Style Verification for:", currentKey);

            // Safe Settings Fetch
            let delay = 0;
            try {
                const settings = await adminService.getSettings();
                delay = settings.generationDelay;
            } catch (e) {
                console.warn("Settings fetch failed, using default delay", e);
            }

            // 🚀 PARALLEL: Fire all 4 variation calls at the same time
            // Each card shows its own spinner while its individual call is in-flight.
            // Total wait = time of the SLOWEST single call (~15-20s), not 4x that.
            if (isMounted) setDebugStatus("Generating all 4 variations in parallel...");
            setPreviews(prev => prev.map(p => ({ ...p, status: 'loading' })));

            const callPreview = async (index: number) => {
                try {
                    const { imageBase64, secondImageBase64 } = await backendApi.generatePreview({
                        character: storyData.mainCharacter,
                        secondCharacter: (storyData.useSecondCharacter && storyData.secondCharacter?.type !== 'object') ? storyData.secondCharacter : undefined,
                        themeDescription: storyData.theme || "Likeness Portrait",
                        themeId: storyData.themeId,
                        stylePrompt: storyData.selectedStylePrompt,
                        age: storyData.childAge || "5"
                    }) as any;

                    if (isMounted) {
                        setPreviews(prev => prev.map((p, idx) => idx === index
                            ? { ...p, status: 'done', imageBase64, secondImageBase64 }
                            : p
                        ));
                        setSelectedPrimaryIndex(prev => prev === null ? index : prev);
                        if (storyData.useSecondCharacter) {
                            setSelectedSecondaryIndex(prev => prev === null ? index : prev);
                        }
                    }
                } catch (e: any) {
                    console.error(`Preview ${index} failed:`, e);
                    if (isMounted) {
                        setPreviews(prev => prev.map((p, idx) => idx === index
                            ? { ...p, status: 'error', errorMessage: e.message || "Unknown error" }
                            : p
                        ));
                    }
                }
            };

            // Fire all 4 in parallel — each resolves independently and updates its own card
            await Promise.all(previews.map((_, i) => callPreview(i)));

            if (isMounted) setDebugStatus("Generation Complete");

        };
        generateVariations();
        return () => { isMounted = false; };
    }, [storyData.mainCharacter, storyData.selectedStylePrompt]);

    const handleNext = async () => {
        if (selectedPrimaryIndex === null) return;
        const isSecondSubjectObject = storyData.secondCharacter?.type === 'object';
        if (storyData.useSecondCharacter && !isSecondSubjectObject && selectedSecondaryIndex === null) return;

        const primaryChoice = previews[selectedPrimaryIndex];
        const secondaryChoice = (storyData.useSecondCharacter && !isSecondSubjectObject) ? previews[selectedSecondaryIndex!] : null;

        if (!primaryChoice.imageBase64) return;
        if (storyData.useSecondCharacter && !isSecondSubjectObject && (!secondaryChoice || !secondaryChoice.secondImageBase64)) return;

        setIsLocking(true);
        try {
            // Parallel: Get Style Guide AND Detailed Character Description (for consistency)
            const promises: Promise<any>[] = [
                backendApi.generateStyleGuide({ imageBase64: primaryChoice.imageBase64, stylePrompt: primaryChoice.prompt }),
                backendApi.describeSubject({ imageBase64: primaryChoice.imageBase64 })
            ];
            
            if (isSecondSubjectObject && storyData.secondCharacter?.imageBases64?.[0]) {
                promises.push(backendApi.describeSubject({ imageBase64: storyData.secondCharacter.imageBases64[0] }));
            }

            const results = await Promise.all(promises);
            const { guide } = results[0];
            const { description: charDesc } = results[1];
            
            // Extract the actual description for the object if it was requested
            const secondObjDesc = (isSecondSubjectObject && storyData.secondCharacter?.imageBases64?.[0] && results[2]) 
                ? results[2].description 
                : storyData.secondCharacter?.description;

            onNext({
                styleReferenceImageBase64: primaryChoice.imageBase64,
                secondCharacterImageBase64: isSecondSubjectObject ? storyData.secondCharacter?.imageBases64[0] : (secondaryChoice ? secondaryChoice.secondImageBase64 : undefined),
                technicalStyleGuide: guide,
                styleSeed: Math.floor(Math.random() * 1000000),
                // CRITICAL: Save the generated description and the ACTUAL chosen image to imageDNA
                mainCharacter: {
                    ...storyData.mainCharacter,
                    description: charDesc,
                    imageDNA: [primaryChoice.imageBase64]
                },
                secondCharacter: storyData.secondCharacter ? {
                    ...storyData.secondCharacter,
                    description: secondObjDesc,
                    imageDNA: [isSecondSubjectObject ? storyData.secondCharacter.imageBases64[0] : (secondaryChoice?.secondImageBase64 || primaryChoice.imageBase64)]
                } : undefined
            });
        } catch (e) {
            console.error("Locking failed:", e);
            // Fallback: Proceed without description if it fails (better than blocking)
            onNext({
                styleReferenceImageBase64: primaryChoice.imageBase64,
                secondCharacterImageBase64: isSecondSubjectObject ? storyData.secondCharacter?.imageBases64[0] : secondaryChoice?.secondImageBase64,
                mainCharacter: {
                    ...storyData.mainCharacter,
                    imageDNA: [primaryChoice.imageBase64]
                },
                secondCharacter: storyData.secondCharacter ? {
                    ...storyData.secondCharacter,
                    imageDNA: [isSecondSubjectObject ? storyData.secondCharacter.imageBases64[0] : (secondaryChoice?.secondImageBase64 || primaryChoice.imageBase64)]
                } : undefined
            });
        } finally {
            setIsLocking(false);
        }
    };

    const handleRetry = () => {
        lastRequestKey.current = ""; // Reset lock
        setPreviews(prev => prev.map(p => ({ ...p, status: 'pending', imageBase64: undefined, errorMessage: undefined })));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-brand-navy drop-shadow-sm">{t('معاينة بطل القصة', 'Verify The Hero')}</h2>
                <p className="text-lg text-brand-navy/80 max-w-2xl mx-auto">
                    {t('شاهد طفلك داخل عالم القصة! اختر الصورة التي تمثل روحه بأفضل شكل.', 'Your child, entering the story world! Choose the version that best captures their spirit in this theme.')}
                </p>
            </div>

            {/* Debug Status Monitor */}
            <div className="text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${debugStatus.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    System Status: {debugStatus}
                </span>
            </div>

            <div className="p-8 bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-brand-navy mb-4">
                        {storyData.useSecondCharacter
                            ? t(`البطل الأول: ${storyData.mainCharacter.name}`, `Hero 1: ${storyData.mainCharacter.name}`)
                            : t('اختر نمط الرسم', 'Choose Art Style')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {previews.map((p, i) => (
                            <div key={`primary-${i}`} className="relative">
                                <StyleCard preview={p} isSelected={selectedPrimaryIndex === i} onClick={() => setSelectedPrimaryIndex(i)} language={language} displayType="primary" />
                                {p.status === 'error' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-xl p-2 text-center">
                                        <p className="text-xs text-red-600 font-bold">{t('فشل التوليد', 'Generation Failed')}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {storyData.useSecondCharacter && storyData.secondCharacter?.type !== 'object' && (
                    <div className="pt-8 border-t border-brand-orange/20">
                        <h3 className="text-xl font-bold text-brand-navy mb-4">
                            {t(`البطل الثاني: ${storyData.secondCharacter?.name || ''}`, `Hero 2: ${storyData.secondCharacter?.name || ''}`)}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {previews.map((p, i) => (
                                <div key={`secondary-${i}`} className="relative">
                                    <StyleCard preview={p} isSelected={selectedSecondaryIndex === i} onClick={() => setSelectedSecondaryIndex(i)} language={language} displayType="secondary" />
                                    {p.status === 'error' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-xl p-2 text-center">
                                            <p className="text-xs text-red-600 font-bold">{t('فشل التوليد', 'Generation Failed')}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-6">
                <Button onClick={onBack} variant="outline" className="text-xl px-12 py-4 rounded-2xl">{t('رجوع', 'Back')}</Button>
                <Button onClick={handleRetry} variant="secondary" className="text-xl px-12 py-4 rounded-2xl shadow-sm text-brand-navy bg-white hover:bg-gray-50">
                    {t('إعادة المحاولة', 'Regenerate All')}
                </Button>
                <Button onClick={handleNext} className="text-xl px-12 py-4 rounded-2xl shadow-xl" disabled={selectedPrimaryIndex === null || (storyData.useSecondCharacter && storyData.secondCharacter?.type !== 'object' && selectedSecondaryIndex === null) || isLocking}>
                    {isLocking ? t('جاري القفل...', 'Locking DNA...') : t('اعتماد الأسلوب المختار', 'Lock Art Style')}
                </Button>
            </div>
        </div>
    );
};

export default StyleSelectionScreen;