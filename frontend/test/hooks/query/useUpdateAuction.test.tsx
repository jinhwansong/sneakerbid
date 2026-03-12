import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useUpdateAuction } from '@/hooks/query/useUpdateAuction';

vi.mock('@/lib/api', () => ({
  api: {
    auctions: {
      update: vi.fn(),
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

describe('useUpdateAuction', () => {
  beforeEach(() => {
    vi.mocked(api.auctions.update).mockReset();
  });

  it('수정 성공 시 API를 호출하고 detail, mySelling 캐시를 무효화한다', async () => {
    vi.mocked(api.auctions.update).mockResolvedValue({ id: 'a1' });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateAuction(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      id: 'a1',
      dto: { name: 'Updated' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.auctions.update).toHaveBeenCalledWith('a1', {
      name: 'Updated',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['auctions', 'detail', 'a1'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['auctions', 'mySelling', undefined],
    });
  });
});
