import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MeResponse } from '@/types/auth';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export interface UseMeOptions {
  enabled?: boolean;
}

export function useMe(options?: UseMeOptions) {
  const enabled = options?.enabled ?? true;

  return useQuery(
    withQueryDefaults<MeResponse | null>({
      queryKey: queryKeys.me,
      queryFn: async () => {
        try {
          return await api.users.getMe();
        } catch {
          return null;
        }
      },
      retry: false,
      enabled,
    }),
  );
}
