import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuctionItem, BidLogItem } from '@/types/auction';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export type AuctionDetailData = {
  auction: AuctionItem;
  bids: BidLogItem[];
};

async function fetchAuctionDetail(id: string): Promise<AuctionDetailData> {
  const [auction, bids] = await Promise.all([
    api.auctions.get(id),
    api.auctions.getBids(id),
  ]);
  return {
    auction: auction as AuctionItem,
    bids: Array.isArray(bids) ? bids : [],
  };
}

export function useAuctionDetail(auctionId: string, options?: { enabled?: boolean }) {
  return useQuery(
    withQueryDefaults<AuctionDetailData>({
      queryKey: queryKeys.auctions.detail(auctionId),
      queryFn: () => fetchAuctionDetail(auctionId),
      enabled: options?.enabled ?? !!auctionId,
    }),
  );
}

/** 경매 종료(SSE auctionClosed) 시 캐시 무효화 */
export function useAuctionClosedCacheInvalidation() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.my });
    queryClient.invalidateQueries({ queryKey: queryKeys.auctions.myBidding });
  }, [queryClient]);
}
