import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMyWishlist } from '@/hooks/query/useMyWishlist';

vi.mock('@/lib/api', () => ({
  api: {
    wishlist: {
      getMy: vi.fn(),
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

describe('useMyWishlist', () => {
  beforeEach(() => {
    vi.mocked(api.wishlist.getMy).mockReset();
  });

  it('위시리스트를 조회한다', async () => {
    const items = [
      {
        id: 'w1',
        auctionId: 'a1',
        sneakerName: 'Nike Dunk',
        brand: 'Nike',
        imageUrl: '',
        size: '270',
        currentPrice: 100000,
        endTime: '2024-12-31',
        status: 'OPEN' as const,
        bidCount: 5,
        buyNowPrice: null,
      },
    ];
    vi.mocked(api.wishlist.getMy).mockResolvedValue(items);

    const { result } = renderHook(() => useMyWishlist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('a1');
    expect(result.current.data?.[0].modelName).toBe('Nike Dunk');
    expect(result.current.data?.[0].isWishlisted).toBe(true);
  });

  it('enabled가 false면 요청하지 않는다', () => {
    renderHook(() => useMyWishlist({ enabled: false }), {
      wrapper: createWrapper(),
    });
    expect(api.wishlist.getMy).not.toHaveBeenCalled();
  });
});
