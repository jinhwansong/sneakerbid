import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';
import { AUTH_LOGGED_OUT_KEY } from './useMe';

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api.auth.logout();
    } finally {
      if (typeof window !== 'undefined') sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, '1');
      queryClient.setQueryData(queryKeys.me, null);
    }
  };
}
