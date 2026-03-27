import { useState, useRef, useCallback } from 'react';
import { backendApi } from '../services/backendApi';
import * as adminService from '../services/adminService';
import { compressBase64Image } from '../utils/imageUtils';
import type { StoryData, Language, Spread } from '../types';

export const useLegacyPipeline = (
    orderNumber: string,
    initialStoryData: StoryData,
    initialShippingDetails: any,
    language: Language,
    onUpdateStory: (updates: Partial<StoryData>) => void,
    total?: number
) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Idle');
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    
    // Use a ref for storyData to ensure we always have the latest even inside the loop
    const storyDataRef = useRef<StoryData>(initialStoryData);

    // Keep internal ref in sync with latest props so we can pick up user edits (prompts/text)
    // during the pipeline execution (e.g. user edits Spread 4 while Spread 1 is painting)
    const storyDataPropRef = useRef(initialStoryData);
    storyDataPropRef.current = initialStoryData;

    const logMsg = useCallback((msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const retryStep = async <T>(stepName: string, operation: () => Promise<T>, retries = 2): Promise<T> => {
        let lastError: any;
        for (let i = 0; i <= retries; i++) {
            try {
                if (i > 0) logMsg(`Retrying ${stepName} (Attempt ${i + 1}/${retries + 1})...`);
                return await operation();
            } catch (e: any) {
                lastError = e;
                const is429 = e.message?.includes('429') || e.message?.toLowerCase().includes('quota');
                const delay = is429 ? 25000 : 5000;
                logMsg(`⚠️ ${stepName} failed: ${e.message}. Waiting ${delay/1000}s...`);
                await sleep(delay);
            }
        }
        throw lastError;
    };

    const ensureSafeString = (str: any, defaultStr: string) => (typeof str === 'string' && str.trim()) ? str : defaultStr;

    const runPipeline = async (resume: boolean = false) => {
        setIsProcessing(true);
        setError(null);
        setProgress(5);
        setLogs([]);
        logMsg(`Legacy Process started for Protocol: ${orderNumber} (Resume: ${resume})`);

        try {
            let storyData = { ...storyDataRef.current };
            const lang = storyData.language || language || 'en';
            const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

            if (!resume) {
                // [PRE-FLIGHT] Auto-Wipe generated artifacts to start fresh...
                
            }
            
            // Helper to prevent Vercel 4.5MB payload limit errors by stripping heavy base64 images from JSON text requests
            const getCleanStoryDataForTextApi = (sd: any) => {
                const clean = { ...sd };
                if (clean.mainCharacter) clean.mainCharacter = { ...clean.mainCharacter, imageBases64: [], imageDNA: [] };
                if (clean.secondCharacter) clean.secondCharacter = { ...clean.secondCharacter, imageBases64: [], imageDNA: [] };
                clean.styleReferenceImageBase64 = undefined;
                clean.mainCharacterImageBase64 = undefined;
                clean.secondCharacterImageBase64 = undefined;
                return clean;
            };

            if (!resume) {
                // [PRE-FLIGHT] Auto-Wipe generated artifacts to start fresh, preserving only customer/DNA data
                logMsg(`Pre-flight: Wiping old intermediate data for clean run...`);
                storyData.blueprint = undefined;
                storyData.script = [];
                storyData.spreadPlan = undefined;
                storyData.spreads = [];   // Clear spreads (replaces old pages[])
                storyData.finalPrompts = [];
                storyData.prompts = [];   // Clear backend worker prompts
                storyData.actualCoverPrompt = undefined;
                storyData.coverImageUrl = undefined;
                
                storyDataRef.current = storyData;
                storyDataPropRef.current = storyData;
                onUpdateStory({ 
                    blueprint: undefined, script: [], spreadPlan: undefined, 
                    spreads: [], finalPrompts: [], prompts: [], actualCoverPrompt: undefined 
                } as any);
                await adminService.saveOrder(storyData.orderId || orderNumber || 'RWY-UNKNOWN', storyData, initialShippingDetails || {}, total);
            } else {
                logMsg(`Resuming pipeline. Skipping pre-flight wipe and jumping to first missing artifact...`);
            }

            // Step 1: DNA & Character
            logMsg(`Starting Phase 1: Visual DNA & Character Profiling`);
            setStatus(t('معالجة الهوية البصرية...', 'Processing Visual DNA...'));
            const mainChar = storyData.mainCharacter || {};
            if (!mainChar.imageDNA || mainChar.imageDNA.length === 0) {
                logMsg(`Character DNA not found. Calling Vision AI API... (This may take 15-30 seconds)`);
                
                // COMPRESSION: Force all incoming user-uploaded DNA to < 100KB per image to bypass Vercel/Next.js body limits
                const originalMainBases = (mainChar.imageBases64 && mainChar.imageBases64.length > 0) 
                    ? mainChar.imageBases64 
                    : [storyData.mainCharacterImageBase64].filter(Boolean);
                const compressedMainBases = await Promise.all(originalMainBases.map((b: any) => compressBase64Image(b, 1024, 0.8)));

                let compressedSecondBases: string[] = [];
                if (storyData.secondCharacter) {
                     const originalSecondBases = (storyData.secondCharacter.imageBases64 && storyData.secondCharacter.imageBases64.length > 0)
                        ? storyData.secondCharacter.imageBases64
                        : [storyData.secondCharacterImageBase64].filter(Boolean);
                     compressedSecondBases = await Promise.all(originalSecondBases.map((b: any) => compressBase64Image(b, 1024, 0.8)));
                }

                const dnaPayload = {
                    mainCharacter: {
                        ...mainChar,
                        imageBases64: compressedMainBases
                    },
                    secondCharacter: storyData.secondCharacter ? {
                        ...storyData.secondCharacter,
                        imageBases64: compressedSecondBases
                    } : undefined,
                    theme: ensureSafeString(storyData.theme, "Neutral Setting"),
                    style: ensureSafeString(storyData.selectedStylePrompt, "Painterly illustration"),
                    age: ensureSafeString(storyData.childAge, "5"),
                    occasion: storyData.occasion,
                    customGoal: storyData.customGoal
                };
                
                const dnaRes = await retryStep('Vision AI DNA', () => backendApi.generateDna(dnaPayload)) as any;
                if (dnaRes.error) throw new Error(dnaRes.error);
                
                storyData.mainCharacter = {
                    ...mainChar,
                    description: dnaRes.physicalDescription,
                    imageDNA: [dnaRes.artifiedHeroBase64]
                };

                if (storyData.secondCharacter) {
                    storyData.secondCharacter = {
                        ...storyData.secondCharacter,
                        description: dnaRes.secondPhysicalDescription,
                        imageDNA: [dnaRes.secondArtifiedHeroBase64 || dnaRes.artifiedHeroBase64]
                    };
                }
                const rawStyle = storyData.selectedStylePrompt || "A magical, painterly children's book illustration";
                storyData.selectedStylePrompt = typeof rawStyle === 'string' ? rawStyle.replace(/([A-Za-z0-9+/]{100,}=*)/g, '[REDACTED_IMAGE_STYLE]') : rawStyle;
                storyDataRef.current = storyData;
                onUpdateStory(storyData);
                await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);
                logMsg(`✓ Visual DNA generated successfully.`);
            } else {
                logMsg(`Visual DNA already exists, skipping.`);
            }
            setProgress(15);

            // Step 2A: Story Blueprint (Architect AI)
            setStatus(t('تصميم المخطط...', 'Architecting the Story...'));
            if (!storyData.blueprint) {
                logMsg(`Calling Architect AI API with Theme: ${ensureSafeString(storyData.theme, 'Birthday')}...`);
                // Use stripped storyData to avoid Vercel 4.5MB payload limit crashing the text API
                const blueprintPayload = getCleanStoryDataForTextApi(storyData);
                const blueprintRes = await retryStep('Architect AI Blueprint', () => backendApi.generateBlueprint({ storyData: blueprintPayload, language: lang, spreadCount: storyData.spreadCount || 8 })) as any;
                if (blueprintRes.error) throw new Error(blueprintRes.error);

                storyData = { ...storyData, blueprint: blueprintRes.blueprint };
                storyDataRef.current = storyData;
                onUpdateStory(storyData);
                await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);
                logMsg(`✓ Story Blueprint constructed successfully.`);
            } else {
                logMsg(`Blueprint already exists, skipping Phase 2A.`);
            }
            setProgress(25);

            // Step 2B: Story Script (Writer AI) & Phase 3: Senior Writer Pass
            setStatus(t('كتابة القصة ومراجعتها...', 'Drafting & Polishing Script (Writer AI)...'));
            const isScriptEmpty = !storyData.script || (Array.isArray(storyData.script) && storyData.script.every((s:any) => !s.text || s.text.length < 5));
            if (isScriptEmpty) {
                logMsg(`Phase 2B: Drafting initial native-language narrative...`);
                logMsg(`Phase 3: Senior Writer Agent reviewing for grammatical perfection & logic...`);
                const storyPayload = getCleanStoryDataForTextApi(storyData);
                const storyRes = await retryStep('Writer AI Script', () => backendApi.generateStory({ storyData: storyPayload, language: lang, blueprint: storyData.blueprint, spreadCount: storyData.spreadCount || 8 })) as any;
                if (storyRes.error) throw new Error(storyRes.error);

                storyData = { ...storyData, script: storyRes.script || storyRes.rawScript };
                storyDataRef.current = storyData;
                onUpdateStory(storyData);
                await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);
                logMsg(`✓ Story script written successfully.`);
            } else {
                logMsg(`Story details already exist, skipping Phase 2B.`);
            }
            setProgress(30);

            // Step 3: Visual Plan
            setStatus(t('تخطيط المشاهد...', 'Planning Visual Layouts...'));
            if (!storyData.spreadPlan) {
                logMsg(`Calling Cinematographer AI API...`);
                const planRes = await retryStep('Cinematographer AI Plan', () => backendApi.generateVisualPlan({ 
                    script: storyData.script, 
                    blueprint: storyData.blueprint, 
                    visualDNA: storyData.selectedStylePrompt || "Painterly illustration",
                    spreadCount: storyData.spreadCount || 8
                })) as any;
                if (planRes.error) throw new Error(planRes.error);

                logMsg(`Cinematographer AI mapped ${storyData.spreadCount || 8} spreads successfully.`);
                storyData = { ...storyData, spreadPlan: planRes.plan };
                storyDataRef.current = storyData;
                onUpdateStory(storyData);
                await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);
            } else {
                logMsg(`Visual Plan already exists, skipping.`);
            }
            setProgress(45);

            // Refresh current state from props to pick up manual user edits before Step 4
            storyData = { ...storyData, ...storyDataPropRef.current };
            
            // Step 4: Engineering Prompts & Phase 5: Illustrator AI Pass
            logMsg(`Starting Phase 4: AI Prompt Engineering`);
            setStatus(t('هندسة وتدقيق الأوامر...', 'Engineering & Auditing Prompts...'));
            const isPromptsEmpty = !storyData.finalPrompts || (Array.isArray(storyData.finalPrompts) && storyData.finalPrompts.every((p:any) => {
                if (typeof p === 'string') return p.length < 5;
                if (typeof p === 'object' && p !== null) return !p.prompt && !p.imagePrompt;
                return true;
            }));

            if (isPromptsEmpty) {
                logMsg(`Phase 4: Translating narrative to technical prompt parameters...`);
                logMsg(`Phase 5: Illustrator Agent auditing prompts for typography & character consistency...`);
                const promptsRes = await retryStep('Prompt Engineer AI', () => backendApi.generatePrompts({ 
                    plan: storyData.spreadPlan, 
                    blueprint: storyData.blueprint,  
                    visualDNA: storyData.selectedStylePrompt || "Painterly illustration",
                    childAge: storyData.childAge, 
                    childDescription: storyData.mainCharacter?.description || "A child", 
                    childName: storyData.childName, 
                    secondCharacter: storyData.secondCharacter ? { ...storyData.secondCharacter, imageBases64: [], imageDNA: [] } : undefined, 
                    language: lang,
                    occasion: storyData.occasion,
                    extraItems: storyData.customIllustrationNotes,
                    theme: storyData.theme
                })) as any;
                if (promptsRes.error) throw new Error(promptsRes.error);

                logMsg(`Prompt Engineer generated prompt templates accurately.`);
                storyData = { ...storyData, finalPrompts: promptsRes.prompts };
                storyDataRef.current = storyData;
                onUpdateStory(storyData);
                await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);
                logMsg(`✓ Prompts engineered successfully.`);
            } else {
                logMsg(`Prompts already engineered, skipping.`);
            }
            setProgress(55);

            // Refresh current state from props to pick up manual user edits before Step 5
            storyData = { ...storyData, ...storyDataPropRef.current };

            // Step 5: Iterative Image Generation
            const settings = await adminService.getSettings();
            const spreadCount = storyData.spreadCount || settings.defaultSpreadCount || 8;
            const delayBetweenScenes = Math.max(25000, (settings.generationDelay || 0) * 1000);
            
            logMsg(`Starting Phase 5: Image Generation Pipeline (Cover + ${spreadCount} Spreads)`);

            const prompts = storyData.finalPrompts || [];
            if (!prompts || prompts.length === 0) throw new Error("No prompts found to generate images.");
            
            // finalPrompts[0] = Cover, finalPrompts[1..N] = inner spreads
            // If backend returned without a separate cover prompt, treat all as inner spreads
            const hasCoverPrompt = prompts.length > spreadCount;
            const coverPrompt = hasCoverPrompt ? prompts[0] : null;
            const innerPrompts = hasCoverPrompt ? prompts.slice(1) : prompts;
            const finalScript = storyData.script || [];

            // Build the Spreads array — one object per spread, no i*2 duplication
            let spreads: import('../types').Spread[] = storyData.spreads || [];

            // Ensure cover slot exists (spreadNumber: 0)
            if (!spreads[0]) {
                spreads[0] = { spreadNumber: 0, illustrationUrl: '', leftText: '', rightText: '', actualPrompt: '' };
            }

            // Ensure inner spread slots exist (spreadNumber: 1..N)
            for (let i = 0; i < innerPrompts.length; i++) {
                const spreadNum = i + 1;
                const rawPrompt = innerPrompts[i];
                const imagePrompt = typeof rawPrompt === 'string' ? rawPrompt : (rawPrompt?.imagePrompt || rawPrompt?.prompt || '');
                const scriptItem = finalScript[i];
                const txt = typeof scriptItem === 'string' ? scriptItem : (scriptItem?.text || '');
                const textSide = storyData.spreadPlan?.spreads?.[spreadNum]?.mainContentSide?.toLowerCase().includes('left') ? 'left' as const : 'right' as const;

                if (!spreads[spreadNum]) {
                    // Split text roughly in half: first half is left, second half is right
                    const mid = Math.ceil(txt.length / 2);
                    const lastSpace = txt.lastIndexOf(' ', mid);
                    const splitAt = lastSpace > 0 ? lastSpace : mid;
                    spreads[spreadNum] = {
                        spreadNumber: spreadNum,
                        illustrationUrl: '',
                        leftText: txt.substring(0, splitAt).trim(),
                        rightText: txt.substring(splitAt).trim(),
                        actualPrompt: imagePrompt,
                        textSide
                    };
                } else {
                    spreads[spreadNum].actualPrompt = imagePrompt;
                }
            }

            storyData = { ...storyData, spreads, spreadCount };
            storyDataRef.current = storyData;
            onUpdateStory(storyData);
            await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);

            const mainDNA = storyData.styleReferenceImageUrl || storyData.styleReferenceImageBase64 || storyData.mainCharacter?.imageDNA?.[0] || storyData.mainCharacter?.imageBases64?.[0];
            const visualStylePrompt = `${storyData.selectedStylePrompt}. Theme: ${storyData.themeVisualDNA || storyData.theme || 'Neutral'}`;
            const secondDNA = storyData.useSecondCharacter ? (storyData.secondCharacterImageBase64 || storyData.secondCharacterImageUrl || storyData.secondCharacter?.imageDNA?.[0] || storyData.secondCharacter?.imageBases64?.[0]) : undefined;

            const uploadSpreadImage = async (spreadNum: number, base64: string, promptUsed: string) => {
                // Store directly as base64 for now; Supabase upload can be added here
                spreads[spreadNum] = { ...spreads[spreadNum], illustrationUrl: base64, actualPrompt: promptUsed };
                storyData = { ...storyData, spreads: [...spreads] };
                storyDataRef.current = storyData;
                onUpdateStory(storyData);
                await adminService.saveOrder(orderNumber, storyData, initialShippingDetails, total);
            };

            // --- Generate Cover (Spread 0) ---
            const coverAlreadyDone = storyData.coverImageUrl && storyData.coverImageUrl.length > 55 && !storyData.coverImageUrl.endsWith('...');
            if (!coverAlreadyDone && coverPrompt && mainDNA) {
                setStatus(t('رسم الغلاف...', 'Painting Cover...'));
                const rawCover = storyDataPropRef.current.finalPrompts?.[0] || coverPrompt;
                const coverImagePrompt = typeof rawCover === 'string' ? rawCover : (rawCover?.imagePrompt || rawCover?.prompt);
                logMsg(`--> Painting Cover...`);
                await sleep(delayBetweenScenes);
                const coverRes = await retryStep('Painting Cover', () => backendApi.generateImage({
                    prompt: coverImagePrompt, stylePrompt: visualStylePrompt,
                    referenceBase64: mainDNA, characterDescription: storyData.mainCharacter?.description,
                    age: storyData.childAge || '5', secondReferenceBase64: secondDNA
                })) as any;
                if (coverRes.imageBase64 || coverRes.data?.imageBase64) {
                    const b64 = coverRes.imageBase64 || coverRes.data?.imageBase64;
                    logMsg(`✓ Cover perfectly generated.`);
                    spreads[0] = { ...spreads[0], illustrationUrl: b64, actualPrompt: coverImagePrompt };
                    storyData = { ...storyData, coverImageUrl: b64, actualCoverPrompt: coverImagePrompt, spreads: [...spreads] };
                    storyDataRef.current = storyData;
                    onUpdateStory(storyData);
                    await adminService.saveOrder(orderNumber, storyData, initialShippingDetails, total);
                }
            } else if (coverAlreadyDone) {
                logMsg(`Cover already exists. Skipping.`);
            }
            setProgress(60);

            // --- Generate Inner Spreads (1..N) ---
            for (let i = 0; i < innerPrompts.length; i++) {
                const spreadNum = i + 1;
                setStatus(t(`رسم المشهد ${spreadNum}/${innerPrompts.length}...`, `Painting Spread ${spreadNum}/${innerPrompts.length}...`));

                const existingUrl = spreads[spreadNum]?.illustrationUrl;
                const isCorrupted = existingUrl && (existingUrl.endsWith('...') || existingUrl.length < 55);

                if (!existingUrl || isCorrupted) {
                    if (isCorrupted) logMsg(`Repainting corrupted image for Spread ${spreadNum}...`);
                    logMsg(`--> Painting Spread ${spreadNum}/${innerPrompts.length}...`);

                    const latestRaw = storyDataPropRef.current.finalPrompts?.[hasCoverPrompt ? spreadNum : i] || innerPrompts[i];
                    const imagePrompt = typeof latestRaw === 'string' ? latestRaw : (latestRaw?.imagePrompt || latestRaw?.prompt);

                    if (!imagePrompt || !mainDNA) {
                        logMsg(`⚠️ Missing inputs for Spread ${spreadNum}, skipping.`);
                        continue;
                    }

                    logMsg(`Wait... cooling down tokens for ${delayBetweenScenes/1000}s...`);
                    await sleep(delayBetweenScenes);

                    const imgRes = await retryStep(`Painting Spread ${spreadNum}`, () => backendApi.generateImage({
                        prompt: imagePrompt, stylePrompt: visualStylePrompt,
                        referenceBase64: mainDNA, characterDescription: storyData.mainCharacter?.description,
                        age: storyData.childAge || '5', secondReferenceBase64: secondDNA
                    })) as any;

                    if (imgRes.imageBase64 || imgRes.data?.imageBase64) {
                        const b64 = imgRes.imageBase64 || imgRes.data?.imageBase64;
                        logMsg(`✓ Spread ${spreadNum} perfectly generated.`);
                        await uploadSpreadImage(spreadNum, b64, imagePrompt);
                    }
                } else {
                    logMsg(`Spread ${spreadNum} already exists. Skipping.`);
                }
                setProgress(60 + (35 * (spreadNum / innerPrompts.length)));
            }

            // Phase 7: RTL layout direction
            logMsg(`Phase 7: Final Assembly & Orientation Mapping`);
            if (lang === 'ar') {
                logMsg(`Assigning Right-to-Left (RTL) Reading Direction for Arabic...`);
                storyData = { ...storyData, readingDirection: 'rtl' };
            } else {
                storyData = { ...storyData, readingDirection: 'ltr' };
            }

            storyDataRef.current = storyData;
            onUpdateStory(storyData);
            await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);

            logMsg(`All phases complete!`);
            await adminService.updateOrderStatus(orderNumber, 'Processing' as any);
            setProgress(100);
            setStatus(t('اكتمل بنجاح!', 'Complete!'));

        } catch (e: any) {
            console.error("Pipeline Error:", e);
            logMsg(`[FATAL ERROR] ${e.message}`);
            setError(e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        runPipeline,
        isProcessing,
        progress,
        status,
        logs,
        error
    };
};
