import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import GlobalLoadingIndicator from '@/components/common/GlobalLoadingIndicator';

function createWrapper() {
  const queryClient = new QueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('GlobalLoadingIndicator', () => {
  it('fetch 중이 아니면 null을 반환한다', () => {
    const { container } = render(<GlobalLoadingIndicator />, {
      wrapper: createWrapper(),
    });
    expect(container.firstChild).toBeNull();
  });

  it('fetch 중이면 로딩 바를 표시한다', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    queryClient.fetchQuery({ queryKey: ['test'], queryFn: () => new Promise(() => {}) });

    const { container } = render(<GlobalLoadingIndicator />, {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
      },
    });

    expect(container.querySelector('.global-loading-bar')).toBeInTheDocument();
  });
});
