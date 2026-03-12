import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type {
  GetMainAuctionsResponse,
  GetAuctionListResponse,
  AuctionSummary,
} from '@/types/auction';
import { queryKeys } from '@/hooks/query/queryKeys';

/** 메인 경매 캐시에서 특정 경매의 찜 여부를 즉시 갱신 (invalidate 대기 없이 UI 반영) */
export function updateMainCacheWishlist(
  queryClient: QueryClient,
  auctionId: string,
  isWishlisted: boolean,
): void {
  queryClient.setQueryData<GetMainAuctionsResponse>(
    queryKeys.auctions.main,
    (prev) => {
      if (!prev) return prev;
      const updateOne = (arr: AuctionSummary[]) =>
        arr.map((a) =>
          a.auctionId === auctionId ? { ...a, isWishlisted } : a,
        );
      return {
        ongoing: updateOne(prev.ongoing ?? []),
      };
    },
  );
}

/** 리스트 경매 캐시에서 특정 경매의 찜 여부를 즉시 갱신 */
export function updateListCacheWishlist(
  queryClient: QueryClient,
  auctionId: string,
  isWishlisted: boolean,
): void {
  queryClient.setQueriesData<InfiniteData<GetAuctionListResponse>>(
    { queryKey: ['auctions', 'list'] },
    (prev) => {
      if (!prev?.pages) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          items: page.items.map((a) =>
            a.auctionId === auctionId ? { ...a, isWishlisted } : a,
          ),
        })),
      };
    },
  );
}

/** 메인 경매 캐시에서 특정 경매의 입찰 정보를 SSE newBid 이벤트로 갱신 */
export function updateMainCacheAuctionBid(
  queryClient: QueryClient,
  auctionId: string,
  bidAmount: number,
  participantDeltaOrCount: number = 1,
  /** true면 participantDeltaOrCount를 절대값(bidCount)으로 사용 */
  useAbsoluteCount?: boolean,
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
                bidCount:
                  useAbsoluteCount === true
                    ? participantDeltaOrCount
                    : (a.bidCount ?? 0) + participantDeltaOrCount,
              }
            : a,
        );
      return {
        ongoing: updateOne(prev.ongoing ?? []),
      };
    },
  );
}

/** 리스트 경매 캐시에서 특정 경매의 입찰 정보 갱신 (입찰 성공 시 메인/리스트 즉시 반영) */
export function updateListCacheAuctionBid(
  queryClient: QueryClient,
  auctionId: string,
  bidAmount: number,
  participantDeltaOrCount: number = 1,
  /** true면 participantDeltaOrCount를 절대값(bidCount)으로 사용 */
  useAbsoluteCount?: boolean,
): void {
  queryClient.setQueriesData<InfiniteData<GetAuctionListResponse>>(
    { queryKey: ['auctions', 'list'] },
    (prev) => {
      if (!prev?.pages) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          items: page.items.map((a) =>
            a.auctionId === auctionId
              ? {
                  ...a,
                  currentPrice: bidAmount,
                  bidCount:
                    useAbsoluteCount === true
                      ? participantDeltaOrCount
                      : (a.bidCount ?? 0) + participantDeltaOrCount,
                }
              : a,
          ),
        })),
      };
    },
  );
}
