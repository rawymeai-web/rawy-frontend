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
        setGenerationStatus(language === 'ar' ? 'تحليل المخطط النهائي...' : 'Analyzing final blueprint...');
        setGenerationProgress(0);
        setError(null);

        try {
            const masterDNA = storyData.styleReferenceImageBase64;
            if (!masterDNA) throw new Error("No style reference found");
            if (!storyData.blueprint) throw new Error("No blueprint found");

            const script = await geminiService.generateFinalScript(storyData.blueprint, language);
            setGenerationProgress(20);

            // COVER GEN
            setGenerationStatus(language === 'ar' ? 'رسم اللوحة الكبرى للغلاف...' : 'Painting the Grand Cover...');

            // STRICTER COVER LOGIC
            const isAr = language === 'ar';
            // User Request: Arabic Front = Left, English Front = Right (Hero/Title Side)
            // Note: This logic places the "Front Cover" (Hero) on the spread.
            // English Book (L-to-R): Front Cover is on the RIGHT side of the open spread.
            // Arabic Book (R-to-L): Front Cover is on the LEFT side of the open spread.
            const frontSide = isAr ? 'LEFT' : 'RIGHT';
            const backSide = isAr ? 'RIGHT' : 'LEFT';

            const coverPrompt = `TASK: Create a Panoramic 16:9 Book Cover Spread.
**LAYOUT MANDATE:**
- **${frontSide} HALF (FRONT COVER):** Hero (${storyData.childName}) MUST be here. Focus on the child. Top 30% clean sky for Title.
- **${backSide} HALF (BACK COVER):** Empty/Minimal background or pattern only. Space for blurb.
- **NO CENTRAL SEAM:** The image must flow continuously.

**STORY INFO:**
TITLE: ${storyData.title}
SUBTITLE: A story about ${storyData.childName}
STYLE: ${storyData.selectedStylePrompt}

**SCENE:** ${storyData.childName} looking epic and welcoming.
**INTEGRATION:** Ensure the character is naturally lit and blended into the scene. No "sticker" look.`;

            const coverResult = await geminiService.generateMethod4Image(coverPrompt, masterDNA, storyData.styleSeed);
            const currentStoryData = { ...storyData, coverImageUrl: coverResult.imageBase64, actualCoverPrompt: coverResult.fullPrompt };
            updateStory(currentStoryData);

            // PAGES GEN - OPTIMIZED BATCHING
            const spreadPlan = storyData.spreadPlan?.spreads || [];

            // SELF-HEALING (Moved inside batch loop if needed, but keeping pre-check is safer)
            let prompts = storyData.finalPrompts;
            if (!prompts || prompts.length === 0) {
                // ... (Keep existing self-healing logic if desired, or assume it's done)
                // For safety re-implement strict self-healing here or assume it's passed.
                // Let's assume prompts exist or we run the healer block from before (omitted here for brevity in replace, but critical to keep if not replacing whole file)
                // Wait, I am replacing the block that *contained* the healer. I must put it back.
                setGenerationStatus(language === 'ar' ? 'إصلاح المخطط المفقود...' : 'Repairing missing blueprints...');
                try {
                    let effectiveSpreadPlan = storyData.spreadPlan;
                    if (!effectiveSpreadPlan) {
                        effectiveSpreadPlan = await geminiService.runVisualDesigner(storyData.blueprint);
                        updateStory({ spreadPlan: effectiveSpreadPlan });
                    }
                    prompts = await geminiService.runPromptEngineer(effectiveSpreadPlan, storyData.technicalStyleGuide || '', storyData.selectedStylePrompt, storyData.blueprint);
                    prompts = await geminiService.runPromptReviewer(prompts);
                    updateStory({ finalPrompts: prompts });
                } catch (recoveryError) {
                    console.error("Failed to self-heal:", recoveryError);
                    throw new Error("Story data corrupted.");
                }
            }

            const pages: Page[] = [];
            const BATCH_SIZE = 3;

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
**COMPOSITION:**
- **${side.toUpperCase()} SIDE:** Focus. Hero visible here.
- **${opp.toUpperCase()} SIDE:** Negative space / Background for text.
${secondRef ? `**MANDATORY:** THE SECOND HERO FROM IMAGE 2 MUST BE VISIBLE.` : ''}

**SCENE ACTION:**
${prompt}
NEGATIVE: No vertical seams, no text.`;

                    return geminiService.generateMethod4Image(scenePrompt, masterDNA, storyData.styleSeed, secondRef);
                }));

                // Process batch results
                batchResults.forEach((res, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    const txt1 = script[globalIndex * 2]?.text.replace(/{name}/g, storyData.childName) || "";
                    const txt2 = script[globalIndex * 2 + 1]?.text.replace(/{name}/g, storyData.childName) || "";

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

                // Sort pages by number to ensure order is preserved despite async (though map preserves order, pushing might not if logic diverged, but here we process results sequentially from the array)
                // Actually Promise.all returns in order. we push in order. good.
                setGenerationProgress(20 + ((i + BATCH_SIZE) / prompts.length) * 80);
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
