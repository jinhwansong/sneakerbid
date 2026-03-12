import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMyAuctions } from '@/hooks/query/useMyAuctions';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      getMySelling: vi.fn(),
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

describe('useMyAuctions', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.getMySelling).mockReset();
  });

  it('내 경매 목록을 조회한다', async () => {
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
    vi.mocked(api.auctions.getMySelling).mockResolvedValue(items);

    const { result } = renderHook(() => useMyAuctions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('a1');
    expect(api.auctions.getMySelling).toHaveBeenCalledWith('all');
  });

  it('status 옵션으로 필터링한다', async () => {
    vi.mocked(api.auctions.getMySelling).mockResolvedValue([]);

    renderHook(() => useMyAuctions({ status: 'ongoing' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.auctions.getMySelling).toHaveBeenCalledWith('ongoing');
    });
  });
});
