import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useCreateAuction } from '@/hooks/query/useCreateAuction';
import { queryKeys } from '@/hooks/query/queryKeys';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      create: vi.fn(),
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

describe('useCreateAuction', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.create).mockReset();
  });

  it('등록 성공 시 API를 호출하고 mySelling 캐시를 무효화한다', async () => {
    vi.mocked(api.auctions.create).mockResolvedValue({
      id: 'a1',
      sneakerId: 's1',
      sellerUserId: 'u1',
      startPrice: 100000,
      currentPrice: 100000,
      buyNowPrice: 150000,
      minimumIncrement: 5000,
      status: 'OPEN',
      endTime: '2025-12-31',
      createdAt: '',
      updatedAt: '',
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateAuction(), {
      wrapper: createWrapper(queryClient),
    });

    const dto = {
      modelName: 'Dunk',
      brand: 'Nike',
      color: 'White',
      description: 'Test description',
      imageUrl: 'https://example.com/img.jpg',
      size: '260',
      startPrice: 100000,
      buyNowPrice: 150000,
      minimumIncrement: 1000,
      endTime: '2025-12-31',
    };

    act(() => {
      result.current.mutate(dto);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.auctions.create).toHaveBeenCalledWith(dto);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.auctions.mySellingPrefix,
    });
  });
});
