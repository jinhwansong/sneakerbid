import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';

export function useAdminForceClose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => api.admin.forceCloseAuction(auctionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['auctions', 'list'],
        refetchType: 'all',
      });
    },
  });
}
