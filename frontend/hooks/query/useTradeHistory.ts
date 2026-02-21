import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuctionHistoryQuery, AuctionHistoryResponse } from '@/types/auction';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export function useTradeHistory(query?: AuctionHistoryQuery) {
  return useQuery(
    withQueryDefaults<AuctionHistoryResponse>({
      queryKey: queryKeys.auctions.history(query),
      queryFn: () => api.auctions.getHistory(query),
    }),
  );
}
