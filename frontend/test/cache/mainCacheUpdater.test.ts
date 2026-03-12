import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  updateMainCacheWishlist,
  updateListCacheWishlist,
  updateMainCacheAuctionBid,
  updateListCacheAuctionBid,
} from '@/lib/util/mainCacheUpdater';
import { queryKeys } from '@/hooks/query/queryKeys';
import type { AuctionSummary, GetMainAuctionsResponse } from '@/types/auction';

describe('mainCacheUpdater', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  describe('updateMainCacheWishlist', () => {
    it('메인 캐시에서 특정 경매의 찜 여부를 갱신한다', () => {
      const initial: GetMainAuctionsResponse = {
        ongoing: [
          {
            auctionId: 'a1',
            sneakerName: 'Nike',
            brand: 'Nike',
            imageUrl: '',
            size: '270',
            currentPrice: 100000,
            endTime: '',
            status: 'OPEN',
            isWishlisted: false,
          },
        ],
      };
      queryClient.setQueryData(queryKeys.auctions.main, initial);

      updateMainCacheWishlist(queryClient, 'a1', true);

      const updated = queryClient.getQueryData<GetMainAuctionsResponse>(
        queryKeys.auctions.main
      );
      expect(updated?.ongoing[0].isWishlisted).toBe(true);
    });

    it('해당 auctionId가 없으면 변경하지 않는다', () => {
      const initial: GetMainAuctionsResponse = {
        ongoing: [
          {
            auctionId: 'a1',
            sneakerName: 'Nike',
            brand: 'Nike',
            imageUrl: '',
            size: '270',
            currentPrice: 100000,
            endTime: '',
            status: 'OPEN',
          },
        ],
      };
      queryClient.setQueryData(queryKeys.auctions.main, initial);

      updateMainCacheWishlist(queryClient, 'a2', true);

      const updated = queryClient.getQueryData<GetMainAuctionsResponse>(
        queryKeys.auctions.main
      );
      expect(updated?.ongoing[0].isWishlisted).toBeUndefined();
    });
  });

  describe('updateListCacheWishlist', () => {
    it('리스트 캐시에서 특정 경매의 찜 여부를 갱신한다', () => {
      const summary: AuctionSummary = {
        auctionId: 'a1',
        sneakerName: 'Nike',
        brand: 'Nike',
        imageUrl: '',
        size: '270',
        currentPrice: 100000,
        endTime: '',
        status: 'OPEN',
        isWishlisted: false,
      };
      const listKey = ['auctions', 'list', {}] as const;
      queryClient.setQueryData(listKey, {
        pages: [{ items: [summary], nextCursor: null, hasMore: false }],
        pageParams: [undefined],
      });

      updateListCacheWishlist(queryClient, 'a1', true);

      const cached = queryClient.getQueryData<{
        pages: { items: AuctionSummary[] }[];
      }>(listKey);
      expect(cached?.pages[0].items[0].isWishlisted).toBe(true);
    });
  });

  describe('updateMainCacheAuctionBid', () => {
    it('메인 캐시에서 입찰 정보를 갱신한다', () => {
      const initial: GetMainAuctionsResponse = {
        ongoing: [
          {
            auctionId: 'a1',
            sneakerName: 'Nike',
            brand: 'Nike',
            imageUrl: '',
            size: '270',
            currentPrice: 100000,
            endTime: '',
            status: 'OPEN',
            bidCount: 3,
          },
        ],
      };
      queryClient.setQueryData(queryKeys.auctions.main, initial);

      updateMainCacheAuctionBid(queryClient, 'a1', 120000, 1);

      const updated = queryClient.getQueryData<GetMainAuctionsResponse>(
        queryKeys.auctions.main
      );
      expect(updated?.ongoing[0].currentPrice).toBe(120000);
      expect(updated?.ongoing[0].bidCount).toBe(4);
    });

    it('useAbsoluteCount가 true면 bidCount를 절대값으로 설정한다', () => {
      const initial: GetMainAuctionsResponse = {
        ongoing: [
          {
            auctionId: 'a1',
            sneakerName: 'Nike',
            brand: 'Nike',
            imageUrl: '',
            size: '270',
            currentPrice: 100000,
            endTime: '',
            status: 'OPEN',
            bidCount: 3,
          },
        ],
      };
      queryClient.setQueryData(queryKeys.auctions.main, initial);

      updateMainCacheAuctionBid(queryClient, 'a1', 120000, 10, true);

      const updated = queryClient.getQueryData<GetMainAuctionsResponse>(
        queryKeys.auctions.main
      );
      expect(updated?.ongoing[0].currentPrice).toBe(120000);
      expect(updated?.ongoing[0].bidCount).toBe(10);
    });
  });

  describe('updateListCacheAuctionBid', () => {
    it('리스트 캐시에서 입찰 정보를 갱신한다', () => {
      const summary: AuctionSummary = {
        auctionId: 'a1',
        sneakerName: 'Nike',
        brand: 'Nike',
        imageUrl: '',
        size: '270',
        currentPrice: 100000,
        endTime: '',
        status: 'OPEN',
        bidCount: 3,
      };
      const listKey = ['auctions', 'list', {}] as const;
      queryClient.setQueryData(listKey, {
        pages: [{ items: [summary], nextCursor: null, hasMore: false }],
        pageParams: [undefined],
      });

      updateListCacheAuctionBid(queryClient, 'a1', 120000, 1);

      const cached = queryClient.getQueryData<{
        pages: { items: AuctionSummary[] }[];
      }>(listKey);
      expect(cached?.pages[0].items[0].currentPrice).toBe(120000);
      expect(cached?.pages[0].items[0].bidCount).toBe(4);
    });
  });
});
