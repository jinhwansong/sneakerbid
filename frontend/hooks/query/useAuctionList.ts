import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AuctionListQuery,
  AuctionSummary,
  AuctionItem,
} from '@/types/auction';
import type { SortBy } from '@/constants';
import { queryDefaults } from '@/hooks/withQueryDefaults';
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
    isWishlisted: s.isWishlisted,
    minimumIncrement: s.minimumIncrement,
  };
}

export interface UseAuctionListParams {
  brand?: string | null;
  size?: number | null;
  sort?: SortBy;
}

export function useAuctionList(params: UseAuctionListParams = {}) {
  const { brand = null, size = null, sort = 'ending_soon' } = params;
  const query: AuctionListQuery = {
    limit: 10,
    ...(brand != null && brand !== '' && { brand }),
    ...(size != null && { size: String(size) }),
    ...(sort && { sort }),
  };
  const queryKey = queryKeys.auctions.list({
    brand: brand ?? undefined,
    size: size ?? undefined,
    sort,
  });

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      api.auctions.getList({
        ...query,
        afterId: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    ...queryDefaults,
  });
}

/** useAuctionList 결과를 AuctionItem[] (평탄화)로 변환 */
export function auctionListPagesToItems(
  data: ReturnType<typeof useAuctionList>['data'],
): AuctionItem[] {
  if (!data?.pages) return [];
  return data.pages.flatMap((p) => p.items.map(summaryToItem));
}
