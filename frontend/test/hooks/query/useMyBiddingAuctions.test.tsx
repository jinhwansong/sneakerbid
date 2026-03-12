import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMyBiddingAuctions } from '@/hooks/query/useMyBiddingAuctions';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      getMyBidding: vi.fn(),
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

describe('useMyBiddingAuctions', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.getMyBidding).mockReset();
  });

  it('내 입찰 경매 목록을 조회한다', async () => {
    const items = [
      {
        auctionId: 'a1',
        sneakerName: 'Nike',
        brand: 'Nike',
        imageUrl: '',
        size: '270',
        currentPrice: 100000,
        endTime: '',
        status: 'OPEN' as const,
      },
    ];
    vi.mocked(api.auctions.getMyBidding).mockResolvedValue(items);

    const { result } = renderHook(() => useMyBiddingAuctions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(api.auctions.getMyBidding).toHaveBeenCalledWith('ongoing');
  });

  it('status 옵션을 전달한다', async () => {
    vi.mocked(api.auctions.getMyBidding).mockResolvedValue([]);

    renderHook(() => useMyBiddingAuctions({ status: 'closed' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.auctions.getMyBidding).toHaveBeenCalledWith('closed');
    });
  });
});
