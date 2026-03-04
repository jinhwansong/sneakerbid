import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuctionItem } from '@/types/auction';
import { summaryToAuctionItem } from '@/lib/auction/summaryToAuctionItem';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export interface UseMyAuctionsOptions {
  status?: 'all' | 'ongoing' | 'closed';
  enabled?: boolean;
}

export function useMyAuctions(options?: UseMyAuctionsOptions) {
  const status = options?.status ?? 'all';
  const enabled = options?.enabled ?? true;

  return useQuery(
    withQueryDefaults<AuctionItem[]>({
      queryKey: queryKeys.auctions.mySelling(status),
      queryFn: async () => {
        const items = await api.auctions.getMySelling(status);
        return items.map(summaryToAuctionItem);
      },
      enabled,
    }),
  );
}
