import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useWishlistToggle } from '@/hooks/query/useMyWishlist';
import { queryKeys } from '@/hooks/query/queryKeys';
import type { GetMainAuctionsResponse } from '@/types/auction';

vi.mock('@/lib/api', () => ({
  api: {
    wishlist: {
      toggle: vi.fn(),
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

describe('useWishlistToggle', () => {
  beforeEach(() => {
    vi.mocked(api.wishlist.toggle).mockReset();
  });

  it('토글 성공 시 캐시를 갱신한다', async () => {
    vi.mocked(api.wishlist.toggle).mockResolvedValue({
      isWishlisted: true,
    });

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
          isWishlisted: false,
        },
      ],
    };
    queryClient.setQueryData(queryKeys.auctions.main, initial);

    const { result } = renderHook(() => useWishlistToggle(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate('a1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.wishlist.toggle).toHaveBeenCalledWith('a1');
    const updated = queryClient.getQueryData<GetMainAuctionsResponse>(
      queryKeys.auctions.main
    );
    expect(updated?.ongoing[0].isWishlisted).toBe(true);
  });

  it('토글 실패 시 롤백한다', async () => {
    vi.mocked(api.wishlist.toggle).mockRejectedValue(new Error('fail'));

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
          isWishlisted: false,
        },
      ],
    };
    queryClient.setQueryData(queryKeys.auctions.main, initial);

    const { result } = renderHook(() => useWishlistToggle(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate('a1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const after = queryClient.getQueryData<GetMainAuctionsResponse>(
      queryKeys.auctions.main
    );
    expect(after?.ongoing[0].isWishlisted).toBe(false);
  });
});
