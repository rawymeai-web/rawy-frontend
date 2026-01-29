import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public readonly props: Props;

    public state: State = {
        hasError: false,
        error: null
    };

    constructor(props: Props) {
        super(props);
        this.props = props;
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public handleReload = () => {
        window.location.reload();
    };

    public handleReset = () => {
        localStorage.removeItem('storyData');
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-center">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 border border-gray-200">
                        <div className="mb-4 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
                        <p className="text-gray-600 mb-6">
                            The application encountered an unexpected error.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                                Reload Application
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="w-full py-2 px-4 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm"
                            >
                                Clear Data & Reset
                            </button>
                        </div>

                        {this.state.error && (
                            <div className="mt-8 p-4 bg-gray-100 rounded text-left overflow-auto max-h-32 text-xs text-gray-500 font-mono">
                                {this.state.error.toString()}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
