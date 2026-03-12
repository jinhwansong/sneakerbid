import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AuctionItem,
  AuctionSummary,
  GetMainAuctionsResponse,
} from '@/types/auction';
import type { WishlistItem } from '@/types/wishlist';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';
import {
  updateMainCacheWishlist,
  updateListCacheWishlist,
} from '@/lib/util/mainCacheUpdater';

type WishlistToggleContext = {
  previousMain?: GetMainAuctionsResponse;
  previousIsWishlisted: boolean;
};

/** 백엔드 터미널 상태: 이 상태면 시간과 무관하게 closed */
const WISHLIST_TERMINAL_STATUSES = new Set<string>([
  'CLOSED',
  'FAILED',
  'BUY_NOW',
  'CANCELLED',
]);

function wishlistToItem(w: WishlistItem): AuctionItem {
  const msUntilEnd = new Date(w.endTime).getTime() - Date.now();
  const status = WISHLIST_TERMINAL_STATUSES.has(w.status)
    ? 'closed'
    : msUntilEnd <= 0
      ? 'closed'
      : msUntilEnd <= 60 * 1000
        ? 'ending_soon'
        : 'ongoing';

  return {
    id: w.auctionId,
    modelName: w.sneakerName,
    brand: w.brand,
    imageUrl: w.imageUrl,
    currentBid: w.currentPrice,
    buyNowPrice: w.buyNowPrice ?? undefined,
    endTime: typeof w.endTime === 'string' ? w.endTime : new Date(w.endTime).toISOString(),
    participants: w.bidCount,
    status,
    size: w.size ? Number(w.size) : undefined,
    isWishlisted: true,
  };
}

export function useMyWishlist(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery(
    withQueryDefaults<AuctionItem[]>({
      queryKey: queryKeys.wishlist.my,
      queryFn: async () => {
        const items = await api.wishlist.getMy();
        return items.map(wishlistToItem);
      },
      enabled,
    }),
  );
}

export function useWishlistToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['wishlist', 'toggle'],
    mutationFn: (auctionId: string) => api.wishlist.toggle(auctionId),

    onMutate: async (auctionId: string): Promise<WishlistToggleContext> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.wishlist.my }),
        queryClient.cancelQueries({ queryKey: queryKeys.auctions.main }),
        queryClient.cancelQueries({ queryKey: ['auctions', 'list'] }),
      ]);

      // 현재 main 캐시 스냅샷 (rollback 용)
      const previousMain = queryClient.getQueryData<GetMainAuctionsResponse>(
        queryKeys.auctions.main,
      );

      // 현재 isWishlisted 값: wishlist.my 또는 auctions.main에서 유도 (없으면 false)
      const wishlistData = queryClient.getQueryData<AuctionItem[]>(
        queryKeys.wishlist.my,
      );
      const inWishlist =
        wishlistData?.some((item) => item.id === auctionId) ?? false;
      const allMainItems = previousMain
        ? (Object.values(previousMain).flat() as AuctionSummary[])
        : [];
      const current = allMainItems.find((a) => a.auctionId === auctionId);
      const previousIsWishlisted =
        inWishlist || (current?.isWishlisted ?? false);

      // 낙관적 업데이트: 토글된 값으로 캐시 즉시 반영
      updateMainCacheWishlist(queryClient, auctionId, !previousIsWishlisted);
      updateListCacheWishlist(queryClient, auctionId, !previousIsWishlisted);

      return { previousMain, previousIsWishlisted };
    },

    onSuccess: (result, auctionId) => {
      // 서버 응답으로 확정 반영 (낙관적 값과 다를 경우 보정)
      const next = result?.isWishlisted ?? false;
      updateMainCacheWishlist(queryClient, auctionId, next);
      updateListCacheWishlist(queryClient, auctionId, next);

      // 위시리스트 전용 페이지만 refetch (main/list는 위에서 직접 갱신했으므로 refetch 불필요)
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.my });
    },

    onError: (_, auctionId, context) => {
      // 실패 시 스냅샷으로 롤백
      if (context?.previousMain) {
        queryClient.setQueryData(queryKeys.auctions.main, context.previousMain);
      }
      // list 캐시도 원래 값으로 되돌리기
      updateListCacheWishlist(
        queryClient,
        auctionId,
        context?.previousIsWishlisted ?? false,
      );
    },
  });
}
