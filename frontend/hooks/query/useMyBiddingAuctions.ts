import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuctionItem } from '@/types/auction';
import { summaryToAuctionItem } from '@/lib/auction/summaryToAuctionItem';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export interface UseMyBiddingAuctionsOptions {
  enabled?: boolean;
  status?: 'ongoing' | 'closed' | 'all';
}

export function useMyBiddingAuctions(options?: UseMyBiddingAuctionsOptions) {
  const enabled = options?.enabled ?? true;
  const status = options?.status ?? 'ongoing';

  return useQuery(
    withQueryDefaults<AuctionItem[]>({
      queryKey: [...queryKeys.auctions.myBidding, status],
      queryFn: async () => {
        const items = await api.auctions.getMyBidding(status);
        return items.map(summaryToAuctionItem);
      },
      enabled,
    }),
  );
}
