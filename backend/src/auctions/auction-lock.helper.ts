import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/** SELECT FOR UPDATE로 경매 행 락. soft-close/입찰/수정 시 공통 사용 */
export async function lockAuctionForUpdate(
  tx: Tx,
  auctionId: string,
  options?: {
    status?: 'OPEN';
    endTimeLte?: Date;
    endTimeGt?: Date;
  },
): Promise<boolean> {
  let query: Prisma.Sql;
  if (options?.status === 'OPEN' && options?.endTimeLte) {
    query = Prisma.sql`SELECT 1 FROM "Auction" WHERE "id" = ${auctionId} AND "status" = 'OPEN' AND "endTime" <= ${options.endTimeLte} FOR UPDATE`;
  } else if (options?.status === 'OPEN' && options?.endTimeGt) {
    query = Prisma.sql`SELECT 1 FROM "Auction" WHERE "id" = ${auctionId} AND "status" = 'OPEN' AND "endTime" > ${options.endTimeGt} FOR UPDATE`;
  } else if (options?.status === 'OPEN') {
    query = Prisma.sql`SELECT 1 FROM "Auction" WHERE "id" = ${auctionId} AND "status" = 'OPEN' FOR UPDATE`;
  } else {
    query = Prisma.sql`SELECT 1 FROM "Auction" WHERE "id" = ${auctionId} FOR UPDATE`;
  }

  const rows = await tx.$queryRaw<Record<string, unknown>[]>(query);
  return rows?.length > 0;
}
