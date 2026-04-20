import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SellerDashboardResponse } from '@/types/auth';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';

export function useSellerDashboard(enabled: boolean) {
  return useQuery(
    withQueryDefaults<SellerDashboardResponse>({
      queryKey: ['users', 'sellerDashboard'] as const,
      queryFn: () => api.users.getSellerDashboard(),
      enabled,
    }),
  );
}
