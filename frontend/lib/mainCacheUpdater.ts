import type { QueryClient } from '@tanstack/react-query';
import type { GetMainAuctionsResponse, AuctionSummary } from '@/types/auction';
import { queryKeys } from '@/hooks/query/queryKeys';

/** 메인 경매 캐시에서 특정 경매의 입찰 정보를 SSE newBid 이벤트로 갱신 */
export function updateMainCacheAuctionBid(
  queryClient: QueryClient,
  auctionId: string,
  bidAmount: number,
  participantDelta = 1,
): void {
  queryClient.setQueryData<GetMainAuctionsResponse>(
    queryKeys.auctions.main,
    (prev) => {
      if (!prev) return prev;
      const updateOne = (arr: AuctionSummary[]) =>
        arr.map((a) =>
          a.auctionId === auctionId
            ? {
                ...a,
                currentPrice: bidAmount,
                bidCount: (a.bidCount ?? 0) + participantDelta,
              }
            : a,
        );
      return {
        ongoing: updateOne(prev.ongoing ?? []),
        closed: updateOne(prev.closed ?? []),
      };
    },
  );
}
