import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

/** 관리자 정산: 합계·건수 (text 숫자) */
export interface AdminOrderSumCountRow {
  sum: string;
  count: string;
}

export interface AdminDailyPaidRow {
  date: string;
  sum: string;
  count: string;
}

export interface AdminClosedAuctionStatsRow {
  total: string;
  withWinner: string;
}

export interface AdminDailyUserRow {
  date: string;
  count: string;
}

export interface AdminBidChartRow {
  bidPrice: number;
  createdAt: Date;
}

/** 관리자 대시보드·정산 전용 (AdminService만 사용) */
@Injectable()
export class AdminStatsRepository {
  constructor(private readonly db: DatabaseService) {}

  async getPaidTotals(): Promise<AdminOrderSumCountRow | null> {
    const rows = await this.db.query<AdminOrderSumCountRow>(
      `SELECT COALESCE(SUM("finalPrice"), 0)::text as sum, COUNT(*)::text as count
       FROM "Order" WHERE status = 'PAID'`,
    );
    return rows[0] ?? null;
  }

  async getPendingOrderCount(): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM "Order" WHERE status = 'PENDING'`,
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  }

  async getTodayPaidTotals(): Promise<AdminOrderSumCountRow | null> {
    const rows = await this.db.query<AdminOrderSumCountRow>(
      `SELECT COALESCE(SUM("finalPrice"), 0)::text as sum, COUNT(*)::text as count
       FROM "Order" WHERE status = 'PAID' AND "paidAt" >= CURRENT_DATE`,
    );
    return rows[0] ?? null;
  }

  async findDailyPaidSince(startDate: Date): Promise<AdminDailyPaidRow[]> {
    return this.db.query<AdminDailyPaidRow>(
      `SELECT DATE("paidAt")::text as date,
       COALESCE(SUM("finalPrice"), 0)::text as sum,
       COUNT(*)::text as count
       FROM "Order"
       WHERE status = 'PAID' AND "paidAt" >= $1
       GROUP BY DATE("paidAt")
       ORDER BY date ASC`,
      [startDate],
    );
  }

  async getClosedAuctionStats(): Promise<AdminClosedAuctionStatsRow | null> {
    const rows = await this.db.query<AdminClosedAuctionStatsRow>(
      `SELECT COUNT(*)::text as total,
       COUNT(*) FILTER (WHERE "winnerUserId" IS NOT NULL)::text as "withWinner"
       FROM "Auction" WHERE status = 'CLOSED'`,
    );
    return rows[0] ?? null;
  }

  async countAllUsers(): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM "User"',
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  }

  async findDailyUserSignupsSince(
    startDate: Date,
  ): Promise<AdminDailyUserRow[]> {
    return this.db.query<AdminDailyUserRow>(
      `SELECT DATE("createdAt")::text as date, COUNT(*)::text as count
       FROM "User"
       WHERE "createdAt" >= $1
       GROUP BY DATE("createdAt")
       ORDER BY date ASC`,
      [startDate],
    );
  }

  async findBidHistoryForChart(
    auctionId: string,
    limit: number,
  ): Promise<AdminBidChartRow[]> {
    return this.db.query<AdminBidChartRow>(
      `SELECT "bidPrice", "createdAt" FROM "Bid"
       WHERE "auctionId" = $1 AND "disqualifiedAt" IS NULL
       ORDER BY "createdAt" ASC LIMIT $2`,
      [auctionId, limit],
    );
  }
}
