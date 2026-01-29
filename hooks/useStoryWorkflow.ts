import { useState, useCallback } from 'react';
import type { StoryData } from '../types';
import * as geminiService from '../services/geminiService';
import * as adminService from '../services/adminService';

export const useStoryWorkflow = (
    storyData: StoryData,
    updateStory: (updates: Partial<StoryData>) => void
) => {
    const [stage, setStage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [artifact, setArtifact] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const runStage = useCallback(async (currentStage: number) => {
        setIsLoading(true);
        setError(null);
        setArtifact(null);

        try {
            let result;
            switch (currentStage) {
                case 1:
                    const themes = adminService.getThemes();
                    const selectedTheme = themes.find(t => t.id === storyData.themeId);
                    result = await geminiService.runJuniorWriter(storyData, selectedTheme);
                    updateStory({ blueprint: result });
                    break;
                case 2:
                    if (!storyData.blueprint) throw new Error('Missing blueprint');
                    result = await geminiService.runSeniorWriter(storyData.blueprint);
                    updateStory({ blueprint: result });
                    break;
                case 3:
                    if (!storyData.blueprint) throw new Error('Missing blueprint');
                    result = await geminiService.runVisualDesigner(storyData.blueprint);
                    updateStory({ spreadPlan: result });
                    break;
                case 4:
                    if (!storyData.blueprint || !storyData.spreadPlan) throw new Error('Missing prerequisites');
                    result = await geminiService.runCreativeDirector(storyData.blueprint, storyData.spreadPlan);
                    updateStory({ spreadPlan: result });
                    break;
                case 5:
                    if (!storyData.spreadPlan || !storyData.blueprint) throw new Error('Missing prerequisites');
                    result = await geminiService.runPromptEngineer(
                        storyData.spreadPlan,
                        storyData.technicalStyleGuide || '',
                        storyData.selectedStylePrompt,
                        storyData.blueprint
                    );
                    updateStory({ finalPrompts: result });
                    break;
                case 6:
                    if (!storyData.finalPrompts) throw new Error('Missing prompts');
                    result = await geminiService.runPromptReviewer(storyData.finalPrompts);
                    updateStory({ finalPrompts: result });
                    break;
                default:
                    throw new Error('Invalid stage');
            }
            setArtifact(result);
        } catch (err: any) {
            console.error("Workflow Error:", err);
            setError(err.message || 'An error occurred during generation.');
        } finally {
            setIsLoading(false);
        }
    }, [storyData, updateStory]);

    const startWorkflow = useCallback(() => {
        setStage(1);
        runStage(1);
    }, [runStage]);

    const nextStage = useCallback(() => {
        const next = stage + 1;
        if (next <= 6) {
            setStage(next);
            runStage(next);
        }
    }, [stage, runStage]);

    const prevStage = useCallback(() => {
        const prev = stage - 1;
        if (prev >= 1) {
            setStage(prev);
            // Optionally re-run or just rely on cached state? 
            // The original app re-ran it. Let's keep re-running for now to be safe/consistent.
            runStage(prev);
        }
    }, [stage, runStage]);

    const retryStage = useCallback(() => {
        runStage(stage);
    }, [stage, runStage]);

    return {
        stage,
        isLoading,
        artifact,
        error,
        startWorkflow,
        nextStage,
        prevStage,
        retryStage
    };
};
