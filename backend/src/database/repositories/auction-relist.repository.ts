import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface BotRelistInsertParams {
  id: string;
  sneakerId: string;
  size: string;
  currentPrice: number;
  buyNowPrice: number | null;
  minimumIncrement: number;
  endTimeIso: string;
  sellerUserId: string;
  relistedFromAuctionId: string;
}

/** 봇 낙찰 후 재등록 INSERT (BotsService 전용) */
@Injectable()
export class AuctionRelistRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * 부분 유니크 ON CONFLICT DO NOTHING → 미삽입 시 null.
   */
  async insertAfterBotWin(
    row: BotRelistInsertParams,
  ): Promise<{ id: string } | null> {
    const inserted = await this.db.query<{ id: string }>(
      `INSERT INTO "Auction" (id, "sneakerId", size, "startPrice", "currentPrice", "buyNowPrice", "minimumIncrement", status, "endTime", "sellerUserId", "relistedFromAuctionId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("relistedFromAuctionId") WHERE ("relistedFromAuctionId" IS NOT NULL) DO NOTHING
         RETURNING id`,
      [
        row.id,
        row.sneakerId,
        row.size,
        row.currentPrice,
        row.currentPrice,
        row.buyNowPrice,
        row.minimumIncrement,
        row.endTimeIso,
        row.sellerUserId,
        row.relistedFromAuctionId,
      ],
    );
    return inserted[0] ?? null;
  }
}
