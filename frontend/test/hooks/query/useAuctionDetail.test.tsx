import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useAuctionDetail,
  useAuctionClosedCacheInvalidation,
} from '@/hooks/query/useAuctionDetail';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      get: vi.fn(),
      getBids: vi.fn(),
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

describe('useAuctionDetail', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.get).mockReset();
    vi.mocked(api.auctions.getBids).mockReset();
  });

  it('auctionId로 상세 데이터를 조회한다', async () => {
    const auction = {
      id: 'a1',
      modelName: 'Nike Dunk',
      brand: 'Nike',
      imageUrl: '',
      currentBid: 100000,
      endTime: '',
      participants: 5,
      status: 'ongoing' as const,
    };
    const bids = [
      { id: 'b1', user: 'u1', amount: 100000, time: '방금 전' },
    ];
    vi.mocked(api.auctions.get).mockResolvedValue(auction);
    vi.mocked(api.auctions.getBids).mockResolvedValue(bids);

    const { result } = renderHook(() => useAuctionDetail('a1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.auction.id).toBe('a1');
    expect(result.current.data?.bids).toHaveLength(1);
    expect(api.auctions.get).toHaveBeenCalledWith('a1');
    expect(api.auctions.getBids).toHaveBeenCalledWith('a1');
  });

  it('enabled가 false면 요청하지 않는다', () => {
    renderHook(() => useAuctionDetail('a1', { enabled: false }), {
      wrapper: createWrapper(),
    });
    expect(api.auctions.get).not.toHaveBeenCalled();
  });

  it('auctionId가 빈 문자열이면 enabled가 false이다', () => {
    renderHook(() => useAuctionDetail(''), {
      wrapper: createWrapper(),
    });
    expect(api.auctions.get).not.toHaveBeenCalled();
  });
});

describe('useAuctionClosedCacheInvalidation', () => {
  it('invalidate 콜백이 me, orders.my, myBidding을 무효화한다', () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAuctionClosedCacheInvalidation(), {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
      },
    });

    result.current();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me'] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['orders', 'my'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['auctions', 'myBidding'],
    });
  });
});
