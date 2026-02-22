import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';
import { AUTH_LOGGED_OUT_KEY } from './useMe';
import { clearMeCache } from '@/lib/meCache';

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api.auth.logout();
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, '1');
        clearMeCache();
      }
      queryClient.setQueryData(queryKeys.me, null);
    }
  };
}
