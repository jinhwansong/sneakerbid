import type { TxClient } from '@/database/transaction-client';

/** SELECT FOR UPDATE로 경매 행 락. soft-close/입찰/수정 시 공통 사용 */
export async function lockAuctionForUpdate(
  tx: TxClient,
  auctionId: string,
  options?: {
    status?: 'OPEN';
    endTimeLte?: Date;
    endTimeGt?: Date;
  },
): Promise<boolean> {
  let sql: string;
  let values: unknown[];

  if (options?.status === 'OPEN' && options?.endTimeLte) {
    sql = 'SELECT 1 FROM "Auction" WHERE "id" = $1 AND "status" = $2 AND "endTime" <= $3 FOR UPDATE';
    values = [auctionId, 'OPEN', options.endTimeLte];
  } else if (options?.status === 'OPEN' && options?.endTimeGt) {
    sql = 'SELECT 1 FROM "Auction" WHERE "id" = $1 AND "status" = $2 AND "endTime" > $3 FOR UPDATE';
    values = [auctionId, 'OPEN', options.endTimeGt];
  } else if (options?.status === 'OPEN') {
    sql = 'SELECT 1 FROM "Auction" WHERE "id" = $1 AND "status" = $2 FOR UPDATE';
    values = [auctionId, 'OPEN'];
  } else {
    sql = 'SELECT 1 FROM "Auction" WHERE "id" = $1 FOR UPDATE';
    values = [auctionId];
  }

  const rows = await tx.$queryRaw<Record<string, unknown>>(sql, values);
  return (rows?.length ?? 0) > 0;
}
