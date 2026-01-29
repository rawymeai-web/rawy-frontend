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
            const frontSide = isAr ? 'LEFT' : 'RIGHT';
            const backSide = isAr ? 'RIGHT' : 'LEFT';

            const coverPrompt = `TASK: Create a Panoramic 16:9 Book Cover Spread.
**LAYOUT MANDATE:**
- **${frontSide} HALF (FRONT COVER):** Hero MUST be here. Main subject focus. Top 30% clean sky for Title.
- **${backSide} HALF (BACK COVER):** Empty/Minimal background or pattern only. Space for blurb.
- **NO CENTRAL SEAM:** The image must flow continuously.

**STORY INFO:**
TITLE: ${storyData.title}
STYLE: ${storyData.selectedStylePrompt}

**SCENE:** The hero looking epic/welcoming.`;

            const coverResult = await geminiService.generateMethod4Image(coverPrompt, masterDNA, storyData.styleSeed);
            const currentStoryData = { ...storyData, coverImageUrl: coverResult.imageBase64, actualCoverPrompt: coverResult.fullPrompt };
            updateStory(currentStoryData);

            // PAGES GEN
            const pages: Page[] = [];
            const prompts = storyData.finalPrompts!;
            const spreadPlan = storyData.spreadPlan?.spreads || [];

            for (let i = 0; i < prompts.length; i++) {
                setGenerationStatus(language === 'ar' ? `رسم المشهد ${i + 1}/${prompts.length}...` : `Painting Scene ${i + 1}/${prompts.length}...`);

                const plan = spreadPlan[i];
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
