import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootErrorBoundary from '@/components/common/RootErrorBoundary';

const ThrowError = () => {
  throw new Error('test error');
};

describe('RootErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('에러 없으면 children을 렌더링한다', () => {
    render(
      <RootErrorBoundary>
        <div>children</div>
      </RootErrorBoundary>
    );
    expect(screen.getByText('children')).toBeInTheDocument();
  });

  it('자식에서 에러 발생 시 폴백 UI를 표시한다', () => {
    render(
      <RootErrorBoundary>
        <ThrowError />
      </RootErrorBoundary>
    );
    expect(screen.getByText(/문제가 발생했어요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/');
  });
});
