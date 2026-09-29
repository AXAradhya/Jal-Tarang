import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[JAL TARANG ErrorBoundary]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {this.props.fallbackTitle || 'Module Render Interrupted'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              An unexpected display variance occurred while rendering live telemetry data.
            </p>
            {this.state.error && (
              <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded text-left text-[11px] font-mono text-red-600 dark:text-red-400 overflow-x-auto border border-slate-200 dark:border-slate-700">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Reload Module</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
