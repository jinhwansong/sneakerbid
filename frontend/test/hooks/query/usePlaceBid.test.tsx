import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { usePlaceBid } from '@/hooks/query/useMainAuctions';
import { queryKeys } from '@/hooks/query/queryKeys';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      placeBid: vi.fn(),
    },
  },
}));

const { api } = await import('@/lib/api');

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('usePlaceBid', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.placeBid).mockReset();
  });

  it('입찰 성공 시 캐시를 갱신하고 관련 쿼리를 무효화한다', async () => {
    vi.mocked(api.auctions.placeBid).mockResolvedValue({
      bidId: 'b1',
      currentPrice: 120000,
    });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePlaceBid(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ auctionId: 'a1', amount: 120000 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.auctions.placeBid).toHaveBeenCalledWith('a1', 120000);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me'] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['auctions', 'myBidding'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.auctions.detail('a1'),
    });
  });
});
