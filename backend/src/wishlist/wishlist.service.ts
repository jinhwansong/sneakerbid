import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuctionRepository } from '../database/repositories/auction.repository';
import { WishlistReadRepository } from '../database/repositories/wishlist-read.repository';
import { WishlistToggleRepository } from '../database/repositories/wishlist-toggle.repository';
import type { RequestUser } from '@/common/decorator/user.decorator';
import type { WishlistItem, WishlistToggleResult } from './wishlist.types';

@Injectable()
export class WishlistService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auctionRepo: AuctionRepository,
    private readonly wishlistReadRepo: WishlistReadRepository,
    private readonly wishlistToggleRepo: WishlistToggleRepository,
  ) {}

  /** 찜하기 토글 (있으면 해제, 없으면 추가) - 단일 트랜잭션으로 원자적 처리 */
  async toggle(
    auctionId: string,
    user: RequestUser,
  ): Promise<WishlistToggleResult> {
    const auctionExists = await this.auctionRepo.existsById(auctionId);
    if (!auctionExists) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    const result = await this.db.transaction(async (tx) => {
      const action = await this.wishlistToggleRepo.toggleAtomic(
        tx,
        user.id,
        auctionId,
        randomUUID(),
      );
      return { isWishlisted: action === 'inserted' };
    });

    return result;
  }

  /** 경매를 찜한 사용자 ID (알림용) */
  async findUserIdsByAuctionId(auctionId: string): Promise<string[]> {
    return this.wishlistReadRepo.findUserIdsByAuctionId(auctionId);
  }

  /** 여러 경매 ID에 대해 찜 여부 맵 반환 (userId, auctionIds) */
  async getWishlistedMap(
    userId: string,
    auctionIds: string[],
  ): Promise<Record<string, boolean>> {
    if (auctionIds.length === 0) return {};

    const wishlisted = await this.wishlistReadRepo.findWishlistedAuctionIdsIn(
      userId,
      auctionIds,
    );
    const set = new Set(wishlisted);
    return Object.fromEntries(auctionIds.map((id) => [id, set.has(id)]));
  }

  /** 내 찜 목록 조회 (raw SQL - Supabase auction/sneaker relation 이슈 회피) */
  async getMyWishlist(user: RequestUser): Promise<WishlistItem[]> {
    const rows = await this.wishlistReadRepo.findMyWishlist(user.id);

    return rows.map((r) => ({
      id: r.id,
      auctionId: r.auctionId,
      sneakerName: r.sneaker_modelName,
      brand: r.sneaker_brand,
      imageUrl: r.sneaker_imageUrl,
      size: r.size,
      currentPrice: r.currentPrice,
      endTime: r.endTime,
      status: r.status,
      bidCount: r.bid_count,
      buyNowPrice: r.buyNowPrice,
    }));
  }
}
