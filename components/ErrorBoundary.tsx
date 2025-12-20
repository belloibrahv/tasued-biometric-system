'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Enterprise-grade Error Boundary Component
 * Catches and handles React errors gracefully with user-friendly UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="glass-card p-8 text-center">
              <div className="w-20 h-20 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-error-500" size={40} />
              </div>

              <h1 className="text-3xl font-bold text-surface-950 mb-3">
                Oops! Something went wrong
              </h1>
              
              <p className="text-surface-600 mb-6 max-w-md mx-auto">
                We encountered an unexpected error. Don't worry, your data is safe. 
                Please try refreshing the page or return to the homepage.
              </p>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 text-left bg-surface-900 text-white p-4 rounded-xl overflow-auto max-h-60">
                  <p className="font-mono text-sm mb-2 text-error-400">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="font-mono text-xs text-surface-300 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="btn-outline flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={18} />
                  Try Again
                </button>
                
                <Link href="/" className="btn-primary flex items-center justify-center gap-2">
                  <Home size={18} />
                  Go to Homepage
                </Link>
              </div>
            </div>

            <p className="text-center text-sm text-surface-500 mt-6">
              If this problem persists, please contact support at{' '}
              <a href="mailto:support@tasued.edu.ng" className="text-brand-500 hover:underline">
                support@tasued.edu.ng
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for specific sections
 */
export function SectionErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="glass-card p-6 text-center">
          <AlertTriangle className="text-warning-500 mx-auto mb-3" size={32} />
          <p className="text-surface-700 font-medium mb-2">
            This section couldn't load
          </p>
          <p className="text-sm text-surface-500">
            Please refresh the page or try again later
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
