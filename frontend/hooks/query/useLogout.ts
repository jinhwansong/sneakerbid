import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api.auth.logout();
    } finally {
      queryClient.setQueryData(queryKeys.me, null);
    }
  };
}
