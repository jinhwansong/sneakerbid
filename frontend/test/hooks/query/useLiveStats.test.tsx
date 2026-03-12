import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useLiveStats } from '@/hooks/query/useLiveStats';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      getStats: vi.fn(),
    },
  },
}));

const { api } = await import('@/lib/api');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useLiveStats', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.getStats).mockReset();
  });

  it('API 응답을 반환한다', async () => {
    const stats = {
      activeBidders: 10,
      activeAuctions: 5,
      volume24h: 1000000,
      avgBidSpeedSeconds: 30,
    };
    vi.mocked(api.auctions.getStats).mockResolvedValue(stats);

    const { result } = renderHook(() => useLiveStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(stats);
  });

  it('initialData가 있으면 즉시 반환한다', () => {
    const initial = {
      activeBidders: 5,
      activeAuctions: 3,
      volume24h: 500000,
      avgBidSpeedSeconds: 45,
    };

    const { result } = renderHook(() => useLiveStats(initial), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(initial);
  });
});
