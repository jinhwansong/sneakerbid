import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';

export function useDeleteAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.auctions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.mySelling() });
    },
  });
}
