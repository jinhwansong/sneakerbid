import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';

export function useAdminSettlement() {
  return useQuery({
    queryKey: queryKeys.admin.settlement(),
    queryFn: () => api.admin.getSettlement(),
  });
}
