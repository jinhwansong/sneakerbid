import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useTradeHistory } from '@/hooks/query/useTradeHistory';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      getHistory: vi.fn(),
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

describe('useTradeHistory', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.getHistory).mockReset();
  });

  it('거래 내역을 조회한다', async () => {
    const data = {
      stats: { tradesToday: 5, averagePriceToday: 100000, maxPriceToday: 200000 },
      items: [],
    };
    vi.mocked(api.auctions.getHistory).mockResolvedValue(data);

    const { result } = renderHook(() => useTradeHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(data);
  });

  it('query 파라미터를 전달한다', async () => {
    vi.mocked(api.auctions.getHistory).mockResolvedValue({
      stats: { tradesToday: 0, averagePriceToday: null, maxPriceToday: null },
      items: [],
    });

    renderHook(() => useTradeHistory({ period: '1m', search: 'Nike' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.auctions.getHistory).toHaveBeenCalledWith({
        period: '1m',
        search: 'Nike',
      });
    });
  });
});
