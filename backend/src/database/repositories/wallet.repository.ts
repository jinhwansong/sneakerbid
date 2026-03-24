import { Injectable } from '@nestjs/common';
import type { TxClient } from '@/database/transaction-client';

@Injectable()
export class WalletRepository {
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
