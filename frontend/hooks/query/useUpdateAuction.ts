import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UpdateAuctionDto } from '@/types/auction';
import { queryKeys } from './queryKeys';

export function useUpdateAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAuctionDto }) =>
      api.auctions.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.auctions.mySellingPrefix,
      });
    },
  });
}
