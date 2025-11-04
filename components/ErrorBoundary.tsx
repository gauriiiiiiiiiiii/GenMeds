// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render = () => {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md border border-red-200">
            <h1 className="text-2xl font-bold text-red-600">Oops! Something went wrong.</h1>
            <p className="mt-2 text-slate-600">
              We've encountered an unexpected issue. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 bg-cyan-500 text-white font-bold py-2 px-6 rounded-full hover:bg-cyan-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    // FIX: The error indicates `this.props` is not recognized. While standard in class components, an arrow function for render() ensures `this` is lexically bound, which can resolve subtle type issues.
    return this.props.children;
  }
}

export default ErrorBoundary;
