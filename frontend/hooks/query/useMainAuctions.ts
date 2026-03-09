import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  GetMainAuctionsResponse,
  AuctionSummary,
  AuctionItem,
} from '@/types/auction';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';
import {
  updateMainCacheAuctionBid,
  updateListCacheAuctionBid,
} from '@/lib/util/mainCacheUpdater';
import { EMPTY_MAIN } from '@/lib/constants/auction';

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
    isWishlisted: s.isWishlisted,
    minimumIncrement: s.minimumIncrement,
  };
}

export function useMainAuctions(initialData?: GetMainAuctionsResponse) {
  return useQuery(
    withQueryDefaults<GetMainAuctionsResponse>({
      queryKey: queryKeys.auctions.main,
      queryFn: async () => (await api.auctions.getMain()) ?? EMPTY_MAIN,
      initialData,
      initialDataUpdatedAt: initialData ? Date.now() : undefined,
      refetchInterval: 30_000,
    }),
  );
}

/** 메인 API 응답을 AuctionItem[]로 변환 */
export function mainAuctionsToItems(
  data: GetMainAuctionsResponse | undefined,
): AuctionItem[] {
  if (!data) return [];
  return data.ongoing?.map(summaryToItem) ?? [];
}

/** SSE 입찰 이벤트 시 메인 캐시 갱신용 (FeaturedAuction 등에서 사용) */
export function useMainCacheUpdater() {
  const queryClient = useQueryClient();

  return {
    updateBid: (auctionId: string, bidAmount: number, participantDelta = 1) => {
      updateMainCacheAuctionBid(
        queryClient,
        auctionId,
        bidAmount,
        participantDelta,
      );
    },
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.main });
    },
  };
}

/** 입찰 후 관련 캐시 무효화 + 메인/리스트 즉시 갱신 */
export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auctionId, amount }: { auctionId: string; amount: number }) =>
      api.auctions.placeBid(auctionId, amount),
    onSuccess: (result, { auctionId, amount }) => {
      const newPrice = result?.currentPrice ?? amount;
      updateMainCacheAuctionBid(queryClient, auctionId, newPrice, 1);
      updateListCacheAuctionBid(queryClient, auctionId, newPrice, 1);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.myBidding });
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) });
    },
  });
}






