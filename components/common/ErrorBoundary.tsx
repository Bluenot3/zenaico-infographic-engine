import * as React from "react";
import { Icon } from "./Icon";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    const props = (this as any).props;

    if (state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center space-y-6 border-red-500/20">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Icon name="close" className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-slate-400 text-sm">
              We encountered an unexpected error. Please try refreshing the page or check your connection.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              Refresh Application
            </button>
            {state.error && (
              <details className="text-left bg-black/20 p-4 rounded-lg">
                <summary className="text-xs text-slate-500 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-[10px] text-red-400 overflow-auto max-h-32">
                  {state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return props.children;
  }
}
