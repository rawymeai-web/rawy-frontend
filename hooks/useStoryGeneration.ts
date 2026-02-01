import { useState } from 'react';
import type { StoryData, Language, Page } from '../types';
import * as geminiService from '../services/geminiService';

export const useStoryGeneration = (
    storyData: StoryData,
    updateStory: (updates: Partial<StoryData>) => void
) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [generationProgress, setGenerationProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState<string>(''); // New Time Estimation State
    const [error, setError] = useState<string | null>(null);

    const startGeneration = async (language: Language, onComplete: () => void, onError: () => void) => {
        setIsGenerating(true);
        setGenerationStatus(language === 'ar' ? 'بدء المعالجة المتوازية...' : 'Initializing Production (Est. ~2 mins)...');
        setGenerationProgress(2);
        setTimeLeft('~120s');
        setError(null);

        // Progress Weights:
        // - Setup: 5%
        // - Text (Script/Plan): 30%
        // - Images: 65% (Roughly 7% per image for 9 images)
        let currentProgress = 5;
        const updateProgress = (increment: number, status?: string) => {
            currentProgress = Math.min(99, currentProgress + increment);
            setGenerationProgress(Math.round(currentProgress));
            if (status) setGenerationStatus(status);
        };

        try {
            const masterDNA = storyData.mainCharacter.imageBases64[0] || storyData.styleReferenceImageBase64;
            if (!masterDNA) throw new Error("No style reference found");
            if (!storyData.blueprint) throw new Error("No blueprint found");

            // --- 1. PARALLEL TEXT & COVER PHASE (0% -> 35%) ---

            // Task A: Script (10%)
            const scriptTask = geminiService.generateFinalScript(storyData.blueprint, language, storyData.childName).then(res => {
                updateProgress(10, language === 'ar' ? 'تم كتابة القصة...' : 'Story written...');
                return res;
            });

            // Task B: Cover (10%) - Starts immediately
            const isAr = language === 'ar';
            const frontSide = isAr ? 'LEFT' : 'RIGHT';
            const backSide = isAr ? 'RIGHT' : 'LEFT';
            let displayTitle = storyData.title;
            const nameLower = storyData.childName.toLowerCase();
            if (!displayTitle.toLowerCase().includes(nameLower)) {
                displayTitle = `${storyData.childName}'s ${displayTitle}`;
            }

            const coverSceneContext = (storyData.customGoal && storyData.customGoal.length > 5)
                ? `Scene illustrating: ${storyData.customGoal}`
                : `${storyData.childName} looking epic and welcoming.`;

            const coverPrompt = `TASK: Create a Panoramic 16:9 Book Cover Spread.
**LAYOUT MANDATE:**
- **${frontSide} HALF (FRONT COVER):** Hero (${storyData.childName}, Age: ${storyData.childAge}) MUST be here. Focus on the child's face and expression.
- **${backSide} HALF (BACK COVER):** Empty/Minimal background or pattern only.
- **NO CENTRAL SEAM:** The image must flow continuously as one single panoramic art piece.
**STORY INFO:**
TITLE: ${displayTitle} (CONTEXT ONLY - DO NOT RENDER TEXT).
STYLE: ${storyData.selectedStylePrompt}
**SCENE:** ${coverSceneContext}
**INTEGRATION:** Ensure the character is naturally lit and blended into the scene. No "sticker" look.
**NEGATIVE PROMPT:** TEXT, TITLE, LETTERS, WORDS, TYPOGRAPHY, WATERMARK, ADULTS, PARENTS, SPLIT QUERY, SEPARATE IMAGES.`;

            const coverTask = geminiService.generateMethod4Image(coverPrompt, storyData.selectedStylePrompt, masterDNA, storyData.mainCharacter.description, storyData.childAge, storyData.styleSeed).then(res => {
                updateProgress(10); // Cover is worth 10%
                return { ...res, displayTitle };
            });

            // Task C: Prompts + Plan (10%)
            const promptsTask = (async () => {
                let prompts = storyData.finalPrompts;
                if (!prompts || prompts.length === 0) {
                    let effectiveSpreadPlan = storyData.spreadPlan;
                    if (!effectiveSpreadPlan) {
                        effectiveSpreadPlan = await geminiService.runVisualDesigner(storyData.blueprint!);
                    }
                    prompts = await geminiService.runPromptEngineer(effectiveSpreadPlan, storyData.technicalStyleGuide || '', storyData.selectedStylePrompt, storyData.blueprint!);
                    prompts = await geminiService.runPromptReviewer(prompts);
                    updateProgress(10, language === 'ar' ? 'تم تصميم المشاهد...' : 'Scenes designed...');
                    return { prompts, spreadPlan: effectiveSpreadPlan };
                }
                updateProgress(10);
                return { prompts, spreadPlan: storyData.spreadPlan };
            })();

            const [script, coverResult, promptsResult] = await Promise.all([scriptTask, coverTask, promptsTask]);

            const prompts = promptsResult.prompts;
            const spreadPlan = promptsResult.spreadPlan?.spreads || [];

            // Update intermediate state
            const interimStoryData = {
                ...storyData,
                title: coverResult.displayTitle || storyData.title,
                coverImageUrl: coverResult.imageBase64,
                actualCoverPrompt: coverResult.fullPrompt,
                finalPrompts: prompts,
                spreadPlan: promptsResult.spreadPlan || storyData.spreadPlan
            };
            updateStory(interimStoryData);

            // --- 2. SPREAD GENERATION PHASE (35% -> 100%) ---
            // Remaining 65% split among 8 spreads (~8% per spread)
            const spreadWeight = 65 / prompts.length;

            const pages: Page[] = [];
            const completedSpreads: any[] = [];

            // We use a concurrency limit of 4 to be safe but faster than 6/2 split
            // Or just run 4 then 4.
            const BATCH_SIZE = 4;

            for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
                const batch = prompts.slice(i, i + BATCH_SIZE);

                // Track batch start for status
                const remaining = prompts.length - i;
                const estSeconds = remaining * 12; // Approx 12s per image
                setTimeLeft(`~${estSeconds}s`);
                setGenerationStatus(language === 'ar'
                    ? `جاري رسم الصفحات ${i + 1}-${Math.min(i + BATCH_SIZE, prompts.length)} من ${prompts.length}...`
                    : `Painting pages ${i + 1}-${Math.min(i + BATCH_SIZE, prompts.length)} of ${prompts.length}...`);

                // Run batch with individual progress tracking
                const batchResults = await Promise.all(batch.map(async (prompt, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    const plan = spreadPlan[globalIndex];
                    const side = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                    const opp = side === 'left' ? 'right' : 'left';
                    const secondRef = (storyData.useSecondCharacter && storyData.secondCharacter?.imageBases64?.[0]) ? storyData.secondCharacter.imageBases64[0] : undefined;

                    const scenePrompt = `**COMPOSITION: STAGE-LIKE LAYOUT (RULE OF THIRDS)**
- **${side.toUpperCase()} SIDE (Subject):** The Main Character MUST be positioned clearly on this side.
- **${opp.toUpperCase()} SIDE (Void):** THIS AREA MUST BE EMPTY BACKGROUND / NEGATIVE SPACE. It is reserved for text. DO NOT PUT IMPORTANT ELEMENTS HERE.
${secondRef ? `**MANDATORY:** THE SECOND HERO FROM IMAGE 2 MUST BE VISIBLE.` : ''}

**SCENE ACTION:**
${prompt}
**GUIDELINE:** Filter out adults. Focus on child hero.
NEGATIVE: No vertical seams, no text, VISIBLE PARENTS, MOM'S FACE, DAD'S FACE.`;

                    // Generate Image
                    const res = await geminiService.generateMethod4Image(scenePrompt, storyData.selectedStylePrompt, masterDNA, storyData.mainCharacter.description, storyData.childAge, storyData.styleSeed, secondRef);

                    // Update Progress PER IMAGE
                    updateProgress(spreadWeight);
                    return res;
                }));

                // Process Results
                batchResults.forEach((res, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    const cleanText = (t: string) => t.replace(/{name}/g, storyData.childName).replace(/\*.*?\*/g, '').trim();
                    const txt1 = cleanText(script[globalIndex]?.text || "");
                    const plan = spreadPlan[globalIndex];
                    const side = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                    const opp = side === 'left' ? 'right' : 'left';

                    pages.push({
                        pageNumber: globalIndex + 1,
                        text: txt1,
                        illustrationUrl: res.imageBase64,
                        actualPrompt: res.fullPrompt,
                        textSide: opp,
                        textBlocks: [{ text: txt1, position: { top: 10, left: 10, width: 30 }, alignment: 'center' }]
                    });
                });
            }
        }

            // Ensure pages are sorted just in case
            pages.sort((a, b) => a.pageNumber - b.pageNumber);

        updateStory({ ...currentStoryData, pages });
        onComplete();

    } catch (e: any) {
        console.error(e);
        setError(e.message || "Generation failed");
        onError();
    } finally {
        setIsGenerating(false);
    }
};

return {
    isGenerating,
    generationStatus,
    generationProgress,
    error,
    startGeneration
};
};
