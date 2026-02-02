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
            updateProgress(5, "STATION 2: Architecting Story Blueprint...");
            const blueprintResult = await geminiService.generateBlueprint({
                childName: storyData.childName,
                childAge: parseInt(storyData.childAge) || 5,
                themeId: storyData.theme,
                themeTitle: themeObj.title.en,
                themeData: themeObj
            });
            addLog(blueprintResult.log);
            updateStory({ blueprint: blueprintResult.result });
            if (blueprintResult.log.status === 'Failed') throw new Error("Blueprint Failed");


            // 2. DRAFTING (Station 3)
            updateProgress(10, "STATION 3: Drafting Narrative...");
            const scriptResult = await geminiService.generateScript(
                blueprintResult.result,
                language,
                parseInt(storyData.childAge) || 5
            );
            addLog(scriptResult.log);
            if (scriptResult.log.status === 'Failed') throw new Error("Drafting Failed");

            // 3. VISUAL PLAN (Station 4)
            updateProgress(10, "STATION 4: Designing Visuals...");
            const visualDNA = `Style: ${storyData.selectedStylePrompt}. Theme: ${themeObj.visualDNA}`;
            const visualPlanResult = await geminiService.generateVisualPlan(
                scriptResult.result,
                blueprintResult.result,
                visualDNA
            );
            addLog(visualPlanResult.log);
            updateStory({ spreadPlan: visualPlanResult.result });
            if (visualPlanResult.log.status === 'Failed') throw new Error("Visual Plan Failed");

            // 4. PROMPTS (Station 5)
            updateProgress(10, "STATION 5: Engineering Prompts...");
            const promptResult = await geminiService.generatePrompts(
                visualPlanResult.result,
                visualDNA,
                storyData.childAge,
                storyData.mainCharacter.description
            );
            addLog(promptResult.log);
            if (promptResult.log.status === 'Failed') throw new Error("Prompts Failed");

            // 5. QA (Station 6)
            updateProgress(5, "STATION 6: Quality Assurance...");
            const qaResult = await geminiService.runQualityAssurance(promptResult.result);
            addLog(qaResult.log);
            updateStory({ finalPrompts: qaResult.result });
            if (qaResult.log.status === 'Failed') throw new Error("QA Failed");

            const finalPrompts = qaResult.result;
            const finalScript = scriptResult.result;
            const finalPlan = visualPlanResult.result.spreads;

            // --- PHASE 2: PRODUCTION (Images) ---

            // 6. Spreads Loop
            const pages: Page[] = [];
            const remainingWeight = 40; // 40% for spreads
            const weightPerSpread = remainingWeight / finalPrompts.length;

            for (let i = 0; i < finalPrompts.length; i++) {
                updateProgress(weightPerSpread, `PRODUCTION: Painting Spread ${i + 1}/${finalPrompts.length}...`);
                const prompt = finalPrompts[i];
                const plan = finalPlan[i];

                // VisualPlan prompt now fully contains composition rules.
                // We just need to determine text side for the UI.
                const imageSide = plan?.mainContentSide?.toLowerCase().includes('left') ? 'left' : 'right';
                const textSide = imageSide === 'left' ? 'right' : 'left';

                const imgRes = await geminiService.generateMethod4Image(
                    prompt, // Pass the Super Prompt directly
                    storyData.selectedStylePrompt,
                    masterDNA,
                    storyData.mainCharacter.description,
                    storyData.childAge
                );

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

            // 7. Cover Generation (LAST)
            updateProgress(10, "PRODUCTION: Painting Cover (Final Step)...");
            const isAr = language === 'ar';
            const frontSide = isAr ? 'left' : 'right'; // Correct visual logic
            const backSide = isAr ? 'right' : 'left';

            const coverPrompt = `Prompt for Cover:
**GOAL:** Generate a 16:9 panoramic illustration matching the internal style with **high-impact commercial appeal**.

**REFERENCE INPUTS:**
- **Character Photo:** Included via DNA.
- **Style:** ${visualDNA}

**STRICT CHARACTER LOCK:**
- Render the child with exact facial topology and hair pattern from the reference photo.
- **Outfit:** Hero Outfit (Special/Magical if applicable).
- Description: ${storyData.mainCharacter.description}

**COMPOSITION RULES:**
- 16:9 Full Bleed.
- **${frontSide.toUpperCase()} SIDE (FRONT COVER):** Focus on the Child / Hero. Clear, happy, engaging.
- **${backSide.toUpperCase()} SIDE (BACK COVER):** Scenery, landscape, or secondary characters. Minimal detail.
- **NEGATIVE SPACE:** DO NOT add any text. Leave clean areas for the title overlay.
- Camera: Eye-level or Low-angle (Heroic).

**SCENE DESCRIPTION:**
- Setting: ${blueprintResult.result.foundation.masterSetting} (The core world of the book).
- Action: The hero standing confidently or exploring, inviting the reader in.

**EMOTIONAL & DESIGN NOTES:**
- Mood: Magical, Inviting, Wonder.
- Palette: Rich, saturated colors.

**MANDATORY OUTPUT RULES:**
- No text, no watermarks.
- No split screen line — continuous art.`;

            const coverRes = await geminiService.generateMethod4Image(
                coverPrompt,
                storyData.selectedStylePrompt,
                masterDNA,
                storyData.mainCharacter.description,
                storyData.childAge
            );

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
