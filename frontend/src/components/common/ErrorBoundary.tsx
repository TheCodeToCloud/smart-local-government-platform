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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center animate-fade-in">
            <div className="text-8xl mb-6">⚠️</div>
            <h1 className="text-4xl font-extrabold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-400 mb-2 text-lg">
              An unexpected error occurred in the application. We apologize for the inconvenience.
            </p>
            {import.meta.env.DEV && this.state.errorMessage && (
              <p className="text-xs text-red-400/70 font-mono bg-slate-900 border border-red-500/20 rounded-xl p-3 mb-6 text-left break-all">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <button
                onClick={this.handleReset}
                className="btn-primary py-3 px-8"
              >
                🏠 Return to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-outline py-3 px-8"
              >
                🔄 Try Again
              </button>
            </div>
            <p className="text-slate-600 text-xs mt-8">
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
