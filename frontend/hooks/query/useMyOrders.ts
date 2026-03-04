import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { GetMyOrdersResponse } from '@/types/orders';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export interface UseMyOrdersOptions {
  enabled?: boolean;
}

export function useMyOrders(options?: UseMyOrdersOptions) {
  const enabled = options?.enabled ?? true;

  return useQuery(
    withQueryDefaults<GetMyOrdersResponse>({
      queryKey: queryKeys.orders.my,
      queryFn: () => api.orders.getMyOrders(),
      enabled,
    }),
  );
}
