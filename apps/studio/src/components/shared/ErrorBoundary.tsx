'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureError } from '@/lib/monitoring';
import { Button } from './Button';
import { Card } from './Card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  boundaryName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, boundaryName } = this.props;

    // Log to monitoring service
    captureError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: boundaryName || 'UnnamedBoundary',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, boundaryName } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {boundaryName ? `Error in ${boundaryName}` : 'An unexpected error occurred'}
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Error Message:
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                      {error.message}
                    </p>
                  </div>
                  {error.stack && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Stack Trace:
                      </p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40 font-mono">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40 font-mono">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="min-w-[120px]"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="primary"
                  className="min-w-[120px]"
                >
                  Reload Page
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If this problem persists, please contact support or check the console for more details.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap any component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryName?: string,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary boundaryName={boundaryName} fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

// Made with Moe Abdelaziz
