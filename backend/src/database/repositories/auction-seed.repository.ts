import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface AuctionSeedInsert {
  id: string;
  sneakerId: string;
  size: string;
  startPrice: number;
  buyNowPrice: number;
  minimumIncrement: number;
  endTime: Date;
  sellerUserId: string;
}

/** KicksDB 시드 등에서만 사용하는 경매 쓰기 */
@Injectable()
export class AuctionSeedRepository {
  constructor(private readonly db: DatabaseService) {}

  async existsOpenForSneakerSizeAfter(
    sneakerId: string,
    size: string,
    after: Date,
  ): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM "Auction" WHERE "sneakerId" = $1 AND size = $2 AND status = 'OPEN' AND "endTime" > $3 LIMIT 1`,
      [sneakerId, size, after],
    );
    return rows.length > 0;
  }

  async insertSeedRow(row: AuctionSeedInsert): Promise<void> {
    const { startPrice } = row;
    await this.db.query(
      `INSERT INTO "Auction" (id, "sneakerId", size, "startPrice", "currentPrice", "buyNowPrice", "minimumIncrement", status, "endTime", "sellerUserId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $4, $5, $6, 'OPEN', $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        row.id,
        row.sneakerId,
        row.size,
        startPrice,
        row.buyNowPrice,
        row.minimumIncrement,
        row.endTime.toISOString(),
        row.sellerUserId,
      ],
    );
  }
}
