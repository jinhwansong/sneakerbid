import { Injectable } from '@nestjs/common';
import type { TxClient } from '@/database/transaction-client';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class WalletRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * BID_HOLD 중 아직 BID_RELEASE 되지 않은 금액 합계 (입찰 보류).
   * 잔액(balance)은 보류 반영 후 값이므로, 총 자산 = balance + 이 값.
   */
  async sumActiveBidHoldAmount(userId: string): Promise<number> {
    const rows = await this.db.query<{ s: string }>(
      `SELECT COALESCE(SUM(ABS(wt.amount)), 0)::text AS s
       FROM "WalletTransaction" wt
       WHERE wt."userId" = $1
         AND wt.type = 'BID_HOLD'
         AND NOT EXISTS (
           SELECT 1 FROM "WalletTransaction" r
           WHERE r.type = 'BID_RELEASE'
             AND r."refType" = 'BID'
             AND r."refId" = wt."refId"
         )`,
      [userId],
    );
    return parseInt(rows[0]?.s ?? '0', 10);
  }

  /** 동일 bidId에 대한 BID_RELEASE가 이미 있는지 (멱등 해제용) */
  async countBidReleaseForBid(tx: TxClient, bidId: string): Promise<number> {
    const rows = await tx.$queryRaw<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM "WalletTransaction"
       WHERE type = 'BID_RELEASE' AND "refType" = 'BID' AND "refId" = $1`,
      [bidId],
    );
    return parseInt(rows[0]?.n ?? '0', 10);
  }
}
