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
    const [error, setError] = useState<string | null>(null);

    const startGeneration = async (language: Language, onComplete: () => void, onError: () => void) => {
        setIsGenerating(true);
        setGenerationStatus(language === 'ar' ? 'بدء المعالجة المتوازية...' : 'Initializing Parallel Production...');
        setGenerationProgress(5);
        setError(null);

        try {
            const masterDNA = storyData.mainCharacter.imageBases64[0] || storyData.styleReferenceImageBase64;
            if (!masterDNA) throw new Error("No style reference found");
            if (!storyData.blueprint) throw new Error("No blueprint found");

            // --- 1. DEFINE PARALLEL TASKS ---

            // Task A: Script Generation
            const scriptTask = geminiService.generateFinalScript(storyData.blueprint, language).then(res => {
                setGenerationProgress(prev => prev + 10);
                return res;
            });

            // Task B: Cover Generation
            const isAr = language === 'ar';
            const frontSide = isAr ? 'LEFT' : 'RIGHT';
            const backSide = isAr ? 'RIGHT' : 'LEFT';

            // Enhance Title if needed (Integrate Child Name)
            let displayTitle = storyData.title;
            const nameLower = storyData.childName.toLowerCase();
            if (!displayTitle.toLowerCase().includes(nameLower)) {
                // E.g., "The Space Adventure" -> "Reem's Space Adventure"
                // Simple heuristic: prepend name.
                displayTitle = `${storyData.childName}'s ${displayTitle}`;
            }

            const coverPrompt = `TASK: Create a Panoramic 16:9 Book Cover Spread.
**LAYOUT MANDATE:**
- **${frontSide} HALF (FRONT COVER):** Hero (${storyData.childName}) MUST be here. Focus on the child. Top 30% clean sky.
- **${backSide} HALF (BACK COVER):** Empty/Minimal background or pattern only.
- **NO CENTRAL SEAM:** The image must flow continuously.

**STORY INFO:**
TITLE: ${displayTitle} (CONTEXT ONLY - DO NOT RENDER TEXT).
STYLE: ${storyData.selectedStylePrompt}

**SCENE:** ${storyData.childName} looking epic and welcoming.
**INTEGRATION:** Ensure the character is naturally lit and blended into the scene. No "sticker" look.
**NEGATIVE PROMPT:** TEXT, TITLE, LETTERS, WORDS, TYPOGRAPHY, WATERMARK, ADULTS, PARENTS.`;

            const coverTask = geminiService.generateMethod4Image(coverPrompt, masterDNA, storyData.mainCharacter.description, storyData.styleSeed).then(res => {
                setGenerationProgress(prev => prev + 10);
                // Return displayTitle so we can update the story data with it
                return { ...res, displayTitle };
            });

            // Task C: Prompts (Self-Healing if needed)
            const promptsTask = (async () => {
                let prompts = storyData.finalPrompts;
                if (!prompts || prompts.length === 0) {
                    // setGenerationStatus('Repairing blueprints...'); // Don't block UI with status updates, just run
                    let effectiveSpreadPlan = storyData.spreadPlan;
                    if (!effectiveSpreadPlan) {
                        effectiveSpreadPlan = await geminiService.runVisualDesigner(storyData.blueprint!);
                    }
                    prompts = await geminiService.runPromptEngineer(effectiveSpreadPlan, storyData.technicalStyleGuide || '', storyData.selectedStylePrompt, storyData.blueprint!);
                    prompts = await geminiService.runPromptReviewer(prompts);
                    setGenerationProgress(prev => prev + 10);
                    return { prompts, spreadPlan: effectiveSpreadPlan };
                }
                setGenerationProgress(prev => prev + 10);
                return { prompts, spreadPlan: storyData.spreadPlan };
            })();

            // --- 2. EXECUTE PARALLEL TASKS ---
            const [script, coverResult, promptsResult] = await Promise.all([scriptTask, coverTask, promptsTask]);

            const prompts = promptsResult.prompts;
            const spreadPlan = promptsResult.spreadPlan?.spreads || [];

            // Consolidate updates
            const currentStoryData = {
                ...storyData,
                title: coverResult.displayTitle || storyData.title, // Use the name-integrated title
                coverImageUrl: coverResult.imageBase64,
                actualCoverPrompt: coverResult.fullPrompt,
                finalPrompts: prompts,
                spreadPlan: promptsResult.spreadPlan || storyData.spreadPlan
            };
            updateStory(currentStoryData);

            // --- 3. BATCH IMAGE GENERATION ---

            const pages: Page[] = [];
            const BATCH_SIZE = 6;

            for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
                const batch = prompts.slice(i, i + BATCH_SIZE);
                setGenerationStatus(language === 'ar' ? `رسم الدفعة ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(prompts.length / BATCH_SIZE)}...` : `Painting Batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(prompts.length / BATCH_SIZE)}...`);

                const batchResults = await Promise.all(batch.map(async (prompt, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    const plan = spreadPlan[globalIndex];
                    const side = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                    const opp = side === 'left' ? 'right' : 'left';
                    const secondRef = (storyData.useSecondCharacter && storyData.secondCharacter?.imageBases64?.[0]) ? storyData.secondCharacter.imageBases64[0] : undefined;

                    const scenePrompt = `**STYLE MANDATE:** ${storyData.selectedStylePrompt}
**COMPOSITION: STAGE-LIKE LAYOUT (RULE OF THIRDS)**
- **${side.toUpperCase()} SIDE (Subject):** The Main Character MUST be positioned clearly on this side.
- **${opp.toUpperCase()} SIDE (Void):** THIS AREA MUST BE EMPTY BACKGROUND / NEGATIVE SPACE. It is reserved for text. DO NOT PUT IMPORTANT ELEMENTS HERE.
${secondRef ? `**MANDATORY:** THE SECOND HERO FROM IMAGE 2 MUST BE VISIBLE.` : ''}

**SCENE ACTION:**
${prompt}
**GUIDELINE:** If parents/family are in the scene, DO NOT show their faces. Use POV shots, specific details (hands, feet), or shadows. Fictional characters are allowed.
NEGATIVE: No vertical seams, no text, VISIBLE PARENTS, MOM'S FACE, DAD'S FACE, REALISTIC SIBLING FACES.`;

                    return geminiService.generateMethod4Image(scenePrompt, masterDNA, storyData.mainCharacter.description, storyData.styleSeed, secondRef);
                }));

                // Process batch results
                batchResults.forEach((res, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    const cleanText = (t: string) => t.replace(/{name}/g, storyData.childName).replace(/\*.*?\*/g, '').trim();
                    const txt1 = cleanText(script[globalIndex * 2]?.text || "");
                    const txt2 = cleanText(script[globalIndex * 2 + 1]?.text || "");

                    // Re-derive layout info for placement
                    const plan = spreadPlan[globalIndex];
                    const side = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                    const opp = side === 'left' ? 'right' : 'left';

                    pages.push({
                        pageNumber: globalIndex * 2 + 1,
                        text: txt1,
                        illustrationUrl: res.imageBase64,
                        actualPrompt: res.fullPrompt,
                        textBlocks: [{ text: txt1, position: { top: 20, left: 10, width: 35 }, alignment: 'center' }],
                        textSide: opp
                    });
                    pages.push({
                        pageNumber: globalIndex * 2 + 2,
                        text: txt2,
                        illustrationUrl: res.imageBase64,
                        actualPrompt: res.fullPrompt,
                        textBlocks: [{ text: txt2, position: { top: 20, left: 55, width: 35 }, alignment: 'center' }],
                        textSide: opp
                    });
                });

                setGenerationProgress(30 + ((i + BATCH_SIZE) / prompts.length) * 70);
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
