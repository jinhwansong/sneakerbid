import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDeleteAuction } from '@/hooks/query/useDeleteAuction';
import { queryKeys } from '@/hooks/query/queryKeys';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      delete: vi.fn(),
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

describe('useDeleteAuction', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.delete).mockReset();
  });

  it('삭제 성공 시 API를 호출하고 mySelling 캐시를 무효화한다', async () => {
    vi.mocked(api.auctions.delete).mockResolvedValue({ message: 'ok' });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteAuction(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate('auction-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.auctions.delete).toHaveBeenCalledWith('auction-1');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.auctions.mySellingPrefix,
    });
  });
});
