import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuctionSummary, AuctionItem } from '@/types/auction';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

function summaryToItem(s: AuctionSummary): AuctionItem {
  const msUntilEnd =
    typeof s.endTime === 'string'
      ? new Date(s.endTime).getTime() - Date.now()
      : (s.endTime as Date).getTime() - Date.now();
  const status =
    s.status === 'CLOSED'
      ? 'closed'
      : msUntilEnd <= 0
        ? 'closed'
        : msUntilEnd <= 60 * 1000
          ? 'ending_soon'
          : 'ongoing';

  return {
    id: s.auctionId,
    modelName: s.sneakerName,
    brand: s.brand,
    imageUrl: s.imageUrl,
    currentBid: s.currentPrice,
    buyNowPrice: s.buyNowPrice ?? undefined,
    endTime: typeof s.endTime === 'string' ? s.endTime : (s.endTime as Date).toISOString(),
    participants: s.bidCount ?? 0,
    status,
    size: s.size ? Number(s.size) : undefined,
  };
}

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
        return items.map(summaryToItem);
      },
      enabled,
    }),
  );
}
