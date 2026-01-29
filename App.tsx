import React from 'react';
import { StoryProvider } from './context/StoryContext';
import { WorkflowProvider } from './context/WorkflowContext';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <StoryProvider>
                <WorkflowProvider>
                    <MainLayout />
                </WorkflowProvider>
            </StoryProvider>
        </ErrorBoundary>
    );
};

export default App;