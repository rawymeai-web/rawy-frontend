import { useState, useCallback } from 'react';
import type { StoryData } from '../types';

export const useStoryWorkflow = (
    storyData: StoryData,
    updateStory: (updates: Partial<StoryData>) => void
) => {
    const [stage, setStage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [artifact, setArtifact] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // LEGACY: This hook is now just a visual placeholder. 
    // The Real logic is in useStoryGeneration (V4 Engine).
    const runStage = useCallback(async (currentStage: number) => {
        setIsLoading(true);
        setError(null);
        setArtifact({ status: "skipped-legacy" });

        // Simulate brief delay for UI smoothness before passing to V4
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    const startWorkflow = useCallback(() => {
        setStage(1);
        runStage(1);
    }, [runStage]);

    const nextStage = useCallback(() => {
        const next = stage + 1;
        setStage(next);
        // We allow incrementing up to 6 to trigger the MainLayout useEffect
        if (next <= 6) {
            // Don't actually run anything, just update state
            setIsLoading(false);
        }
    }, [stage]);

    const prevStage = useCallback(() => {
        const prev = stage - 1;
        if (prev >= 1) setStage(prev);
    }, [stage]);

    const retryStage = useCallback(() => {
        // No-op
    }, []);

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
