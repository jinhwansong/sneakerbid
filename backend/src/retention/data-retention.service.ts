import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '@/database/database.service';
import {
  DATA_RETENTION_BATCH_SIZE,
  DATA_RETENTION_CRON,
} from '@/common/constants/retention.constants';

/**
 * 포폴/스테이징 DB 용량·Egress 부담 완화: 종료된 지 N일이 지난 경매와
 * 관련 Order·지갑 거래·입찰(경매 CASCADE) 등을 배치로 삭제.
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

    let totalAuctions = 0;
    let batches = 0;

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
      batches++;

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

    if (totalAuctions === 0) {
      this.logger.log(
        `[DataRetention] 삭제 대상 없음 (cutoff=${cutoff.toISOString()}, days=${days})`,
      );
      return;
    }

    const orphanSneakers = await this.db.query<{ id: string }>(
      `DELETE FROM "Sneaker" s
       WHERE NOT EXISTS (SELECT 1 FROM "Auction" a WHERE a."sneakerId" = s.id)
       RETURNING s.id`,
    );

    this.logger.log(
      `[DataRetention] 종료 경매 ${totalAuctions}건 삭제 (${batches}배치, cutoff=${cutoff.toISOString()}), 미사용 Sneaker ${orphanSneakers.length}건 삭제`,
    );
  }
}
