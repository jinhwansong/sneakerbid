import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MeResponse } from '@/types/auth';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';
import { getMeCache, setMeCache, clearMeCache } from '@/lib/meCache';

export const AUTH_LOGGED_OUT_KEY = 'auth_logged_out';

export interface UseMeOptions {
  enabled?: boolean;
}

export function useMe(options?: UseMeOptions) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const explicitEnabled = options?.enabled ?? true;

  // 렌더 중 sessionStorage 읽지 않음 → 하이드레이션 오류 방지
  // 마운트 후 useEffect에서만 읽음
  const [clientState, setClientState] = useState<{
    cached: MeResponse | null;
    isLoggedOut: boolean;
  } | null>(null);

  useEffect(() => {
    if (pathname === '/login') {
      sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
    }
    const cached = getMeCache();
    const isLoggedOut = sessionStorage.getItem(AUTH_LOGGED_OUT_KEY) === '1';
    if (cached) {
      queryClient.setQueryData(queryKeys.me, cached);
    }
    queueMicrotask(() => setClientState({ cached, isLoggedOut }));
  }, [pathname, queryClient]);

  const cached = clientState?.cached ?? null;
  const isLoggedOut = clientState?.isLoggedOut ?? false;
  // clientState 확인 전에는 fetch 안 함 (캐시 있을 수 있음)
  const enabled =
    clientState !== null && explicitEnabled && !isLoggedOut && !cached;

  return useQuery(
    withQueryDefaults<MeResponse | null>({
      queryKey: queryKeys.me,
      queryFn: async () => {
        try {
          const data = await api.users.getMe();
          sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
          setMeCache(data);
          return data;
        } catch {
          sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, '1');
          clearMeCache();
          return null;
        }
      },
      retry: false,
      enabled,
    }),
  );
}
