import { Injectable } from '@nestjs/common';
import type { TxClient } from '../transaction-client';

/**
 * 찜 토글 CTE만 담당 (WishlistService — ESLint 타입 해석 안정화용 소형 레포).
 */
@Injectable()
export class WishlistToggleRepository {
  async toggleAtomic(
    tx: TxClient,
    userId: string,
    auctionId: string,
    newWishlistId: string,
  ): Promise<'deleted' | 'inserted'> {
    const rows = await tx.$queryRaw<{ action: string }>(
      `WITH deleted AS (
          DELETE FROM "Wishlist" WHERE "userId" = $1 AND "auctionId" = $2 RETURNING id
        ),
        inserted AS (
          INSERT INTO "Wishlist" (id, "userId", "auctionId", "createdAt")
          SELECT $3, $1, $2, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM deleted)
          RETURNING id
        )
        SELECT 'deleted' AS action FROM deleted
        UNION ALL
        SELECT 'inserted' FROM inserted`,
      [userId, auctionId, newWishlistId],
    );
    const action = rows[0]?.action;
    if (action === 'deleted' || action === 'inserted') return action;
    throw new Error('Wishlist toggle returned unexpected row');
  }
}
