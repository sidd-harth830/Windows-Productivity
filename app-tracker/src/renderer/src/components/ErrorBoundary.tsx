import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from './Icons';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can log the error to an error reporting service here
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] p-6 relative overflow-hidden font-sans">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-500 rounded-full mix-blend-screen filter blur-[200px] opacity-[0.12] pointer-events-none"></div>
                    
                    <div className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-red-500/30 p-8 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col items-center text-center z-10 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mb-6 border border-red-500/20 shadow-inner">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black mb-2 text-[var(--text)] tracking-tight">Something went wrong</h1>
                        <p className="text-[var(--text)] opacity-60 text-sm mb-6 font-medium">
                            The application encountered an unexpected error.
                        </p>
                        
                        <div className="bg-[var(--bg)] w-full p-4 rounded-xl border border-[var(--panel-border)] text-left overflow-auto max-h-40 mb-8 shadow-inner custom-scrollbar">
                            <code className="text-xs text-red-400 font-mono whitespace-pre-wrap font-bold">
                                {this.state.error?.toString()}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-500 hover:brightness-125 text-white px-6 py-3 rounded-xl text-sm font-black tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            RELOAD APPLICATION
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;