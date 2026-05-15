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
            className={`relative p-4 rounded-[2rem] transition-all duration-500 flex flex-col items-center justify-start w-full group overflow-hidden ${isSelected
                ? 'bg-brand-orange text-white shadow-2xl shadow-brand-orange/30 scale-[1.02] z-10'
                : 'glass-panel bg-white/30 hover:bg-white/60 hover:shadow-xl hover:-translate-y-2'
                } ${preview.status !== 'done' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
            aria-pressed={isSelected}
        >
            <div className="relative aspect-square w-full bg-black/5 rounded-[1.5rem] flex items-center justify-center mb-4 overflow-hidden shadow-inner group-hover:shadow-none transition-all">
                {preview.status === 'loading' && (
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full border-4 border-brand-orange/10 border-t-brand-orange animate-spin"></div>
                        <span className="text-[10px] font-black text-brand-navy/30 uppercase tracking-widest animate-pulse">{t('جاري التلوين...', 'Painting...')}</span>
                    </div>
                )}
                
                {preview.status === 'done' && (
                    <div className="w-full h-full p-2">
                        {displayType === 'primary' && preview.imageBase64 && (
                            <img
                                src={`data:image/jpeg;base64,${preview.imageBase64}`}
                                alt={preview.name}
                                className="w-full h-full object-cover rounded-[1rem] shadow-sm transition-transform duration-700 group-hover:scale-110"
                            />
                        )}
                        {displayType === 'secondary' && preview.secondImageBase64 && (
                            <img
                                src={`data:image/jpeg;base64,${preview.secondImageBase64}`}
                                alt="Second Hero"
                                className="w-full h-full object-cover rounded-[1rem] shadow-sm transition-transform duration-700 group-hover:scale-110"
                            />
                        )}
                    </div>
                )}

                {preview.status === 'error' && (
                    <div className="flex flex-col items-center justify-center text-red-500 p-6 text-center h-full w-full absolute inset-0 bg-white/95 z-20">
                        <span className="material-symbols-outlined text-4xl mb-2">error</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('حدث خطأ', 'Failed')}</span>
                        <p className="text-[9px] mt-2 leading-tight opacity-60 line-clamp-3">{preview.errorMessage}</p>
                    </div>
                )}

                {isSelected && (
                    <div className="absolute top-4 right-4 bg-white text-brand-orange rounded-full p-1.5 shadow-2xl z-30 animate-pop border-2 border-brand-orange/20">
                        <span className="material-symbols-outlined text-xl font-black">check_circle</span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-between w-full px-2">
               <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-white/60' : 'text-brand-navy/30'}`}>
                 {t('معاينة', 'Preview')} {preview.id}
               </span>
               {!isSelected && preview.status === 'done' && (
                 <span className="material-symbols-outlined text-brand-orange/40 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
               )}
            </div>
        </button>
    );
};

const StyleSelectionScreen: React.FC<StyleSelectionScreenProps> = ({ onNext, onBack, storyData, language }) => {
    const [isLocking, setIsLocking] = useState(false);
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

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
            if (!storyData.mainCharacter.imageBases64 || storyData.mainCharacter.imageBases64.length === 0) {
                if (isMounted) setDebugStatus("Waiting for Reference Image...");
                return;
            }
            const currentKey = `${storyData.mainCharacter.name}-${storyData.selectedStylePrompt}-${storyData.childAge}`;
            if (lastRequestKey.current === currentKey) {
                const isWorking = previews.some(p => p.status === 'done' || p.status === 'loading');
                if (isWorking) {
                    if (isMounted) setDebugStatus("Ready (Cached)");
                    return;
                }
            }
            lastRequestKey.current = currentKey;
            if (isMounted) setDebugStatus("Starting Generation Engine...");
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
            await Promise.all(previews.map((_, i) => callPreview(i)));
            if (isMounted) setDebugStatus("Generation Complete");
        };
        generateVariations();
        return () => { isMounted = false; };
    }, [storyData.mainCharacter, storyData.selectedStylePrompt]);

    const handleNext = async () => {
        if (selectedPrimaryIndex === null) return;

        const isSecondSubjectObject = storyData.secondCharacter?.type === 'object';
        const isDualHero = storyData.useSecondCharacter && !isSecondSubjectObject;

        if (isDualHero && selectedSecondaryIndex === null) return;

        const primaryChoice = previews[selectedPrimaryIndex];
        const secondaryChoice = isDualHero ? previews[selectedSecondaryIndex!] : null;

        if (!primaryChoice?.imageBase64) return;

        // ─── GUARD: Block lock if Hero B card has no secondImageBase64 ─────────
        if (isDualHero && !secondaryChoice?.secondImageBase64) {
            alert(
                t(
                    'لم يتم تحميل صورة البطل الثاني بشكل صحيح. يرجى الضغط على "إعادة المحاولة" واختيار بطاقة أخرى.',
                    'Hero B\'s preview didn\'t load correctly for this card. Please tap "Regenerate" and choose a different preview.'
                )
            );
            return;
        }

        setIsLocking(true);
        const lockedAt = new Date().toISOString();

        try {
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
            const secondObjDesc = (isSecondSubjectObject && storyData.secondCharacter?.imageBases64?.[0] && results[2])
                ? results[2].description
                : storyData.secondCharacter?.description;

            // ─── Hero B DNA: use secondImageBase64 ONLY — never fall back to Hero A ─
            const heroBDNAImage = isSecondSubjectObject
                ? storyData.secondCharacter?.imageBases64[0]
                : secondaryChoice?.secondImageBase64; // undefined if no dual hero

            // ─── DNA Audit Trail ─────────────────────────────────────────────────────
            const dnaAudit: StoryData['dnaAudit'] = {
                heroA: {
                    selectedPreviewIndex: selectedPrimaryIndex,
                    lockedImageBase64Prefix: primaryChoice.imageBase64.substring(0, 100),
                    lockedAt,
                },
                ...(isDualHero && secondaryChoice ? {
                    heroB: {
                        selectedPreviewIndex: selectedSecondaryIndex!,
                        lockedImageBase64Prefix: (secondaryChoice.secondImageBase64 || '').substring(0, 100),
                        validSecondImagePresent: Boolean(secondaryChoice.secondImageBase64),
                        lockedAt,
                    }
                } : {})
            };

            onNext({
                styleReferenceImageBase64: primaryChoice.imageBase64,
                secondCharacterImageBase64: heroBDNAImage,
                technicalStyleGuide: guide,
                styleSeed: Math.floor(Math.random() * 1000000),
                dnaAudit,
                mainCharacter: {
                    ...storyData.mainCharacter,
                    description: charDesc,
                    imageDNA: [primaryChoice.imageBase64]
                },
                secondCharacter: storyData.secondCharacter ? {
                    ...storyData.secondCharacter,
                    description: secondObjDesc,
                    imageDNA: heroBDNAImage ? [heroBDNAImage] : storyData.secondCharacter.imageDNA
                } : undefined
            });

        } catch (e) {
            console.error("Locking failed:", e);
            // Even on API error, still save the audit and whatever DNA we have
            const heroBDNAImage = isSecondSubjectObject
                ? storyData.secondCharacter?.imageBases64[0]
                : secondaryChoice?.secondImageBase64;

            onNext({
                styleReferenceImageBase64: primaryChoice.imageBase64,
                secondCharacterImageBase64: heroBDNAImage,
                dnaAudit: {
                    heroA: {
                        selectedPreviewIndex: selectedPrimaryIndex,
                        lockedImageBase64Prefix: primaryChoice.imageBase64.substring(0, 100),
                        lockedAt,
                    },
                    ...(isDualHero && secondaryChoice ? {
                        heroB: {
                            selectedPreviewIndex: selectedSecondaryIndex!,
                            lockedImageBase64Prefix: (secondaryChoice.secondImageBase64 || '').substring(0, 100),
                            validSecondImagePresent: Boolean(secondaryChoice.secondImageBase64),
                            lockedAt,
                        }
                    } : {})
                },
                mainCharacter: {
                    ...storyData.mainCharacter,
                    imageDNA: [primaryChoice.imageBase64]
                },
                secondCharacter: storyData.secondCharacter ? {
                    ...storyData.secondCharacter,
                    imageDNA: heroBDNAImage ? [heroBDNAImage] : storyData.secondCharacter.imageDNA
                } : undefined
            });
        } finally {
            setIsLocking(false);
        }
    };


    const handleRetry = () => {
        lastRequestKey.current = ""; 
        setPreviews(prev => prev.map(p => ({ ...p, status: 'pending', imageBase64: undefined, errorMessage: undefined })));
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 animate-enter-forward">
            
            <div className="text-center space-y-4 mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 rounded-full mb-2">
                   <span className="material-symbols-outlined text-brand-orange text-sm">face</span>
                   <span className="text-xs font-bold text-brand-orange tracking-widest uppercase">{t('تأكيد المظهر', 'HERO PREVIEW')}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-brand-navy leading-tight">
                  {t('بطلنا في ', 'Our Hero in the ')}
                  <span className="text-brand-orange">{t('عالم القصة', 'Story World')}</span>
                </h2>
                <p className="text-brand-navy/60 font-medium max-w-2xl mx-auto">
                    {t('شاهد طفلك داخل عالم القصة! اختر الصورة التي تمثل روحه بأفضل شكل.', 'Your child, entering the story world! Choose the version that best captures their spirit.')}
                </p>
            </div>

            <div className="space-y-12">
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-brand-navy/5 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center font-black">1</div>
                            <h3 className="text-xl font-black text-brand-navy">
                                {storyData.useSecondCharacter
                                    ? t(`المظهر الأساسي: ${storyData.mainCharacter.name}`, `Primary Hero: ${storyData.mainCharacter.name}`)
                                    : t('اختر نمط الرسم المفضل', 'Choose Your Favorite Look')}
                            </h3>
                        </div>
                        <div className="hidden md:flex items-center gap-2 bg-brand-teal/5 px-4 py-2 rounded-full border border-brand-teal/10">
                            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
                            <span className="text-[10px] font-black text-brand-teal uppercase tracking-widest">{debugStatus}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {previews.map((p, i) => (
                            <StyleCard key={`primary-${i}`} preview={p} isSelected={selectedPrimaryIndex === i} onClick={() => setSelectedPrimaryIndex(i)} language={language} displayType="primary" />
                        ))}
                    </div>
                </div>

                {storyData.useSecondCharacter && storyData.secondCharacter?.type !== 'object' && (
                    <div className="space-y-8 pt-8 animate-enter-forward">
                        <div className="flex items-center gap-4 border-b border-brand-navy/5 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-teal text-white flex items-center justify-center font-black">2</div>
                            <h3 className="text-xl font-black text-brand-navy">
                                {t(`مظهر البطل الثاني: ${storyData.secondCharacter?.name || ''}`, `Secondary Hero: ${storyData.secondCharacter?.name || ''}`)}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {previews.map((p, i) => (
                                <StyleCard key={`secondary-${i}`} preview={p} isSelected={selectedSecondaryIndex === i} onClick={() => setSelectedSecondaryIndex(i)} language={language} displayType="secondary" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-20 max-w-3xl mx-auto">
                <button 
                    onClick={onBack} 
                    className="w-full md:w-1/3 glass-panel py-5 rounded-full font-bold text-brand-navy hover:bg-white/60 transition-all"
                >
                    {t('رجوع', 'Back')}
                </button>
                
                <button 
                    onClick={handleRetry} 
                    className="w-full md:w-1/3 glass-panel py-5 rounded-full font-bold text-brand-navy hover:bg-white/60 transition-all flex items-center justify-center gap-2 group"
                >
                    <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-700">refresh</span>
                    {t('محاولة أخرى', 'Regenerate')}
                </button>

                <button 
                    onClick={handleNext} 
                    disabled={selectedPrimaryIndex === null || (storyData.useSecondCharacter && storyData.secondCharacter?.type !== 'object' && selectedSecondaryIndex === null) || isLocking}
                    className={`w-full md:w-1/2 py-5 rounded-full font-black text-xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95 group relative overflow-hidden ${isLocking || selectedPrimaryIndex === null ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand-orange text-white shadow-brand-orange/20 hover:shadow-brand-orange/40'}`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isLocking ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">fingerprint</span>
                                {t('جاري القفل...', 'Locking DNA...')}
                            </>
                        ) : (
                            <>
                                {t('هذا رائع! اعتمد هذا', 'Lock This Look')}
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </>
                        )}
                    </span>
                    {!isLocking && selectedPrimaryIndex !== null && <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none"></div>}
                </button>
            </div>
        </div>
    );
};

export default StyleSelectionScreen;