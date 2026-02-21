import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  GetMainAuctionsResponse,
  AuctionSummary,
  AuctionItem,
} from '@/types/auction';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

function summaryToItem(s: AuctionSummary): AuctionItem {
  return {
    id: s.auctionId,
    modelName: s.sneakerName,
    brand: s.brand,
    imageUrl: s.imageUrl,
    currentBid: s.currentPrice,
    buyNowPrice: s.buyNowPrice ?? undefined,
    endTime: s.endTime,
    participants: s.bidCount ?? 0,
    status: s.status === 'OPEN' ? 'ongoing' : 'closed',
    size: s.size ? Number(s.size) : undefined,
  };
}

export function useMainAuctions() {
  return useQuery(
    withQueryDefaults<GetMainAuctionsResponse>({
      queryKey: queryKeys.auctions.main,
      queryFn: () => api.auctions.getMain(),
    }),
  );
}

/** 메인 API 응답을 AuctionItem[]로 변환 (ongoing → closed 순) */
export function mainAuctionsToItems(
  data: GetMainAuctionsResponse | undefined,
): AuctionItem[] {
  if (!data) return [];
  const ongoing = data.ongoing?.map(summaryToItem) ?? [];
  const closed = data.closed?.map(summaryToItem) ?? [];
  return [...ongoing, ...closed];
}






