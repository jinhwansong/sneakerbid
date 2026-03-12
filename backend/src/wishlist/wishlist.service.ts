import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { WishlistRepository } from '@/database/repositories/wishlist.repository';
import type { RequestUser } from '@/common/decorator/user.decorator';
import type {
  WishlistItem,
  WishlistToggleResult,
  WishlistEntryRow,
} from './wishlist.types';

@Injectable()
export class WishlistService {
  constructor(
    private readonly db: DatabaseService,
    private readonly wishlistRepo: WishlistRepository,
  ) {}

  /** 찜하기 토글 (있으면 해제, 없으면 추가) - 원자적 패턴 */
  async toggle(
    auctionId: string,
    user: RequestUser,
  ): Promise<WishlistToggleResult> {
    const supabase = this.db.getSupabase();

    const { data: auction } = await supabase
      .from('Auction')
      .select('id')
      .eq('id', auctionId)
      .single();

    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    const { error } = await supabase.from('Wishlist').insert({
      id: randomUUID(),
      userId: user.id,
      auctionId,
      createdAt: new Date().toISOString(),
    });

    if (!error) {
      return { isWishlisted: true };
    }

    if (error.code === '23505') {
      await supabase
        .from('Wishlist')
        .delete()
        .eq('userId', user.id)
        .eq('auctionId', auctionId);
      return { isWishlisted: false };
    }

    throw error;
  }

  /** 여러 경매 ID에 대해 찜 여부 맵 반환 (userId, auctionIds) */
  async getWishlistedMap(
    userId: string,
    auctionIds: string[],
  ): Promise<Record<string, boolean>> {
    if (auctionIds.length === 0) return {};

    const { data: entries } = await this.db
      .getSupabase()
      .from('Wishlist')
      .select('auctionId')
      .eq('userId', userId)
      .in('auctionId', auctionIds);

    const set = new Set(
      (entries ?? []).map((e: { auctionId: string }) => e.auctionId),
    );
    return Object.fromEntries(auctionIds.map((id) => [id, set.has(id)]));
  }

  /** 내 찜 목록 조회 (raw SQL - Supabase auction/sneaker relation 이슈 회피) */
  async getMyWishlist(user: RequestUser): Promise<WishlistItem[]> {
    const rows = await this.wishlistRepo.findMyWishlist(user.id);

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
