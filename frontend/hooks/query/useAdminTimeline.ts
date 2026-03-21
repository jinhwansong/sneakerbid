import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';

export function useAdminTimeline(days = 14) {
  return useQuery({
    queryKey: queryKeys.admin.timeline(days),
    queryFn: () => api.admin.getDashboardTimeline(days),
  });
}
