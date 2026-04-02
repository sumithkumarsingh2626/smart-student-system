// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';

export default class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = 'Something went wrong.';
      try {
        const parsed = JSON.parse(this.state.error?.message || '{}');
        if (parsed.error) {
          errorMessage = `Firestore Error: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold mb-4 text-red-500">Application Error</h1>
            <p className="text-zinc-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-100 text-zinc-950 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
