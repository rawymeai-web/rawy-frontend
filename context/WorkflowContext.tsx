import React, { createContext, useContext, ReactNode } from 'react';
import { useStoryWorkflow } from '../hooks/useStoryWorkflow';
import { useStory } from './StoryContext';

interface WorkflowContextType {
    stage: number;
    isLoading: boolean;
    artifact: any;
    error: string | null;
    startWorkflow: () => void;
    nextStage: () => void;
    prevStage: () => void;
    retryStage: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // We need access to storyData to pass to the workflow hook
    const { storyData, updateStory } = useStory();

    // The hook manages the internal state machine
    const workflow = useStoryWorkflow(storyData, updateStory);

    return (
        <WorkflowContext.Provider value={workflow}>
            {children}
        </WorkflowContext.Provider>
    );
};

export const useWorkflow = () => {
    const context = useContext(WorkflowContext);
    if (!context) {
        throw new Error('useWorkflow must be used within a WorkflowProvider');
    }
    return context;
};
