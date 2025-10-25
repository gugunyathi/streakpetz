'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleError, getUserFriendlyMessage } from '@/lib/error-handler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    const appError = handleError(error, 'ErrorBoundary');
    console.error('ErrorBoundary caught an error:', {
      error: appError,
      errorInfo,
      errorId: this.state.errorId
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-4">
          <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-6">😵</div>
            <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
            <p className="text-white/80 mb-6">
              {this.state.error 
                ? getUserFriendlyMessage(handleError(this.state.error, 'ErrorBoundary'))
                : 'An unexpected error occurred. Please try refreshing the page.'
              }
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-400 hover:to-blue-400 transition-all duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white/10 text-white py-3 px-6 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Refresh Page
              </button>
            </div>
            {this.state.errorId && (
              <p className="text-white/40 text-xs mt-4">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const handleAsyncError = (error: Error | unknown, context?: string) => {
    const appError = handleError(error, context);
    console.error('Async error handled:', appError);
    
    // In a real app, you might want to send this to an error reporting service
    // reportError(appError);
    
    return appError;
  };

  return { handleAsyncError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}