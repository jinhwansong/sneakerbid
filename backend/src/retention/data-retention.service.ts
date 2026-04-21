import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '@/database/database.service';
import {
  DATA_RETENTION_BATCH_SIZE,
  DATA_RETENTION_CRON,
} from '@/common/constants/retention.constants';

/**
 * 포폴/스테이징 DB 용량·Egress 부담 완화:
 * - 종료된 지 N일이 지난 경매 + 관련 Order·지갑·입찰
 * - 생성된 지 N일이 지난 Order (지갑 거래 선삭제)
 * - 경매에 연결되지 않은 Sneaker 중 생성 N일 경과분
 * DATA_RETENTION_DAYS=0 이면 비활성화.
 */
@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  private retentionDays(): number {
    return this.config.get<number>('DATA_RETENTION_DAYS', 7);
  }

  @Cron(DATA_RETENTION_CRON, { timeZone: 'Asia/Seoul' })
  async purgeOldClosedAuctions(): Promise<void> {
    const days = this.retentionDays();
    if (days <= 0) {
      this.logger.debug('DATA_RETENTION_DAYS=0, 보존 배치 스킵');
      return;
    }

    const cutoff = new Date();
    cutoff.setTime(cutoff.getTime() - days * 24 * 60 * 60 * 1000);

    const totalAuctions = await this.purgeClosedAuctionBatches(cutoff);
    const totalOrders = await this.purgeOrdersOlderThan(cutoff);
    const totalSneakers = await this.purgeOrphanSneakersOlderThan(cutoff);

    if (totalAuctions === 0 && totalOrders === 0 && totalSneakers === 0) {
      this.logger.log(
        `[DataRetention] 삭제 대상 없음 (cutoff=${cutoff.toISOString()}, days=${days})`,
      );
      return;
    }

    this.logger.log(
      `[DataRetention] 종료 경매 ${totalAuctions}건, Order ${totalOrders}건, 미연결 Sneaker ${totalSneakers}건 삭제 (cutoff=${cutoff.toISOString()}, days=${days})`,
    );
  }

  /** CLOSED + closedAt 보존 기간 초과 경매 및 동일 배치 내 관련 행 삭제 */
  private async purgeClosedAuctionBatches(cutoff: Date): Promise<number> {
    let totalAuctions = 0;

    for (;;) {
      const ids = await this.db.query<{ id: string }>(
        `SELECT id FROM "Auction"
         WHERE status = 'CLOSED'
           AND "closedAt" IS NOT NULL
           AND "closedAt" < $1
         ORDER BY "closedAt" ASC
         LIMIT $2`,
        [cutoff, DATA_RETENTION_BATCH_SIZE],
      );
      if (ids.length === 0) break;

      const auctionIds = ids.map((r) => r.id);

      const removed = await this.db.transactionRaw(async (client) => {
        await client.query(
          `DELETE FROM "WalletTransaction" wt
           WHERE (wt."refType" = 'ORDER' AND wt."refId" IN (
             SELECT o.id FROM "Order" o WHERE o."auctionId" = ANY($1::text[])
           ))
           OR (wt."refType" = 'BID' AND wt."refId" IN (
             SELECT b.id FROM "Bid" b WHERE b."auctionId" = ANY($1::text[])
           ))
           OR (wt."refType" = 'AUCTION' AND wt."refId" = ANY($1::text[]))`,
          [auctionIds],
        );

        await client.query(
          `DELETE FROM "Order" WHERE "auctionId" = ANY($1::text[])`,
          [auctionIds],
        );

        const del = await client.query<{ id: string }>(
          `DELETE FROM "Auction" WHERE id = ANY($1::text[]) RETURNING id`,
          [auctionIds],
        );
        return del.rows.length;
      });

      totalAuctions += removed;

      if (ids.length < DATA_RETENTION_BATCH_SIZE) break;
    }

    return totalAuctions;
  }

  /** 생성일이 보존 기간을 넘긴 Order (지갑 ORDER 레퍼런스 선삭제) */
  private async purgeOrdersOlderThan(cutoff: Date): Promise<number> {
    let total = 0;

    for (;;) {
      const rows = await this.db.query<{ id: string }>(
        `SELECT id FROM "Order"
         WHERE "createdAt" < $1
         ORDER BY "createdAt" ASC
         LIMIT $2`,
        [cutoff, DATA_RETENTION_BATCH_SIZE],
      );
      if (rows.length === 0) break;

      const ids = rows.map((r) => r.id);

      const n = await this.db.transactionRaw(async (client) => {
        await client.query(
          `DELETE FROM "WalletTransaction"
           WHERE "refType" = 'ORDER' AND "refId" = ANY($1::text[])`,
          [ids],
        );
        const del = await client.query<{ id: string }>(
          `DELETE FROM "Order" WHERE id = ANY($1::text[]) RETURNING id`,
          [ids],
        );
        return del.rows.length;
      });

      total += n;
      if (rows.length < DATA_RETENTION_BATCH_SIZE) break;
    }

    return total;
  }

  /** 어떤 경매도 참조하지 않고, 생성일이 보존 기간을 넘긴 Sneaker */
  private async purgeOrphanSneakersOlderThan(cutoff: Date): Promise<number> {
    let total = 0;

    for (;;) {
      const rows = await this.db.query<{ id: string }>(
        `SELECT s.id FROM "Sneaker" s
         WHERE s."createdAt" < $1
           AND NOT EXISTS (SELECT 1 FROM "Auction" a WHERE a."sneakerId" = s.id)
         ORDER BY s."createdAt" ASC
         LIMIT $2`,
        [cutoff, DATA_RETENTION_BATCH_SIZE],
      );
      if (rows.length === 0) break;

      const ids = rows.map((r) => r.id);
      const del = await this.db.query<{ id: string }>(
        `DELETE FROM "Sneaker" WHERE id = ANY($1::text[]) RETURNING id`,
        [ids],
      );
      total += del.length;
      if (rows.length < DATA_RETENTION_BATCH_SIZE) break;
    }

    return total;
  }
}
