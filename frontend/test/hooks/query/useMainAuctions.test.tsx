import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMainAuctions, mainAuctionsToItems } from '@/hooks/query/useMainAuctions';
import type { GetMainAuctionsResponse } from '@/types/auction';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      getMain: vi.fn(),
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

describe('useMainAuctions', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.getMain).mockReset();
  });

  it('API 응답을 반환한다', async () => {
    const data: GetMainAuctionsResponse = {
      ongoing: [
        {
          auctionId: 'a1',
          sneakerName: 'Nike Dunk',
          brand: 'Nike',
          imageUrl: '',
          size: '270',
          currentPrice: 100000,
          endTime: '',
          status: 'OPEN',
        },
      ],
    };
    vi.mocked(api.auctions.getMain).mockResolvedValue(data);

    const { result } = renderHook(() => useMainAuctions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(data);
    expect(result.current.data?.ongoing).toHaveLength(1);
  });

  it('initialData가 있으면 즉시 반환한다', () => {
    const initial: GetMainAuctionsResponse = {
      ongoing: [
        {
          auctionId: 'a1',
          sneakerName: 'Nike',
          brand: 'Nike',
          imageUrl: '',
          size: '270',
          currentPrice: 50000,
          endTime: '',
          status: 'OPEN',
        },
      ],
    };

    const { result } = renderHook(() => useMainAuctions(initial), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(initial);
    expect(result.current.isSuccess).toBe(true);
  });
});

describe('mainAuctionsToItems', () => {
  it('GetMainAuctionsResponse를 AuctionItem[]로 변환한다', () => {
    const data: GetMainAuctionsResponse = {
      ongoing: [
        {
          auctionId: 'a1',
          sneakerName: 'Nike Dunk',
          brand: 'Nike',
          imageUrl: 'https://img.png',
          size: '270',
          currentPrice: 100000,
          endTime: '2024-12-31',
          status: 'OPEN',
          bidCount: 5,
        },
      ],
    };
    const items = mainAuctionsToItems(data);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('a1');
    expect(items[0].modelName).toBe('Nike Dunk');
    expect(items[0].currentBid).toBe(100000);
    expect(items[0].participants).toBe(5);
  });

  it('undefined면 빈 배열을 반환한다', () => {
    expect(mainAuctionsToItems(undefined)).toEqual([]);
  });
});
