import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useLogout } from '@/hooks/query/useLogout';
import { queryKeys } from '@/hooks/query/queryKeys';

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      logout: vi.fn(),
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

describe('useLogout', () => {
  beforeEach(() => {
    vi.mocked(api.auth.logout).mockReset();
  });

  it('logout API를 호출하고 me 캐시를 null로 설정한다', async () => {
    vi.mocked(api.auth.logout).mockResolvedValue({});

    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.me, { id: 'u1', nickname: 'test' });

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current();

    expect(api.auth.logout).toHaveBeenCalled();
    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
  });

  it('API 실패 시에도 me 캐시는 null로 설정한다', async () => {
    vi.mocked(api.auth.logout).mockRejectedValue(new Error('fail'));

    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.me, { id: 'u1' });

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current()).rejects.toThrow('fail');
    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
  });
});
