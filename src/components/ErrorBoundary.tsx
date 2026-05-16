import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-rose-500/20 bg-slate-950/95 p-6 text-slate-100 shadow-2xl shadow-rose-500/20">
          <h2 className="text-lg font-semibold text-white mb-3">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            The section failed to load, but the rest of the app is still available.
          </p>
          <pre className="max-h-40 overflow-y-auto rounded-2xl bg-slate-900 p-3 text-[11px] text-slate-300">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-400 transition"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
