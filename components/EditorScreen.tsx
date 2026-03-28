import React, { useState, useRef, useEffect } from 'react';
import type { StoryData, Language, Page } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { backendApi } from '../services/backendApi';
import * as adminService from '../services/adminService';
import { useLegacyPipeline } from '../hooks/useLegacyPipeline';
import { compressBase64Image } from '../utils/imageUtils';

interface EditorScreenProps {
    storyData: StoryData;
    language: Language;
    isGenerating: boolean;
    generationProgress: number;
    onUpdateStory: (updates: Partial<StoryData>) => void;
    onFinalize: () => void;
    isLegacy?: boolean;
    shippingDetails?: any;
    generationStatus?: string;
    onBack?: () => void;
    total?: number;
}

const EditorScreen: React.FC<EditorScreenProps> = ({
    storyData,
    language,
    isGenerating: isLegacyGeneration,
    generationProgress: legacyGenerationProgress,
    onFinalize,
    onUpdateStory,
    isLegacy = false,
    shippingDetails,
    generationStatus: legacyGenerationStatus,
    generationError: legacyGenerationError,
    onBack,
    total
}) => {
    // Pipeline Hook
    const {
        runPipeline,
        isProcessing,
        progress: pipelineProgress,
        status: pipelineStatus,
        logs: pipelineLogs,
        error: pipelineError
    } = useLegacyPipeline(
        storyData.orderId || 'RWY-UNKNOWN',
        storyData,
        shippingDetails || {},
        language,
        onUpdateStory,
        total
    );

    // Auto-run if isLegacy is true
    const hasAutoRun = useRef(false);
    useEffect(() => {
        if (isLegacy && !hasAutoRun.current && !isProcessing) {
            hasAutoRun.current = true;
            runPipeline();
        }
    }, [isLegacy]);

    // Track scroll for logs
    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [pipelineLogs]);

    const isAnyGenerating = isProcessing || isLegacyGeneration;
    const currentProgress = isProcessing ? pipelineProgress : legacyGenerationProgress;
    const currentStatus = isProcessing ? pipelineStatus : legacyGenerationStatus;
    const currentError = pipelineError || legacyGenerationError;
    
    // Terminal Visibility
    const [showTerminal, setShowTerminal] = useState(false);
    useEffect(() => {
        if (isProcessing) setShowTerminal(true);
    }, [isProcessing]);

    const spreads = storyData.spreads || [];
    const blueprint = storyData.blueprint;
    const coverUrl = storyData.coverImageUrl;
    const coverPrompt = storyData.actualCoverPrompt || storyData.finalPrompts?.[0] || '';
    const masterDNA = storyData.styleReferenceImageUrl || storyData.styleReferenceImageBase64 || storyData.mainCharacter?.imageDNA?.[0] || (storyData.mainCharacter?.imageBases64 && storyData.mainCharacter.imageBases64[0]);
    const masterDNA2 = storyData.secondCharacter?.imageDNA?.[0] || storyData.secondCharacterImageBase64 || storyData.secondCharacter?.imageBases64?.[0];

    // Local state to handle edits before saving them back to storyData
    const [pageEdits, setPageEdits] = useState<{ [index: number]: { text: string; prompt: string } }>({});
    const [coverEdit, setCoverEdit] = useState(coverPrompt);

    // Helper to safely extract prompt
    const getPromptForIndex = (pageIndex: number, pageData: any) => {
        if (pageData?.actualPrompt) return pageData.actualPrompt;
        const spreadIndex = Math.floor(pageIndex / 2);
        const fp = storyData.finalPrompts as any;
        if (!fp) return '';
        if (Array.isArray(fp) && fp.length > 0 && typeof fp[0] === 'object') {
            return fp[spreadIndex]?.imagePrompt || '';
        }
        if (Array.isArray(fp)) {
           return fp[pageIndex + 1] || ''; 
        }
        return '';
    };

    const cleanupPromptText = (text: any) => {
        if (text === undefined || text === null) return '';
        let strText = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
        
        // Pretty print JSON strings for easier editing
        if (typeof text === 'string' && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
            try {
                strText = JSON.stringify(JSON.parse(text), null, 2);
            } catch (e) {}
        }
        
        return strText.replace(/([A-Za-z0-9+/]{100,}=*)/g, '[REDACTED_BASE64_DATA]');
    };

    const [regeneratingIndex, setRegeneratingIndex] = useState<number | 'cover' | null>(null);
    const [textRegeneratingIndex, setTextRegeneratingIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!coverEdit && coverPrompt) {
            setCoverEdit(coverPrompt);
        }
    }, [coverPrompt]);

    // Bug 3: Helper to get the display text of a spread (combines leftText + rightText)
    const getSpreadText = (spread: any): string => {
        if (!spread) return '';
        // Support new Spread model (leftText/rightText) and legacy fallback
        if (spread.leftText || spread.rightText) {
            return [spread.leftText, spread.rightText].filter(Boolean).join(' ');
        }
        return spread.text || '';
    };

    const handleTextChange = (index: number, newText: string) => {
        setPageEdits(prev => ({
            ...prev,
            [index]: { ...(prev[index] || { text: getSpreadText(spreads[index]), prompt: getPromptForIndex(index, spreads[index]) }), text: newText }
        }));
    };

    const handlePromptChange = (index: number, newPrompt: string) => {
        setPageEdits(prev => ({
            ...prev,
            [index]: { ...(prev[index] || { text: getSpreadText(spreads[index]), prompt: getPromptForIndex(index, spreads[index]) }), prompt: newPrompt }
        }));
    };

    const handleRegenerateText = async (index: number) => {
        setTextRegeneratingIndex(index);
        try {
            const currentText = pageEdits[index]?.text || getSpreadText(spreads[index]);
            const res = await backendApi.generateSpreadText({
                blueprint: storyData.blueprint,
                language,
                childName: storyData.childName,
                spreadIndex: index,
                currentText,
                age: storyData.childAge
            });
            handleTextChange(index, res.text);
        } catch (e) {
            console.error("Failed to regenerate text", e);
            alert("Text regeneration failed.");
        } finally {
            setTextRegeneratingIndex(null);
        }
    };

    const handleRegenerateImage = async (index: number | 'cover') => {
        setRegeneratingIndex(index);
        try {
            const masterDNA = storyData.styleReferenceImageUrl || storyData.styleReferenceImageBase64 || storyData.mainCharacter?.imageDNA?.[0] || (storyData.mainCharacter?.imageBases64 && storyData.mainCharacter.imageBases64[0]);
        // Bug 5: never embed themeVisualDNA — use only the art style
            let visualDNA = storyData.selectedStylePrompt || 'Painterly, flat 2D illustrated children\'s book style';

            let promptToUse = '';
            if (index === 'cover') {
                promptToUse = coverEdit;
            } else {
                promptToUse = pageEdits[index]?.prompt || getPromptForIndex(index, spreads[index]);
            }

            // COMPRESS payloads to prevent Vercel 4.5MB Serverless Payload limit errors!
            const compressedMaster = await compressBase64Image(masterDNA, 1024, 0.85);
            let compressedSecond = undefined;
            if (storyData.useSecondCharacter && storyData.secondCharacterImageBase64) {
                compressedSecond = await compressBase64Image(storyData.secondCharacterImageBase64, 1024, 0.85);
            }

            const imgRes: any = await backendApi.generateImage({
                prompt: promptToUse,
                stylePrompt: visualDNA,
                referenceBase64: compressedMaster,
                characterDescription: storyData.mainCharacter?.description || "",
                age: storyData.childAge,
                secondReferenceBase64: compressedSecond
            });

            if (index === 'cover') {
                const newStory = {
                    ...storyData,
                    coverImageUrl: imgRes.imageBase64,
                    actualCoverPrompt: imgRes.fullPrompt || promptToUse
                };
                onUpdateStory({
                    coverImageUrl: imgRes.imageBase64,
                    actualCoverPrompt: imgRes.fullPrompt || promptToUse
                });
                await adminService.saveOrder(storyData.orderId || 'RWY-UNKNOWN', newStory, shippingDetails || {});
            } else {
                const newSpreads = [...spreads];
                newSpreads[index] = {
                    ...newSpreads[index],
                    illustrationUrl: imgRes.imageBase64,
                    actualPrompt: imgRes.fullPrompt || promptToUse
                };
                const newStory = { ...storyData, spreads: newSpreads };
                onUpdateStory({ spreads: newSpreads });
                await adminService.saveOrder(storyData.orderId || 'RWY-UNKNOWN', newStory, shippingDetails || {});
            }
        } catch (e: any) {
            console.error("Failed to regenerate image", e);
            alert(`Image regeneration failed.\n\nError: ${e.message || String(e)}`);
        } finally {
            setRegeneratingIndex(null);
        }
    };

    const handleUploadImage = (index: number | 'cover') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg, image/png, image/webp';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                if (index === 'cover') {
                    onUpdateStory({ coverImageUrl: base64 });
                } else {
                    const newSpreads = [...spreads];
                    newSpreads[index] = {
                        ...newSpreads[index],
                        illustrationUrl: base64
                    };
                    onUpdateStory({ spreads: newSpreads });
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const handleUploadText = (index: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'text/plain';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                handleTextChange(index, text);
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleMassUploadText = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'text/plain';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const fullText = event.target?.result as string;
                const blocks = fullText.split(/\n\s*\n/).filter(line => line.trim() !== '');
                const segments = blocks.length >= 8 ? blocks : fullText.split('\n').filter(line => line.trim() !== '');
                segments.slice(0, 8).forEach((segment, index) => {
                    handleTextChange(index, segment.trim());
                });
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleDownloadText = () => {
        let fullTextContent = `Story: ${storyData.title || 'Untitled'}\n\n`;
        const finalSpreads = [...spreads];
        for (let i = 0; i < Math.max(8, finalSpreads.length); i++) {
            const spreadText = pageEdits[i]?.text !== undefined ? pageEdits[i].text : getSpreadText(finalSpreads[i]);
            if (spreadText || finalSpreads[i]) {
                fullTextContent += `Spread ${i + 1}:\n${spreadText}\n\n`;
            }
        }
        const blob = new Blob([fullTextContent], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${storyData.orderId || 'story'}_full_text.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadBlueprint = () => {
        const bpString = JSON.stringify(blueprint || {}, null, 2);
        const blob = new Blob([bpString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${storyData.orderId || 'story'}_blueprint.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [isFinalizing, setIsFinalizing] = useState(false);

    const applyAllEditsAndFinalize = async () => {
        setIsFinalizing(true);
        const finalSpreads = [...spreads];
        for (let i = 0; i < finalSpreads.length; i++) {
            const editedText = pageEdits[i]?.text;
            const currentText = getSpreadText(finalSpreads[i]);
            if (editedText !== undefined && editedText !== currentText) {
                // Store edited text back into the spread's leftText field (unified)
                finalSpreads[i] = { ...finalSpreads[i], leftText: editedText, rightText: '' };
            }
            if (pageEdits[i]?.prompt !== undefined && pageEdits[i].prompt !== finalSpreads[i].actualPrompt) {
                finalSpreads[i] = { ...finalSpreads[i], actualPrompt: pageEdits[i].prompt };
            }
        }
        onUpdateStory({ spreads: finalSpreads, actualCoverPrompt: coverEdit });
        
        // Give the UI a moment to render the loading spinner before locking the thread
        await new Promise(r => setTimeout(r, 50));
        
        try {
            await onFinalize();
        } catch (error) {
            console.error("Finalize error:", error);
            alert("Error finalizing order: " + (error as any).message);
        } finally {
            setIsFinalizing(false);
        }
    };

    const handleSilentSave = async () => {
        if (!storyData.orderId) return;
        const finalSpreads = [...spreads];
        for (let i = 0; i < finalSpreads.length; i++) {
            const editedText = pageEdits[i]?.text;
            const currentText = getSpreadText(finalSpreads[i]);
            if (editedText !== undefined && editedText !== currentText) {
                finalSpreads[i] = { ...finalSpreads[i], leftText: editedText, rightText: '' };
            }
            if (pageEdits[i]?.prompt !== undefined && pageEdits[i].prompt !== finalSpreads[i].actualPrompt) {
                finalSpreads[i] = { ...finalSpreads[i], actualPrompt: pageEdits[i].prompt };
            }
        }
        onUpdateStory({ spreads: finalSpreads, actualCoverPrompt: coverEdit });
        try {
            await adminService.saveOrder(storyData.orderId as string, { ...storyData, spreads: finalSpreads, actualCoverPrompt: coverEdit }, shippingDetails || {});
        } catch(e) {
            console.error("Silent save failed", e);
        }
    };


    const [isBackendProcessing, setIsBackendProcessing] = useState(false);
    const [backendProgress, setBackendProgress] = useState(0);
    const [backendStatusText, setBackendStatusText] = useState('');

    useEffect(() => {
        if (!isBackendProcessing || !storyData.orderId) return;
        let isMounted = true;
        const checkStatus = async () => {
            try {
                const result = await adminService.getOrderStatus(storyData.orderId as string);
                if (!result || !isMounted) return;
                const { status, error_message } = result as any;
                if (error_message || status === 'failed') {
                    setBackendProgress(0);
                    setBackendStatusText(`Error: ${error_message || 'Pipeline Failed'}`);
                    setIsBackendProcessing(false);
                    return;
                }
                if (status === 'story_ready' || status === 'queued') {
                    setBackendProgress(10);
                    setBackendStatusText('Waiting for Workers...');
                } else if (status === 'illustrations_generating') {
                    setBackendProgress(40);
                    setBackendStatusText('Generating Illustrations...');
                } else if (status === 'illustrations_ready') {
                    setBackendProgress(80);
                    setBackendStatusText('Assembling Book...');
                } else if (status === 'book_compiling') {
                    setBackendProgress(90);
                    setBackendStatusText('Compiling Pages...');
                } else if (status === 'softcopy_ready' || status === 'awaiting_preview_approval' || status === 'sent_to_print' || status === 'printing') {
                    setBackendProgress(100);
                    setBackendStatusText('Complete!');
                    setIsBackendProcessing(false);
                    const freshOrder = await adminService.getOrderById(storyData.orderId as string);
                    if (freshOrder && isMounted) {
                        onUpdateStory(freshOrder.storyData);
                    }
                }
            } catch (e) {
                console.error("Polling error:", e);
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isBackendProcessing, storyData.orderId]);

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    return (
        <div className="w-full h-full min-h-[90vh] bg-[#fdfdfd] flex overflow-hidden">
            {/* Left Pane: Blueprint Reference */}
            <div className="hidden lg:flex flex-col w-[300px] border-r border-gray-100 bg-white p-6 overflow-y-auto scroller-thin shrink-0">
                
                {/* 1. ORDER INFO BLOCK */}
                <div className="mb-6 space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm text-sm">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="font-bold text-gray-500 uppercase text-xs tracking-widest">Book Language</span>
                        <span className="font-black text-brand-teal uppercase text-xs tracking-widest">{storyData.language === 'ar' ? 'العربية' : 'English'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="font-bold text-gray-500 uppercase text-xs tracking-widest">Format</span>
                        <span className="font-black text-brand-navy uppercase text-xs tracking-widest">{storyData.useSecondCharacter ? 'Dual Hero' : 'Single Hero'}</span>
                    </div>
                </div>

                {/* 2. CUSTOMER SELECTED VISUAL DNA BLOCK */}
                {(masterDNA || masterDNA2) && (
                    <div className="mb-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 shadow-sm">
                        <h4 className="text-xs font-black text-brand-orange uppercase tracking-widest mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {t('الصورة المرجعية للعميل', 'Customer Locked DNA')}
                        </h4>
                        <div className="flex gap-2 w-full">
                            {masterDNA && <img src={masterDNA.startsWith('http') ? masterDNA : `data:image/jpeg;base64,${masterDNA}`} alt="Visual DNA 1" className="w-full rounded-xl shadow-sm border-2 border-white object-cover aspect-square" />}
                            {masterDNA2 && <img src={masterDNA2.startsWith('http') ? masterDNA2 : `data:image/jpeg;base64,${masterDNA2}`} alt="Visual DNA 2" className="w-full rounded-xl shadow-sm border-2 border-white object-cover aspect-square" />}
                        </div>
                    </div>
                )}

                {/* 3. STORY BLUEPRINT BLOCK */}
                <div className="flex justify-between items-center mb-4 mt-2">
                    <h2 className="text-xl font-bold text-brand-navy uppercase tracking-tighter">{t('مخطط القصة', 'Story Blueprint')}</h2>
                    <Button onClick={handleDownloadBlueprint} variant="outline" className="text-[10px] py-1 px-3 shadow-none border-gray-200">
                        JSON
                    </Button>
                </div>
                {blueprint ? (
                    <div className="space-y-4 text-sm text-gray-700 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        {Object.entries(blueprint).map(([key, value]) => {
                            if (key === 'spreads' || key === 'title') return null;
                            if (typeof value === 'object' && value !== null) {
                                return (
                                    <div key={key}>
                                        <h4 className="text-xs font-black text-brand-teal uppercase tracking-widest mb-2 mt-2">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                        <div className="space-y-2">
                                            {Object.entries(value).map(([subKey, subValue]) => (
                                                <div key={subKey} className="flex flex-col">
                                                    <strong className="text-[10px] text-gray-400 uppercase tracking-widest">{subKey.replace(/([A-Z])/g, ' $1').trim()}</strong>
                                                    <span className="text-xs font-medium leading-relaxed">{String(subValue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">{t('جاري المعالجة...', 'Architecting story...')}</p>
                )}
            </div>

            {/* Right Pane: Main Processor */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center p-4 lg:p-6 border-b border-gray-100 bg-white sticky top-0 z-20 gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {onBack && (
                            <button onClick={onBack} className="text-gray-400 hover:text-brand-orange transition-all hover:scale-110 active:scale-95 shrink-0">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                        )}
                        <h2 className="text-2xl font-black text-brand-navy shrink-0 uppercase tracking-tighter">{t('محرر الصفحات', 'Spread Editor')}</h2>
                        {(isAnyGenerating || currentError || isBackendProcessing) && (
                            <div className="p-2.5 px-5 rounded-2xl flex items-center gap-4 border bg-orange-50/80 border-orange-200/50 shadow-sm animate-in fade-in zoom-in duration-300">
                                <Spinner size="sm" color="text-brand-orange" />
                                <span className="text-xs font-black text-brand-navy uppercase tracking-widest">
                                    {isBackendProcessing ? backendStatusText : (currentError ? `Error: ${currentError}` : (currentStatus || t('جاري التوليد...', 'Generating...')))}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 lg:gap-3 flex-nowrap lg:flex-wrap overflow-x-auto pb-2 px-1 w-full lg:w-auto scroller-thin shrink-0 snap-x">
                        <Button onClick={() => setShowTerminal(!showTerminal)} variant="outline" className={`shrink-0 snap-start !py-2 !px-4 lg:!py-2.5 lg:!px-6 border-2 transition-all ${showTerminal ? 'bg-brand-navy text-white border-brand-navy' : 'border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy'}`}>
                            {showTerminal ? t('إخفاء السجل', 'Hide Logs') : t('عرض السجل', 'Show Logs')}
                        </Button>
                        <Button onClick={handleMassUploadText} variant="outline" className="shrink-0 snap-start !py-2 !px-3 lg:!py-2.5 lg:!px-4 border-2 border-gray-200 text-gray-500 hover:border-brand-teal hover:text-brand-teal text-[10px] lg:text-xs">
                            Upload Script
                        </Button>
                        <Button onClick={handleDownloadText} variant="outline" className="shrink-0 snap-start !py-2 !px-3 lg:!py-2.5 lg:!px-4 border-2 border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy text-[10px] lg:text-xs">
                            Export Script
                        </Button>
                        <div className="flex gap-2 lg:gap-4 shrink-0 snap-start">
                            <Button onClick={() => runPipeline(false)} disabled={isAnyGenerating} variant="secondary" className="!py-2 !px-3 lg:!py-2.5 lg:!px-4 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-all font-black uppercase text-[9px] lg:text-[10px]">
                                {t('إعادة المعالجة', 'Restart Pipeline')}
                            </Button>
                            <Button onClick={() => runPipeline(true)} disabled={isAnyGenerating} variant="secondary" className="!py-2 !px-3 lg:!py-2.5 lg:!px-4 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all shadow-lg font-black uppercase text-[9px] lg:text-[10px]">
                                {t('إستكمال المعالجة', 'Continue Pipeline')}
                            </Button>
                            <Button onClick={applyAllEditsAndFinalize} disabled={isAnyGenerating || isFinalizing} className="!py-2 !px-4 lg:!py-2.5 lg:!px-6 shadow-xl shadow-brand-orange/30 font-black uppercase text-[9px] lg:text-[10px] flex items-center justify-center gap-2">
                                {isFinalizing ? <><Spinner size="sm" color="text-white" /> {t('جاري الإنهاء...', 'Finalizing...')}</> : t('إنهاء وحفظ', 'Finalize')}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-16 scroller-thin bg-[#fcfcfc]">
                        {/* Cover */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                            <h3 className="text-xl font-black mb-6 text-brand-navy uppercase tracking-tighter flex items-center gap-3">
                                <div className="w-8 h-8 bg-brand-navy text-white rounded-lg flex items-center justify-center text-xs">C</div>
                                {t('الغلاف', 'Cover Design')}
                            </h3>
                            <div className="flex flex-col xl:flex-row gap-10">
                                <div className="w-full xl:w-1/2 flex flex-col gap-4">
                                    <div className="aspect-[16/9] relative bg-gray-50 rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center border-2 border-dashed border-gray-200 group">
                                        {coverUrl ? <img src={coverUrl.startsWith('http') ? coverUrl : `data:image/jpeg;base64,${coverUrl}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <Spinner size="md" color="text-brand-orange" />}
                                        <div className="absolute inset-0 bg-brand-navy/0 group-hover:bg-brand-navy/5 transition-colors duration-300 pointer-events-none"></div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="secondary" onClick={() => handleUploadImage('cover')} className="flex-1 text-xs py-3 font-black uppercase tracking-widest">{t('رفع صورة', 'Upload Art')}</Button>
                                        <Button onClick={() => handleRegenerateImage('cover')} disabled={regeneratingIndex === 'cover'} className="flex-1 text-xs py-3 font-black uppercase tracking-widest shadow-lg shadow-brand-orange/20">
                                            {regeneratingIndex === 'cover' ? <Spinner size="sm" /> : t('إعادة توليد', 'Paint Art')}
                                        </Button>
                                    </div>
                                </div>
                                <div className="w-full xl:w-1/2 flex flex-col gap-4">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cover Art AI Prompt (JSON)</label>
                                     <textarea value={cleanupPromptText(coverEdit)} onChange={(e) => setCoverEdit(e.target.value)} onBlur={handleSilentSave} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-xs h-full min-h-[300px] resize-none focus:ring-2 focus:ring-brand-orange/10 outline-none transition-all font-mono leading-relaxed" spellCheck={false} />
                                </div>
                            </div>
                        </div>

                        {/* Spreads — start at index 1; index 0 is the cover rendered above */}
                        {Array.from({ length: storyData.spreadCount || Math.max(8, spreads.length - 1) }).map((_, idx) => {
                        const i = idx + 1; // spreads[0] = cover, spreads[1..N] = inner spreads
                        return (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                                <h3 className="text-xl font-black mb-6 text-brand-navy uppercase tracking-tighter flex items-center gap-3">
                                    <div className="w-8 h-8 bg-brand-orange/10 text-brand-orange rounded-lg flex items-center justify-center text-xs">{i}</div>
                                    {t('صفحة', 'Spread')} {i}
                                </h3>
                                <div className="flex flex-col xl:flex-row gap-10">
                                    <div className="w-full xl:w-1/2 flex flex-col gap-4">
                                        <div className="aspect-[16/9] relative bg-gray-50 rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center border-2 border-dashed border-gray-200 group">
                                            {spreads[i]?.illustrationUrl ? (
                                                <img src={spreads[i].illustrationUrl.startsWith('http') ? spreads[i].illustrationUrl : `data:image/jpeg;base64,${spreads[i].illustrationUrl}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 text-gray-300">
                                                    {isAnyGenerating ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Spinner size="md" color="text-brand-orange" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange animate-pulse">Painting...</span>
                                                        </div>
                                                    ) : <span className="text-sm font-medium">{t('جاري التجهيز...', 'Ready to Paint')}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="secondary" onClick={() => handleUploadImage(i)} className="flex-1 text-xs py-3 font-black uppercase tracking-widest">{t('رفع', 'Manual Upload')}</Button>
                                            <Button onClick={() => handleRegenerateImage(i)} disabled={regeneratingIndex === i} className="flex-1 text-xs py-3 font-black uppercase tracking-widest shadow-lg shadow-brand-orange/20">
                                                {regeneratingIndex === i ? <Spinner size="sm" /> : t('إعادة', 'Paint Spread')}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="w-full xl:w-1/2 flex flex-col gap-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest">Narrative Text Edit</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRegenerateText(i)} className="text-[9px] font-black uppercase text-brand-orange hover:underline">{textRegeneratingIndex === i ? 'Writing...' : 'AI Rewrite'}</button>
                                                    <button onClick={() => handleUploadText(i)} className="text-[9px] font-black uppercase text-brand-teal hover:underline">Upload .txt</button>
                                                </div>
                                            </div>
                                            <textarea value={pageEdits[i]?.text !== undefined ? pageEdits[i].text : getSpreadText(spreads[i])} onChange={(e) => handleTextChange(i, e.target.value)} onBlur={handleSilentSave} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm h-32 focus:ring-2 focus:ring-brand-teal/10 outline-none transition-all font-medium leading-relaxed" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest px-1">Illustration Technical Prompt (JSON)</label>
                                            <textarea value={cleanupPromptText(pageEdits[i]?.prompt !== undefined ? pageEdits[i].prompt : getPromptForIndex(i, spreads[i]))} onChange={(e) => handlePromptChange(i, e.target.value)} onBlur={handleSilentSave} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-xs h-64 focus:ring-2 focus:ring-brand-navy/10 outline-none transition-all font-mono leading-relaxed" spellCheck={false} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ); })}
                    </div>
                </div>
            </div>

            {/* Dedicated Sidebar Terminal (TOP LEVEL) */}
            {showTerminal && (
                <>
                    {/* Dark Overlay for Mobile */}
                    <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowTerminal(false)}></div>
                    <div className="fixed lg:relative top-0 right-0 h-full w-[90vw] lg:w-[450px] bg-gray-950 border-l border-white/5 flex flex-col shrink-0 animate-in slide-in-from-right duration-500 ease-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50">
                     <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gray-900/50 backdrop-blur-md sticky top-0">
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-brand-orange animate-ping' : (currentError ? 'bg-red-500' : 'bg-brand-teal')}`}></div>
                            <div>
                                <h3 className="font-black text-[11px] font-mono uppercase tracking-[0.2em] text-white">Production Terminal</h3>
                                <p className="text-[9px] font-mono text-gray-500 uppercase mt-0.5 tracking-widest">Protocol: {storyData.orderId || 'RWY-XXX'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowTerminal(false)} className="text-gray-400 hover:text-white transition-colors duration-200">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto font-mono text-[11px] p-6 space-y-2 scroller-thin bg-gray-950/50">
                        {pipelineLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 italic">
                                <div className="w-12 h-12 border-2 border-dashed border-gray-800 rounded-full mb-4"></div>
                                Terminal Idle.
                            </div>
                        ) : (
                            pipelineLogs.map((log, idx) => (
                                <div key={idx} className="group animate-in fade-in slide-in-from-bottom-1 duration-300">
                                    <div className={`${log.includes('ERROR') || log.includes('FATAL') ? 'text-red-400 bg-red-400/5 p-2 rounded-xl border border-red-400/20' : log.includes('✓') ? 'text-brand-teal font-bold' : log.includes('⚠️') ? 'text-orange-300' : 'text-gray-400'} leading-relaxed flex items-start gap-3`}>
                                        <span className="text-[8px] font-light text-gray-600 mt-1 shrink-0">{log.split(']')[0]}]</span>
                                        <span className="flex-1">{log.split(']')[1] || log}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={logEndRef} />
                    </div>

                    {isProcessing && (
                        <div className="p-6 bg-gray-900/80 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Process Saturation</span>
                                <span className="text-xs font-mono text-brand-orange font-black">{Math.round(currentProgress)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-brand-orange to-orange-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(240,90,40,0.5)]" style={{ width: `${currentProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
                </>
            )}
        </div>
    );
};

export default EditorScreen;
