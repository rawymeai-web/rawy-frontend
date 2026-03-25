import { useState, useEffect } from 'react';
import type { StoryData, Language, Page, WorkflowLog } from '../types';
import { backendApi } from '../services/backendApi';

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
        setGenerationStatus(language === 'ar' ? 'بدء المعالجة...' : 'Initializing Production (Backend Workflow)...');
        setGenerationProgress(2);
        setTimeLeft('~300s');
        setError(null);

        updateStory({ language });

        const logs: WorkflowLog[] = [];
        const addLog = (log: WorkflowLog) => {
            logs.push(log);
            updateStory({ workflowLogs: [...logs] });
        };

        const updateProgress = (inc: number, status?: string) => {
            setGenerationProgress(prev => Math.min(99, prev + inc));
            if (status) setGenerationStatus(status);
        };

        try {
            // 1. STORY (Blueprint + Narrative)
            updateProgress(15, "STATION 2 & 3: Architecting Story & Drafting Narrative...");
            const storyRes: any = await backendApi.generateStory({
                storyData,
                language
            });
            storyRes.logs.forEach(addLog);
            updateStory({
                blueprint: storyRes.blueprint,
                title: storyRes.blueprint.foundation.title
            });

            // 2. VISUAL PLAN (Station 4)
            updateProgress(15, "STATION 4: Designing Visuals...");
            // Use selectedStylePrompt for visualDNA context
            const visualDNA = `Style: \${storyData.selectedStylePrompt}. Theme: \${storyData.theme}`;
            const planRes: any = await backendApi.generateVisualPlan({
                script: storyRes.script,
                blueprint: storyRes.blueprint,
                visualDNA
            });
            addLog(planRes.log);
            updateStory({ spreadPlan: planRes.plan });

            // 3. PROMPTS & QA (Station 5 & 6)
            updateProgress(20, "STATION 5 & 6: Engineering Prompts & QA...");
            const promptRes: any = await backendApi.generatePrompts({
                plan: planRes.plan,
                visualDNA: storyData.selectedStylePrompt,
                childAge: storyData.childAge,
                childDescription: storyData.mainCharacter.description,
                language
            });
            promptRes.logs.forEach(addLog);
            updateStory({ finalPrompts: promptRes.prompts });

            const finalPrompts = promptRes.prompts;
            const finalScript = storyRes.script;
            const finalPlan = planRes.plan.spreads;

            // --- PRODUCTION (Images) ---
            const dynamicCoverPrompt = finalPrompts[0];
            const pagePrompts = finalPrompts.slice(1);
            const pagePlans = finalPlan.slice(1);

            const pages: Page[] = [];
            const remainingWeight = 40;
            const weightPerSpread = remainingWeight / (pagePrompts.length || 1);

            const masterDNA = storyData.mainCharacter.imageBases64[0] || storyData.styleReferenceImageBase64;

            for (let i = 0; i < pagePrompts.length; i++) {
                updateProgress(weightPerSpread, `PRODUCTION: Painting Spread \${i + 1}/\${pagePrompts.length}...`);
                const prompt = pagePrompts[i];
                const plan = pagePlans[i];
                const imageSide = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                const textSide = imageSide === 'left' ? 'right' : 'left';

                const imgRes: any = await backendApi.generateImage({
                    prompt,
                    stylePrompt: storyData.selectedStylePrompt,
                    referenceBase64: masterDNA,
                    characterDescription: storyData.mainCharacter.description,
                    age: storyData.childAge
                });

                const txt = (finalScript[i]?.text || "").replace(/{name}/g, storyData.childName);

                pages.push({
                    pageNumber: i + 1,
                    text: txt,
                    illustrationUrl: imgRes.imageBase64,
                    textSide: textSide,
                    textBlocks: [{
                        text: txt,
                        position: { top: 10, left: 10, width: 80 },
                        alignment: 'center'
                    }],
                    actualPrompt: imgRes.fullPrompt
                });
                updateStory({ pages: [...pages] });
            }

            // Cover
            updateProgress(10, "PRODUCTION: Painting Cover (Final Step)...");
            const coverRes: any = await backendApi.generateImage({
                prompt: dynamicCoverPrompt,
                stylePrompt: storyData.selectedStylePrompt,
                referenceBase64: masterDNA,
                characterDescription: storyData.mainCharacter.description,
                age: storyData.childAge
            });

            updateStory({
                coverImageUrl: coverRes.imageBase64,
                actualCoverPrompt: coverRes.fullPrompt
            });

            updateProgress(100, "Done!");
            setIsGenerating(false);
            onComplete();

        } catch (err: any) {
            console.error("Workflow Failed:", err);
            setError(err.message || "Unknown error");
            setGenerationStatus("Critical Failure. Check Logs.");
            setIsGenerating(false);
            onError();
        }
    };

    return {
        startGeneration,
        isGenerating,
        generationStatus,
        generationProgress,
        timeLeft,
        currentQuote,
        error
    };
};
