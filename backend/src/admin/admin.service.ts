import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { BotRepository } from '@/database/repositories/bot.repository';
import { OrdersService } from '@/orders/orders.service';

export interface SettlementStatsDto {
  totalPaidAmount: number;
  totalPaidCount: number;
  totalClosedAuctions: number;
  totalClosedWithWinner: number;
  pendingOrders: number;
  todayPaidAmount: number;
  todayPaidCount: number;
}

export interface BidHistoryPointDto {
  bidPrice: number;
  createdAt: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly botRepo: BotRepository,
    private readonly ordersService: OrdersService,
  ) {}

  /** 정산 현황/집계 */
  async getSettlementStats(): Promise<SettlementStatsDto> {
    const [
      paidRows,
      closedRows,
      pendingRows,
      todayPaidRows,
    ] = await Promise.all([
      this.db.query<{ sum: string; count: string }>(
        `SELECT COALESCE(SUM("finalPrice"), 0)::text as sum, COUNT(*)::text as count
         FROM "Order" WHERE status = 'PAID'`,
      ),
      this.db.query<{ total: string; withWinner: string }>(
        `SELECT COUNT(*)::text as total,
         COUNT(*) FILTER (WHERE "winnerUserId" IS NOT NULL)::text as "withWinner"
         FROM "Auction" WHERE status = 'CLOSED'`,
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM "Order" WHERE status = 'PENDING'`,
      ),
      this.db.query<{ sum: string; count: string }>(
        `SELECT COALESCE(SUM("finalPrice"), 0)::text as sum, COUNT(*)::text as count
         FROM "Order" WHERE status = 'PAID' AND "paidAt" >= CURRENT_DATE`,
      ),
    ]);

    const paid = paidRows[0];
    const closed = closedRows[0];
    const pending = pendingRows[0];
    const todayPaid = todayPaidRows[0];

    return {
      totalPaidAmount: parseInt(paid?.sum ?? '0', 10),
      totalPaidCount: parseInt(paid?.count ?? '0', 10),
      totalClosedAuctions: parseInt(closed?.total ?? '0', 10),
      totalClosedWithWinner: parseInt(closed?.withWinner ?? '0', 10),
      pendingOrders: parseInt(pending?.count ?? '0', 10),
      todayPaidAmount: parseInt(todayPaid?.sum ?? '0', 10),
      todayPaidCount: parseInt(todayPaid?.count ?? '0', 10),
    };
  }

  /** 경매 강제 종료 */
  async forceCloseAuction(auctionId: string): Promise<{ success: boolean }> {
    const closed = await this.ordersService.closeAuctionForAdmin(auctionId);
    if (!closed) {
      throw new NotFoundException('경매를 찾을 수 없거나 이미 종료되었습니다.');
    }
    return { success: true };
  }

  /** 봇 목록 (관리자용) */
  async getBots() {
    return this.botRepo.findAll();
  }

  /** 봇 on/off 토글 */
  async setBotEnabled(
    botId: string,
    enabled: boolean,
  ): Promise<{ success: boolean }> {
    const ok = await this.botRepo.setEnabled(botId, enabled);
    if (!ok) {
      throw new NotFoundException('봇을 찾을 수 없습니다.');
    }
    return { success: true };
  }

  /** 가격 변동 차트용 입찰 히스토리 (createdAt ASC) */
  async getBidHistoryForChart(
    auctionId: string,
    limit = 200,
  ): Promise<BidHistoryPointDto[]> {
    const rows = await this.db.query<{ bidPrice: number; createdAt: Date }>(
      `SELECT "bidPrice", "createdAt" FROM "Bid"
       WHERE "auctionId" = $1 AND "disqualifiedAt" IS NULL
       ORDER BY "createdAt" ASC LIMIT $2`,
      [auctionId, limit],
    );
    return rows.map((r) => ({
      bidPrice: r.bidPrice,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  }
}
