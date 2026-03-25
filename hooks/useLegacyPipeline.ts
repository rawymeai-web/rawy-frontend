```typescript
import { useState, useRef, useCallback } from 'react';
import { backendApi } from '../services/backendApi';
import * as adminService from '../services/adminService';
import { compressBase64Image } from '../utils/imageUtils';
import type { StoryData, Language, Page } from '../types';

export const useLegacyPipeline = (
    orderNumber: string,
    initialStoryData: StoryData,
    initialShippingDetails: any,
    language: Language,
    onUpdateStory: (updates: Partial<StoryData>) => void
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
                storyData.pages = [];
                storyData.finalPrompts = [];
                storyData.prompts = [];      // ← CRITICAL FIX: Clear backend worker prompts (Sarah/cheetah contamination)
                storyData.actualCoverPrompt = undefined;
                storyData.coverImageUrl = undefined;
                
                storyDataRef.current = storyData;
                storyDataPropRef.current = storyData;
                onUpdateStory({ 
                    blueprint: undefined, script: [], spreadPlan: undefined, 
                    pages: [], finalPrompts: [], prompts: [], actualCoverPrompt: undefined 
                } as any);
                await adminService.saveOrder(storyData.orderId || orderNumber || 'RWY-UNKNOWN', storyData, initialShippingDetails || {});
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
                const blueprintRes = await retryStep('Architect AI Blueprint', () => backendApi.generateBlueprint({ storyData: blueprintPayload, language: lang })) as any;
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
                const storyRes = await retryStep('Writer AI Script', () => backendApi.generateStory({ storyData: storyPayload, language: lang, blueprint: storyData.blueprint })) as any;
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
                    visualDNA: storyData.selectedStylePrompt || "Painterly illustration"
                })) as any;
                if (planRes.error) throw new Error(planRes.error);

                logMsg(`Cinematographer AI mapped 8 scenes successfully.`);
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
            logMsg(`Starting Phase 5: Image Generation Pipeline (Painting 8 Spreads + Cover)`);
            const settings = await adminService.getSettings();
            const delayBetweenScenes = Math.max(25000, (settings.generationDelay || 0) * 1000); // Minimum 25s mandatory delay for token cooling
            
            const prompts = storyData.finalPrompts || [];
            if (!prompts || prompts.length === 0) throw new Error("No prompts found to generate images.");
            
            // v4 Workflow: prompts[0] is Cover, prompts[1..8] are inner spreads.
            const dynamicCoverPrompt = prompts[0];
            const pagePrompts = prompts.length > 8 ? prompts.slice(1) : prompts;
            const finalScript = storyData.script || [];
            
            let pages: Page[] = storyData.pages || [];
            // Ensure pages array has all required spots (8 pages for 4 spreads + 1 cover)
            const expectedPages = pagePrompts.length * 2;
            for (let i = 0; i < pagePrompts.length; i++) {
                const pageIndex = i * 2;
                const txt1 = finalScript[pageIndex]?.text?.replace(/{name}/g, storyData.childName) || "";
                const txt2 = finalScript[pageIndex + 1]?.text?.replace(/{name}/g, storyData.childName) || "";
                
                const side1 = storyData.spreadPlan?.spreads?.[i]?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                const side2 = side1 === 'left' ? 'right' : 'left';
                
                const latestPrompt = pagePrompts[i];
                const imagePrompt = typeof latestPrompt === 'string' ? latestPrompt : (latestPrompt?.imagePrompt || latestPrompt?.prompt || "");

                // Page 1 of Spread
                if (!pages[pageIndex]) {
                    pages[pageIndex] = { 
                        pageNumber: pageIndex + 1, text: txt1, textSide: side1, illustrationUrl: '', 
                        textBlocks: [{text: txt1, position: {top: 25, left: side1 === 'left' ? 10 : 60, width: 30}, alignment: 'center'}],
                        actualPrompt: imagePrompt
                    };
                } else {
                    pages[pageIndex].actualPrompt = imagePrompt;
                }

                // Page 2 of Spread
                if (!pages[pageIndex + 1]) {
                    pages[pageIndex + 1] = { 
                        pageNumber: pageIndex + 2, text: txt2, textSide: side2, illustrationUrl: '', 
                        textBlocks: [{text: txt2, position: {top: 25, left: side2 === 'left' ? 10 : 60, width: 30}, alignment: 'center'}],
                        actualPrompt: imagePrompt
                    };
                } else {
                    pages[pageIndex + 1].actualPrompt = imagePrompt;
                }
            }
            pages = pages.slice(0, 8); // Force 8 pages
            
            storyData = { ...storyData, pages };
            storyDataRef.current = storyData;
            onUpdateStory(storyData);
            await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);

            // Generation Phase (Spreads)
            for (let i = 0; i < pagePrompts.length; i++) {
                setStatus(t(`رسم المشهد ${i + 1}/${pagePrompts.length}...`, `Painting Scene ${i + 1}/${pagePrompts.length}...`));
                const existingUrl = pages[i]?.illustrationUrl;
                const isCorrupted = existingUrl && (existingUrl.endsWith('...') || existingUrl.length < 55);

                if (!existingUrl || isCorrupted) {
                    // Check for latest prompt from props right before generation
                    const currentPropStory = storyDataPropRef.current;
                    const propPrompts = currentPropStory.finalPrompts ? (currentPropStory.finalPrompts.length > 8 ? currentPropStory.finalPrompts.slice(1) : currentPropStory.finalPrompts) : [];
                    const latestPrompt = propPrompts[i] || pagePrompts[i];
                    
                    if (isCorrupted) logMsg(`Repainting corrupted image for Scene ${i+1}...`);
                    logMsg(`--> Painting Scene ${i+1}/${pagePrompts.length}...`);
                    
                    const rawPrompt = latestPrompt;
                    const imagePrompt = typeof rawPrompt === 'string' ? rawPrompt : (rawPrompt?.imagePrompt || rawPrompt?.prompt);
                    const mainDNA = storyData.styleReferenceImageUrl || storyData.styleReferenceImageBase64 || storyData.mainCharacter?.imageDNA?.[0] || storyData.mainCharacter?.imageBases64?.[0];

                    if (!imagePrompt || !mainDNA) {
                        logMsg(`⚠️ Missing inputs for Scene ${i+1}, skipping.`);
                        continue;
                    }

                    if (i > 0) {
                        logMsg(`Wait... cooling down tokens for ${delayBetweenScenes/1000}s...`);
                        await sleep(delayBetweenScenes);
                    }

                    const visualStylePrompt = `${storyData.selectedStylePrompt}. Theme: ${storyData.themeVisualDNA || storyData.theme || 'Neutral'}`;

                    const imgRes = await retryStep(`Painting Scene ${i+1}`, () => backendApi.generateImage({
                        prompt: imagePrompt,
                        stylePrompt: visualStylePrompt,
                        referenceBase64: mainDNA,
                        characterDescription: storyData.mainCharacter?.description,
                        age: storyData.childAge || "5",
                        secondReferenceBase64: storyData.useSecondCharacter ? (storyData.secondCharacterImageBase64 || storyData.secondCharacterImageUrl || storyData.secondCharacter?.imageDNA?.[0] || storyData.secondCharacter?.imageBases64?.[0]) : undefined
                    })) as any;
                    
                    if (imgRes.imageBase64 || imgRes.data?.imageBase64) {
                        logMsg(`✓ Image ${i+1} perfectly generated.`);
                        const b64 = imgRes.imageBase64 || imgRes.data?.imageBase64;
                        const pageIndex = i * 2;
                        if (pages[pageIndex]) pages[pageIndex].illustrationUrl = b64;
                        if (pages[pageIndex + 1]) pages[pageIndex + 1].illustrationUrl = b64;
                        
                        if (pages[pageIndex]) pages[pageIndex].actualPrompt = imagePrompt;
                        if (pages[pageIndex + 1]) pages[pageIndex + 1].actualPrompt = imagePrompt;
                        
                        storyData = { ...storyData, pages };
                        storyDataRef.current = storyData;
                        onUpdateStory(storyData);
                        await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);
                    }
                } else {
                    logMsg(`Scene ${i+1} image already exists. Skipping.`);
                }
                setProgress(55 + (35 * ((i + 1) / pagePrompts.length)));
            }

            // Cover Generation
            const existingCover = storyData.coverImageUrl;
            const isCoverCorrupted = existingCover && (existingCover.endsWith('...') || existingCover.length < 55);
            if ((!existingCover || isCoverCorrupted) && prompts.length > 8) {
                setStatus(t('رسم الغلاف...', 'Painting Cover...'));
                logMsg(`--> Painting Cover...`);
                const currentPropStory = storyDataPropRef.current;
                const latestCoverPrompt = currentPropStory.finalPrompts?.[0] || dynamicCoverPrompt;
                const coverImagePrompt = typeof latestCoverPrompt === 'string' ? latestCoverPrompt : (latestCoverPrompt?.imagePrompt || latestCoverPrompt?.prompt);
                const mainDNA = storyData.styleReferenceImageUrl || storyData.styleReferenceImageBase64 || storyData.mainCharacter?.imageDNA?.[0] || storyData.mainCharacter?.imageBases64?.[0];

                if (coverImagePrompt && mainDNA) {
                    const visualStylePrompt = `${storyData.selectedStylePrompt}. Theme: ${storyData.themeVisualDNA || storyData.theme || 'Neutral'}`;
                    await sleep(delayBetweenScenes);
                    const coverRes = await retryStep(`Painting Cover`, () => backendApi.generateImage({
                        prompt: coverImagePrompt,
                        stylePrompt: visualStylePrompt,
                        referenceBase64: mainDNA,
                        characterDescription: storyData.mainCharacter?.description,
                        age: storyData.childAge || "5",
                        secondReferenceBase64: storyData.useSecondCharacter ? (storyData.secondCharacterImageBase64 || storyData.secondCharacterImageUrl || storyData.secondCharacter?.imageDNA?.[0] || storyData.secondCharacter?.imageBases64?.[0]) : undefined
                    })) as any;
                    
                    if (coverRes.imageBase64 || coverRes.data?.imageBase64) {
                        logMsg(`✓ Cover perfectly generated.`);
                        storyData = { 
                            ...storyData, 
                            coverImageUrl: coverRes.imageBase64 || coverRes.data?.imageBase64,
                            actualCoverPrompt: coverImagePrompt
                        };
                        storyDataRef.current = storyData;
                        onUpdateStory(storyData);
                        await adminService.saveOrder(orderNumber, storyData, initialShippingDetails);
                    }
                }
            } else if (prompts.length > 8) {
                logMsg(`Cover image already exists. Skipping.`);
            }
            
            // Phase 7: Automated Assembly & RTL Layout
            logMsg(`Phase 7: Final Assembly & Orientation Mapping`);
            if (lang === 'ar') {
                logMsg(`Assigning Right-to-Left (RTL) Reading Direction for Arabic...`);
                // We no longer flip the layout horizontally because the images are not flipped visually.
                // The text remains on the safe side defined by the Visual Plan, but aligned RTL.
                const rtlPages = storyData.pages?.map(p => {
                    return {
                        ...p,
                        textBlocks: p.textBlocks?.map(tb => ({
                            ...tb,
                            alignment: 'right' as const
                        }))
                    };
                });
                storyData = { 
                    ...storyData, 
                    pages: rtlPages || storyData.pages,
                    readingDirection: 'rtl'
                };
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
