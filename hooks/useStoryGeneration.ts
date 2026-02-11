import { useState, useEffect } from 'react';
import type { StoryData, Language, Page, WorkflowLog } from '../types';
import * as geminiService from '../services/geminiService';
import { INITIAL_THEMES } from '../constants';

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
        setGenerationStatus(language === 'ar' ? 'بدء المعالجة...' : 'Initializing Production (Workflow v4)...');
        setGenerationProgress(2);
        setTimeLeft('~300s');
        setError(null);

        // PERSIST LANGUAGE SELECTION
        updateStory({ language });

        const logs: WorkflowLog[] = []; // Local accumulator
        // Helper to push logs to both local tracking and Global State (for UI)
        const addLog = (log: WorkflowLog) => {
            logs.push(log);
            updateStory({ workflowLogs: [...logs] });
        };

        const updateProgress = (inc: number, status?: string) => {
            setGenerationProgress(prev => Math.min(99, prev + inc));
            if (status) setGenerationStatus(status);
        };

        try {
            const masterDNA = storyData.mainCharacter.imageBases64[0] || storyData.styleReferenceImageBase64;
            if (!masterDNA) throw new Error("No style reference found");

            // Resolve Theme Object
            // Resolve Theme Object - Robust Lookup
            let themeObj = INITIAL_THEMES.find(t => t.id === storyData.theme);

            // Fallbacks if ID mismatch (e.g. if Title/Description was stored instead)
            if (!themeObj && storyData.themeId) {
                themeObj = INITIAL_THEMES.find(t => t.id === storyData.themeId);
            }
            if (!themeObj) {
                themeObj = INITIAL_THEMES.find(t =>
                    t.title.en === storyData.theme ||
                    t.description.en === storyData.theme ||
                    t.title.ar === storyData.theme
                );
            }

            if (!themeObj) throw new Error(`Theme not found: ${storyData.theme}`);

            // 1. BLUEPRINT (Station 2)
            const tBlueprintStart = performance.now();
            updateProgress(5, "STATION 2: Architecting Story Blueprint...");
            const blueprintResult = await geminiService.generateBlueprint({
                childName: storyData.childName,
                childAge: parseInt(storyData.childAge) || 5,
                themeId: storyData.theme,
                themeTitle: themeObj.title.en,
                themeData: themeObj,
                childDescription: storyData.mainCharacter.description // PASSING THE FIX
            }, language);
            console.log(`[TIMING] Blueprint: ${((performance.now() - tBlueprintStart) / 1000).toFixed(2)}s`);
            addLog(blueprintResult.log);
            updateStory({ blueprint: blueprintResult.result });
            if (blueprintResult.log.status === 'Failed') throw new Error("Blueprint Failed");


            // 2. DRAFTING (Station 3)
            const tDraftStart = performance.now();
            updateProgress(10, "STATION 3: Drafting Narrative...");
            const scriptResult = await geminiService.generateScript(
                blueprintResult.result,
                language,
                parseInt(storyData.childAge) || 5,
                storyData.childName
            );
            console.log(`[TIMING] Narrative Draft: ${((performance.now() - tDraftStart) / 1000).toFixed(2)}s`);
            addLog(scriptResult.log);
            if (scriptResult.log.status === 'Failed') throw new Error("Drafting Failed");

            // 3. VISUAL PLAN (Station 4)
            const tVisualStart = performance.now();
            updateProgress(10, "STATION 4: Designing Visuals...");

            // Director needs BOTH Style and Theme to describe the scenes correctly (e.g. "Neon props" in a "Cyberpunk" style)
            const directorDNA = `Style: ${storyData.selectedStylePrompt}. Theme Visuals: ${themeObj.visualDNA}`;

            const visualPlanResult = await geminiService.generateVisualPlan(
                scriptResult.result,
                blueprintResult.result,
                directorDNA
            );
            console.log(`[TIMING] Visual Plan: ${((performance.now() - tVisualStart) / 1000).toFixed(2)}s`);
            addLog(visualPlanResult.log);
            updateStory({ spreadPlan: visualPlanResult.result });
            if (visualPlanResult.log.status === 'Failed') throw new Error("Visual Plan Failed");

            // 4. PROMPTS (Station 5)
            const tPromptStart = performance.now();
            updateProgress(10, "STATION 5: Engineering Prompts...");

            // Renderer needs ONLY the Style. 
            // Theme details are now embedded in the VisualPlan's scene descriptions by the Director.
            // We do NOT want to pass "Theme: Watercolor" to the renderer if the style is "Pixar 3D".
            const rendererStyle = storyData.selectedStylePrompt;

            const promptResult = await geminiService.generatePrompts(
                visualPlanResult.result,
                rendererStyle,
                storyData.childAge,
                storyData.mainCharacter.description,
                language
            );
            console.log(`[TIMING] Prompt Engineering: ${((performance.now() - tPromptStart) / 1000).toFixed(2)}s`);
            addLog(promptResult.log);
            if (promptResult.log.status === 'Failed') throw new Error("Prompts Failed");

            // 5. QA (Station 6)
            const tQaStart = performance.now();
            updateProgress(5, "STATION 6: Quality Assurance...");
            const qaResult = await geminiService.runQualityAssurance(promptResult.result);
            console.log(`[TIMING] QA Check: ${((performance.now() - tQaStart) / 1000).toFixed(2)}s`);
            addLog(qaResult.log);
            updateStory({ finalPrompts: qaResult.result });
            if (qaResult.log.status === 'Failed') throw new Error("QA Failed");

            const finalPrompts = qaResult.result;
            const finalScript = scriptResult.result;
            const finalPlan = visualPlanResult.result.spreads;

            // --- PHASE 2: PRODUCTION (Images) ---

            // NEW LOGIC (Feb 2):
            // finalPrompts[0] is now the COVER.
            // finalPrompts[1..8] are the PAGES.

            // CRITICAL CHECK: ensure it's an array
            if (!Array.isArray(finalPrompts)) {
                console.error("Critical Error: finalPrompts is not an array", finalPrompts);
                throw new Error("Logic Error: Prompts list missing or corrupted.");
            }

            const dynamicCoverPrompt = finalPrompts[0];
            const pagePrompts = finalPrompts.slice(1);
            const pagePlans = finalPlan.slice(1); // Assuming finalPlan also has Cover at index 0 now

            // 6. Spreads Loop (Pages 1-N)
            const pages: Page[] = [];
            const remainingWeight = 40;
            const weightPerSpread = remainingWeight / pagePrompts.length;

            for (let i = 0; i < pagePrompts.length; i++) {
                const tSpreadStart = performance.now();
                updateProgress(weightPerSpread, `PRODUCTION: Painting Spread ${i + 1}/${pagePrompts.length}...`);
                const prompt = pagePrompts[i];
                const plan = pagePlans[i];

                // VisualPlan prompt now fully contains composition rules.
                const imageSide = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                const textSide = imageSide === 'left' ? 'right' : 'left';

                const imgRes = await geminiService.generateMethod4Image(
                    prompt,
                    storyData.selectedStylePrompt,
                    masterDNA,
                    storyData.mainCharacter.description,
                    storyData.childAge
                );
                console.log(`[TIMING] Illustration Spread ${i + 1}: ${((performance.now() - tSpreadStart) / 1000).toFixed(2)}s`);

                const txt = finalScript[i].text.replace(/{name}/g, storyData.childName);

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

                // Progressive update for UI preview
                updateStory({ pages: [...pages] });
            }

            // 7. Cover Generation (LAST) using valid index 0 prompt
            const tCoverStart = performance.now();
            updateProgress(10, "PRODUCTION: Painting Cover (Final Step)...");

            const coverRes = await geminiService.generateMethod4Image(
                dynamicCoverPrompt,
                storyData.selectedStylePrompt,
                masterDNA,
                storyData.mainCharacter.description,
                storyData.childAge
            );
            console.log(`[TIMING] Illustration Cover: ${((performance.now() - tCoverStart) / 1000).toFixed(2)}s`);

            updateStory({
                coverImageUrl: coverRes.imageBase64,
                actualCoverPrompt: coverRes.fullPrompt,
                title: blueprintResult.result.foundation.title
            });

            updateProgress(100, "Done!");
            setIsGenerating(false);
            onComplete();

        } catch (err: any) {
            console.error("Workflow Failed:", err);
            setError(err.message || "Unknown error");
            // Log the failure
            addLog({
                stage: 'Drafting', // Fallback type
                timestamp: Date.now(),
                inputs: {},
                outputs: { error: err.message },
                status: 'Failed',
                durationMs: 0
            });
            setGenerationStatus("Critical Failure. Check Logs.");
            setIsGenerating(false);
            // onError(); 
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
