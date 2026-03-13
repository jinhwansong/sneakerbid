import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateAuctionDto } from '@/types/auction';
import { queryKeys } from './queryKeys';

export function useCreateAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateAuctionDto) => api.auctions.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.auctions.mySellingPrefix,
      });
    },
  });
}
