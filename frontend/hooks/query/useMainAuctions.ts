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
  };
}

export function useMainAuctions() {
  return useQuery(
    withQueryDefaults<GetMainAuctionsResponse>({
      queryKey: queryKeys.auctions.main,
      queryFn: async () => (await api.auctions.getMain()) ?? EMPTY_MAIN,
      // FeaturedAuction은 자체 SSE(useAuctionEvents)로 실시간 처리.
      // MainAuctionSection 카드들은 30초 폴링으로 최신화 (SSE 연결 불필요).
      refetchInterval: 30_000,
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

/** 입찰 후 관련 캐시 무효화 */
export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auctionId, amount }: { auctionId: string; amount: number }) =>
      api.auctions.placeBid(auctionId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.myBidding });
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.main });
      queryClient.invalidateQueries({ queryKey: ['auctions', 'list'] });
    },
  });
}






