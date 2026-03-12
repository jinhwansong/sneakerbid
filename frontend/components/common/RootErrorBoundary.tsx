'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import Link from 'next/link';

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
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-text-main">
          <p className="text-center text-lg font-medium">문제가 발생했어요</p>
          <p className="text-center text-sm text-text-muted">
            일시적인 오류일 수 있습니다. 새로고침하거나 홈으로 이동해 주세요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-text-inverse hover:opacity-90 transition-opacity"
            >
              새로고침
            </button>
            <Link
              href="/"
              className="rounded-xl border border-border-main px-5 py-2.5 text-sm font-bold text-text-main hover:bg-bg-sub transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
