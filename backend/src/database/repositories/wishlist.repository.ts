import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface WishlistItemRow {
  id: string;
  auctionId: string;
  size: string;
  currentPrice: number;
  endTime: Date;
  status: string;
  buyNowPrice: number | null;
  sneaker_modelName: string;
  sneaker_brand: string;
  sneaker_imageUrl: string;
  bid_count: number;
}

@Injectable()
export class WishlistRepository {
  constructor(private readonly db: DatabaseService) {}

  /** 내 찜 목록 (Auction + Sneaker 조인) */
  async findMyWishlist(userId: string): Promise<WishlistItemRow[]> {
    return this.db.query<WishlistItemRow>(
      `SELECT w.id, w."auctionId", a.size, a."currentPrice", a."endTime", a.status, a."buyNowPrice",
         s."modelName" as sneaker_modelName, s.brand as sneaker_brand, s."imageUrl" as sneaker_imageUrl,
         (SELECT COUNT(*) FROM "Bid" WHERE "auctionId" = a.id)::int as bid_count
       FROM "Wishlist" w
       JOIN "Auction" a ON w."auctionId" = a.id
       JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE w."userId" = $1
       ORDER BY w."createdAt" DESC`,
      [userId],
    );
  }
}
