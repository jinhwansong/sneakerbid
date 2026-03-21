import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';

export function useAdminBidHistory(auctionId: string | null, limit = 200) {
  return useQuery({
    queryKey: queryKeys.admin.bidHistory(auctionId ?? '', limit),
    queryFn: () => api.admin.getBidHistory(auctionId!, limit),
    enabled: !!auctionId,
  });
}
