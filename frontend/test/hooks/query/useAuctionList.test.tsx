import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useAuctionList,
  auctionListPagesToItems,
} from '@/hooks/query/useAuctionList';
import type { GetAuctionListResponse } from '@/types/auction';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      getList: vi.fn(),
    },
  },
}));

const { api } = await import('@/lib/api');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useAuctionList', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.getList).mockReset();
  });

  it('API 응답을 반환한다', async () => {
    const page1: GetAuctionListResponse = {
      items: [
        {
          auctionId: 'a1',
          sneakerName: 'Nike',
          brand: 'Nike',
          imageUrl: '',
          size: '270',
          currentPrice: 100000,
          endTime: '',
          status: 'OPEN',
        },
      ],
      nextCursor: 'cursor-1',
      hasMore: true,
    };
    vi.mocked(api.auctions.getList).mockResolvedValue(page1);

    const { result } = renderHook(() => useAuctionList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].items).toHaveLength(1);
    expect(result.current.data?.pages[0].items[0].auctionId).toBe('a1');
  });

  it('params로 brand, size, sort를 전달한다', async () => {
    vi.mocked(api.auctions.getList).mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
    });

    renderHook(
      () =>
        useAuctionList({
          brand: 'Nike',
          size: 270,
          sort: 'ending_soon',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(api.auctions.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Nike',
          size: '270',
          sort: 'ending_soon',
        })
      );
    });
  });
});

describe('auctionListPagesToItems', () => {
  it('InfiniteData를 AuctionItem[]로 평탄화한다', () => {
    const data = {
      pages: [
        {
          items: [
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
          ],
          nextCursor: null,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    };
    const items = auctionListPagesToItems(data);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('a1');
  });

  it('undefined면 빈 배열을 반환한다', () => {
    expect(auctionListPagesToItems(undefined)).toEqual([]);
  });
});
