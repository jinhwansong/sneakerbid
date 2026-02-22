import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MeResponse } from '@/types/auth';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export const AUTH_LOGGED_OUT_KEY = 'auth_logged_out';

export interface UseMeOptions {
  enabled?: boolean;
}

export function useMe(options?: UseMeOptions) {
  const pathname = usePathname();
  const explicitEnabled = options?.enabled ?? true;

  // 로그인 페이지 방문 시 플래그 초기화 (OAuth 복귀 후 getMe 재시도 가능하도록)
  useEffect(() => {
    if (pathname === '/login' && typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
    }
  }, [pathname]);

  const isLoggedOut = typeof window !== 'undefined' && sessionStorage.getItem(AUTH_LOGGED_OUT_KEY) === '1';
  const enabled = explicitEnabled && !isLoggedOut;

  return useQuery(
    withQueryDefaults<MeResponse | null>({
      queryKey: queryKeys.me,
      queryFn: async () => {
        try {
          const data = await api.users.getMe();
          if (typeof window !== 'undefined') sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
          return data;
        } catch {
          if (typeof window !== 'undefined') sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, '1');
          return null;
        }
      },
      retry: false,
      enabled,
    }),
  );
}
