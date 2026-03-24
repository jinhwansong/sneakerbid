import { Injectable } from '@nestjs/common';
import type { TxClient } from '@/database/transaction-client';

/** 경매 삭제 시 FOR UPDATE 잠금 행 */
export interface AuctionDeleteLockRow {
  id: string;
  sellerUserId: string;
  sneakerId: string;
}

/**
 * 경매 수정/삭제 트랜잭션 전용 (AuctionsService만 사용).
 * 작은 파일로 두어 type-checked ESLint가 타입을 안정적으로 해석하도록 함.
 */
@Injectable()
export class AuctionsTxRepository {
  async countBidsInTx(tx: TxClient, auctionId: string): Promise<number> {
    const bidRows = await tx.$queryRaw<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM "Bid" WHERE "auctionId" = $1',
      [auctionId],
    );
    return parseInt(bidRows[0]?.count ?? '0', 10);
  }

  async findAuctionForDeleteLock(
    tx: TxClient,
    auctionId: string,
  ): Promise<AuctionDeleteLockRow | null> {
    const rows = await tx.$queryRaw<AuctionDeleteLockRow>(
      'SELECT id, "sellerUserId", "sneakerId" FROM "Auction" WHERE id = $1 FOR UPDATE',
      [auctionId],
    );
    return rows[0] ?? null;
  }

  async countBlockingOrdersInTx(
    tx: TxClient,
    auctionId: string,
  ): Promise<number> {
    const orderRows = await tx.$queryRaw<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM "Order" WHERE "auctionId" = $1 AND status IN ('PENDING', 'PAID', 'FAILED')`,
      [auctionId],
    );
    return parseInt(orderRows[0]?.count ?? '0', 10);
  }

  async deleteOrdersByAuctionInTx(
    tx: TxClient,
    auctionId: string,
  ): Promise<void> {
    await tx.$queryRaw('DELETE FROM "Order" WHERE "auctionId" = $1', [
      auctionId,
    ]);
  }

  async deleteAuctionByIdInTx(tx: TxClient, auctionId: string): Promise<void> {
    await tx.$queryRaw('DELETE FROM "Auction" WHERE id = $1', [auctionId]);
  }

  async deleteSneakerByIdInTx(tx: TxClient, sneakerId: string): Promise<void> {
    await tx.$queryRaw('DELETE FROM "Sneaker" WHERE id = $1', [sneakerId]);
  }
}
