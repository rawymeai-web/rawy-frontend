import React from 'react';
import { StoryProvider } from './context/StoryContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <StoryProvider>
                <CartProvider>
                    <WorkflowProvider>
                        <MainLayout />
                    </WorkflowProvider>
                </CartProvider>
            </StoryProvider>
        </ErrorBoundary>
    );
};

export default App;