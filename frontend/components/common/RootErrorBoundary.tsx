'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('RootErrorBoundary:', error, errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-text-main">
          <p className="text-center text-lg">문제가 발생했어요</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:opacity-90"
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
