import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMe } from '@/hooks/query/useMe';

vi.mock('@/lib/api', () => ({
  api: {
    users: {
      getMe: vi.fn(),
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

describe('useMe', () => {
  beforeEach(() => {
    vi.mocked(api.users.getMe).mockReset();
  });

  it('API 응답을 반환한다', async () => {
    const me = {
      id: 'u1',
      nickname: 'test',
      profileImageUrl: null,
      role: 'USER',
      balance: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    vi.mocked(api.users.getMe).mockResolvedValue(me);

    const { result } = renderHook(() => useMe(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(me);
  });

  it('에러 시 null을 반환한다', async () => {
    vi.mocked(api.users.getMe).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useMe(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('enabled가 false면 요청하지 않는다', () => {
    renderHook(() => useMe({ enabled: false }), {
      wrapper: createWrapper(),
    });
    expect(api.users.getMe).not.toHaveBeenCalled();
  });
});
