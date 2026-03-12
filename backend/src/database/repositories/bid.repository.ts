import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface BidLogRow {
  id: string;
  bidPrice: number;
  createdAt: Date;
  sourceType: string;
  user_nickname: string;
}

@Injectable()
export class BidRepository {
  constructor(private readonly db: DatabaseService) {}

  /** 사용자가 입찰한 경매 ID 목록 */
  async findAuctionIdsByUserId(userId: string): Promise<string[]> {
    const rows = await this.db.query<{ auctionId: string }>(
      `SELECT DISTINCT "auctionId" FROM "Bid" WHERE "userId" = $1 AND "disqualifiedAt" IS NULL`,
      [userId],
    );
    return rows.map((r) => r.auctionId);
  }

  /** LiveStats: 활성 입찰자 수 */
  async findDistinctUserIds(now: Date): Promise<{ userId: string }[]> {
    return this.db.query<{ userId: string }>(
      `SELECT DISTINCT b."userId" FROM "Bid" b
       INNER JOIN "Auction" a ON b."auctionId" = a.id
       WHERE a.status = 'OPEN' AND a."endTime" > $1 AND b."disqualifiedAt" IS NULL`,
      [now],
    );
  }

  /** LiveStats: 최근 입찰 시간 (평균 속도 계산용) */
  async findRecentCreatedAt(limit = 100): Promise<{ createdAt: Date }[]> {
    return this.db.query<{ createdAt: Date }>(
      `SELECT "createdAt" FROM "Bid" WHERE "disqualifiedAt" IS NULL ORDER BY "createdAt" DESC LIMIT $1`,
      [limit],
    );
  }

  /** 경매별 입찰 수 */
  async countByAuctionId(auctionId: string): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM "Bid" WHERE "auctionId" = $1',
      [auctionId],
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  }

  /** 경매별 입찰 목록 (상세 페이지용) */
  async findBidsForAuction(
    auctionId: string,
    limit = 20,
  ): Promise<BidLogRow[]> {
    return this.db.query<BidLogRow>(
      `SELECT b.id, b."bidPrice", b."createdAt", b."sourceType", u.nickname as "user_nickname"
       FROM "Bid" b JOIN "User" u ON b."userId" = u.id
       WHERE b."auctionId" = $1 AND b."disqualifiedAt" IS NULL ORDER BY b."bidPrice" DESC LIMIT $2`,
      [auctionId, limit],
    );
  }

  /** 낙찰 입찰 (최고가 1건) */
  async findWinningBid(auctionId: string): Promise<{
    userId: string;
    bidPrice: number;
  } | null> {
    const rows = await this.db.query<{ userId: string; bidPrice: number }>(
      'SELECT "userId", "bidPrice" FROM "Bid" WHERE "auctionId" = $1 AND "disqualifiedAt" IS NULL ORDER BY "bidPrice" DESC LIMIT 1',
      [auctionId],
    );
    return rows[0] ?? null;
  }
}
