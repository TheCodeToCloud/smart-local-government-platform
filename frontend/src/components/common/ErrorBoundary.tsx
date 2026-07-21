import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a production app, you would log to a service like Sentry here.
    console.error('Uncaught render error:', error, errorInfo.componentStack);
  }

  public handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="bg-white p-8 rounded-3xl max-w-lg w-full text-center border border-red-200 shadow-sm animate-fade-in">
            <div className="text-8xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-6">
              {this.state.errorMessage || 'An unexpected error occurred.'}
            </p>
            {import.meta.env.DEV && this.state.errorMessage && (
              <p className="text-xs text-red-600 font-mono bg-red-50 border border-red-100 rounded-xl p-3 mb-6 text-left break-all">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary py-2 px-6 shadow-sm"
              >
                🔄 Reload Page
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-8">
              If this problem persists, please contact the platform administrator.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
