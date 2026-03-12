import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMainCacheUpdater } from '@/hooks/query/useMainAuctions';
import { queryKeys } from '@/hooks/query/queryKeys';
import type { GetMainAuctionsResponse } from '@/types/auction';

describe('useMainCacheUpdater', () => {
  it('updateBid 호출 시 메인 캐시가 갱신된다', () => {
    const queryClient = new QueryClient();
    const initial: GetMainAuctionsResponse = {
      ongoing: [
        {
          auctionId: 'a1',
          sneakerName: 'Nike',
          brand: 'Nike',
          imageUrl: '',
          size: '270',
          currentPrice: 100000,
          endTime: '',
          status: 'OPEN',
          bidCount: 3,
        },
      ],
    };
    queryClient.setQueryData(queryKeys.auctions.main, initial);

    const { result } = renderHook(() => useMainCacheUpdater(), {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
      },
    });

    result.current.updateBid('a1', 120000, 1);

    const updated = queryClient.getQueryData<GetMainAuctionsResponse>(
      queryKeys.auctions.main
    );
    expect(updated?.ongoing[0].currentPrice).toBe(120000);
    expect(updated?.ongoing[0].bidCount).toBe(4);
  });

  it('invalidate 호출 시 메인 캐시가 무효화된다', () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMainCacheUpdater(), {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
      },
    });

    result.current.invalidate();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.auctions.main,
    });
  });
});
