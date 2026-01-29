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
            // User Request: Arabic Front = Right, English Front = Left
            const frontSide = isAr ? 'RIGHT' : 'LEFT';
            const backSide = isAr ? 'LEFT' : 'RIGHT';

            const coverPrompt = `TASK: Create a Panoramic 16:9 Book Cover Spread.
**LAYOUT MANDATE:**
- **${frontSide} HALF (FRONT COVER):** Hero MUST be here. Main subject focus. Top 30% clean sky for Title.
- **${backSide} HALF (BACK COVER):** Empty/Minimal background or pattern only. Space for blurb.
- **NO CENTRAL SEAM:** The image must flow continuously.

**STORY INFO:**
TITLE: ${storyData.title}
STYLE: ${storyData.selectedStylePrompt}

**SCENE:** The hero looking epic/welcoming.
**INTEGRATION:** Ensure the character is naturally lit and blended into the scene. No "sticker" look.`;

            const coverResult = await geminiService.generateMethod4Image(coverPrompt, masterDNA, storyData.styleSeed);
            const currentStoryData = { ...storyData, coverImageUrl: coverResult.imageBase64, actualCoverPrompt: coverResult.fullPrompt };
            updateStory(currentStoryData);

            // PAGES GEN
            const pages: Page[] = [];
            const spreadPlan = storyData.spreadPlan?.spreads || [];

            // SELF-HEALING: If prompts are missing (e.g. skipped workflow), try to regenerate them
            let prompts = storyData.finalPrompts;
            if (!prompts || prompts.length === 0) {
                setGenerationStatus(language === 'ar' ? 'إصلاح المخطط المفقود...' : 'Repairing missing blueprints...');
                // Attempt to recover using minimal path
                try {
                    // We need spreadPlan first
                    let effectiveSpreadPlan = storyData.spreadPlan;
                    if (!effectiveSpreadPlan) {
                        effectiveSpreadPlan = await geminiService.runVisualDesigner(storyData.blueprint);
                        updateStory({ spreadPlan: effectiveSpreadPlan });
                    }

                    prompts = await geminiService.runPromptEngineer(
                        effectiveSpreadPlan,
                        storyData.technicalStyleGuide || '',
                        storyData.selectedStylePrompt,
                        storyData.blueprint
                    );
                    // Review them quickly
                    prompts = await geminiService.runPromptReviewer(prompts);
                    updateStory({ finalPrompts: prompts });
                } catch (recoveryError) {
                    console.error("Failed to self-heal story:", recoveryError);
                    throw new Error("Story data corrupted. Please restart.");
                }
            }

            for (let i = 0; i < prompts.length; i++) {
                setGenerationStatus(language === 'ar' ? `رسم المشهد ${i + 1}/${prompts.length}...` : `Painting Scene ${i + 1}/${prompts.length}...`);

                const plan = spreadPlan[i];
                // Fallback for plan
                const side = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                const opp = side === 'left' ? 'right' : 'left';

                const secondRef = (storyData.useSecondCharacter && storyData.secondCharacter?.imageBases64?.[0])
                    ? storyData.secondCharacter.imageBases64[0]
                    : undefined;

                // INJECT STYLE TO PREVENT DRIFT
                const scenePrompt = `**STYLE MANDATE:** ${storyData.selectedStylePrompt}

**COMPOSITION:**
- **${side.toUpperCase()} SIDE:** ${side === 'left' ? 'Page 2' : 'Page 3'} Focus. Hero visible here.
- **${opp.toUpperCase()} SIDE:** Negative space / Background for text.
${secondRef ? `**MANDATORY:** THE SECOND HERO FROM IMAGE 2 MUST BE VISIBLE (IF MENTIONED IN SCENE).` : ''}

**SCENE ACTION:**
${prompts[i]}
NEGATIVE: No vertical seams, no text.`;

                const spreadResult = await geminiService.generateMethod4Image(scenePrompt, masterDNA, storyData.styleSeed, secondRef);

                const txt1 = script[i * 2]?.text.replace(/{name}/g, storyData.childName) || "";
                const txt2 = script[i * 2 + 1]?.text.replace(/{name}/g, storyData.childName) || "";

                pages.push({
                    pageNumber: i * 2 + 1,
                    text: txt1,
                    illustrationUrl: spreadResult.imageBase64,
                    actualPrompt: spreadResult.fullPrompt,
                    textBlocks: [{ text: txt1, position: { top: 20, left: 10, width: 35 }, alignment: 'center' }],
                    textSide: opp
                });
                pages.push({
                    pageNumber: i * 2 + 2,
                    text: txt2,
                    illustrationUrl: spreadResult.imageBase64,
                    actualPrompt: spreadResult.fullPrompt,
                    textBlocks: [{ text: txt2, position: { top: 20, left: 55, width: 35 }, alignment: 'center' }],
                    textSide: opp
                });
                setGenerationProgress(20 + ((i + 1) / prompts.length) * 80);
            }

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
