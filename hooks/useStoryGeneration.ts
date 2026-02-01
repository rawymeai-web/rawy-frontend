import { useState, useEffect } from 'react';
import type { StoryData, Language, Page } from '../types';
import * as geminiService from '../services/geminiService';

export const useStoryGeneration = (
    storyData: StoryData,
    updateStory: (updates: Partial<StoryData>) => void
) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [generationProgress, setGenerationProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [currentQuote, setCurrentQuote] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Comic Quotes Rotation
    useEffect(() => {
        if (!isGenerating) return;
        const quotes = [
            "Every artist was first an amateur. - Ralph Waldo Emerson",
            "Creativity takes courage. - Henri Matisse",
            "Drawing is creating a world that never existed before.",
            "The best way to predict the future is to create it.",
            "Logic will get you from A to B. Imagination will take you everywhere. - Einstein",
            "Every child is an artist. The problem is how to remain an artist once we grow up. - Picasso"
        ];
        let i = 0;
        setCurrentQuote(quotes[0]);
        const interval = setInterval(() => {
            i = (i + 1) % quotes.length;
            setCurrentQuote(quotes[i]);
        }, 5000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    const startGeneration = async (language: Language, onComplete: () => void, onError: () => void) => {
        setIsGenerating(true);
        setGenerationStatus(language === 'ar' ? 'بدء المعالجة...' : 'Initializing Production...');
        setGenerationProgress(2);
        setTimeLeft('~120s');
        setError(null);

        // Progress Weights (Total 100%)
        // Planning (35%):
        // - Script Draft: 5%
        // - Script Polish: 5%
        // - Cover: 10%
        // - Visual Plan: 5%
        // - Prompt Eng: 5%
        // - Prompt QA: 5%
        // Production (65%):
        // - 8 Spreads + Cover Uploads

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

            // --- PHASE 1: SCRIPT & COVER (Async Parallel) ---

            // 1A. Script (Draft + Polish) - 10%
            const scriptTask = (async () => {
                updateProgress(2, language === 'ar' ? 'استدعاء الحكواتي...' : 'Summoning the Story Weaver...');
                const draft = await geminiService.generateScriptDraft(storyData.blueprint!, language, storyData.childName);

                updateProgress(4, language === 'ar' ? 'كتابة المسودة الأولى...' : 'Finding the golden quill (Drafting)...');
                const polished = await geminiService.polishScript(draft, storyData.blueprint!, language);

                updateProgress(4, language === 'ar' ? 'تنقيح الكلمات...' : 'Polishing the rhymes (Editing)...');
                return polished;
            })();

            // 1B. Cover (10%)
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
                updateProgress(10); // Silent progress update
                return { ...res, displayTitle };
            });

            // 1C. Prompts (Design -> Eng -> QA) - 15%
            const promptsTask = (async () => {
                updateProgress(2, language === 'ar' ? 'تخيل المشاهد...' : 'Dreaming up the scenes...');

                let prompts = storyData.finalPrompts;
                let spreadPlan = storyData.spreadPlan;

                if (!prompts || prompts.length === 0) {
                    if (!spreadPlan) {
                        updateProgress(3, language === 'ar' ? 'تخطيط الصفحات...' : 'Sketching the layout...');
                        spreadPlan = await geminiService.runVisualDesigner(storyData.blueprint!);
                    }

                    updateProgress(5, language === 'ar' ? 'مزج الألوان السحرية...' : 'Mixing the magic paints (Prompts)...');
                    prompts = await geminiService.runPromptEngineer(spreadPlan, storyData.technicalStyleGuide || '', storyData.selectedStylePrompt, storyData.blueprint!);

                    updateProgress(5, language === 'ar' ? 'مراجعة الرسامين...' : 'Consulting the Art Elves (QA)...');
                    prompts = await geminiService.runPromptReviewer(prompts);

                    return { prompts, spreadPlan };
                }

                updateProgress(15);
                return { prompts, spreadPlan: storyData.spreadPlan };
            })();

            // Wait for all planning to finish
            const [script, coverResult, promptsResult] = await Promise.all([scriptTask, coverTask, promptsTask]);

            const prompts = promptsResult.prompts;
            const finalSpreadPlan = promptsResult.spreadPlan?.spreads || [];

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

            // --- PHASE 2: SPREAD GENERATION (65%) ---

            const pages: Page[] = [];

            // Remaining progress allocated to spreads
            const spreadWeight = 65 / prompts.length;
            const BATCH_SIZE = 4;

            for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
                const batch = prompts.slice(i, i + BATCH_SIZE);
                const remaining = prompts.length - i;
                const estSeconds = remaining * 12;
                setTimeLeft(`~${estSeconds}s`);

                setGenerationStatus(language === 'ar'
                    ? `جاري رسم الصفحات ${i + 1}-${Math.min(i + BATCH_SIZE, prompts.length)}...`
                    : `Painting pages ${i + 1}-${Math.min(i + BATCH_SIZE, prompts.length)}...`);

                const batchResults = await Promise.all(batch.map(async (prompt, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    const plan = finalSpreadPlan[globalIndex];
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

                    const res = await geminiService.generateMethod4Image(scenePrompt, storyData.selectedStylePrompt, masterDNA, storyData.mainCharacter.description, storyData.childAge, storyData.styleSeed, secondRef);

                    updateProgress(spreadWeight);
                    return res;
                }));

                batchResults.forEach((res, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    const cleanText = (t: string) => t.replace(/{name}/g, storyData.childName).replace(/\*.*?\*/g, '').trim();
                    const txt1 = cleanText(script[globalIndex]?.text || "");
                    const plan = finalSpreadPlan[globalIndex];
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

            pages.sort((a, b) => a.pageNumber - b.pageNumber);
            updateStory({ ...interimStoryData, pages });
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
        timeLeft,
        currentQuote,
        error,
        startGeneration
    };
};
