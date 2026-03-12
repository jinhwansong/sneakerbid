import { lockAuctionForUpdate } from '@/auctions/auction-lock.helper';
import type { TxClient } from '@/database/transaction-client';

describe('auction-lock.helper', () => {
  const createMockTx = (rows: Record<string, unknown>[]): TxClient =>
    ({
      $queryRaw: jest.fn().mockResolvedValue(rows),
    }) as unknown as TxClient;

  describe('lockAuctionForUpdate', () => {
    it('should return true when row is found', async () => {
      const tx = createMockTx([{ '?column?': 1 }]);
      const result = await lockAuctionForUpdate(tx, 'auction-1');
      expect(result).toBe(true);
      expect(tx.$queryRaw).toHaveBeenCalledWith(
        'SELECT 1 FROM "Auction" WHERE "id" = $1 FOR UPDATE',
        ['auction-1'],
      );
    });

    it('should return false when no row is found', async () => {
      const tx = createMockTx([]);
      const result = await lockAuctionForUpdate(tx, 'auction-1');
      expect(result).toBe(false);
    });

    it('should use status=OPEN and endTimeLte when both provided', async () => {
      const tx = createMockTx([{ '?column?': 1 }]);
      const endTime = new Date('2025-03-09T12:00:00Z');
      await lockAuctionForUpdate(tx, 'auction-1', {
        status: 'OPEN',
        endTimeLte: endTime,
      });
      expect(tx.$queryRaw).toHaveBeenCalledWith(
        'SELECT 1 FROM "Auction" WHERE "id" = $1 AND "status" = $2 AND "endTime" <= $3 FOR UPDATE',
        ['auction-1', 'OPEN', endTime],
      );
    });

    it('should use status=OPEN and endTimeGt when both provided', async () => {
      const tx = createMockTx([{ '?column?': 1 }]);
      const endTime = new Date('2025-03-09T12:00:00Z');
      await lockAuctionForUpdate(tx, 'auction-1', {
        status: 'OPEN',
        endTimeGt: endTime,
      });
      expect(tx.$queryRaw).toHaveBeenCalledWith(
        'SELECT 1 FROM "Auction" WHERE "id" = $1 AND "status" = $2 AND "endTime" > $3 FOR UPDATE',
        ['auction-1', 'OPEN', endTime],
      );
    });

    it('should use status=OPEN only when no endTime options', async () => {
      const tx = createMockTx([{ '?column?': 1 }]);
      await lockAuctionForUpdate(tx, 'auction-1', { status: 'OPEN' });
      expect(tx.$queryRaw).toHaveBeenCalledWith(
        'SELECT 1 FROM "Auction" WHERE "id" = $1 AND "status" = $2 FOR UPDATE',
        ['auction-1', 'OPEN'],
      );
    });

    it('should throw when both endTimeLte and endTimeGt are provided', async () => {
      const tx = createMockTx([]);
      const endTime = new Date();
      await expect(
        lockAuctionForUpdate(tx, 'auction-1', {
          status: 'OPEN',
          endTimeLte: endTime,
          endTimeGt: endTime,
        }),
      ).rejects.toThrow(
        'lockAuctionForUpdate: endTimeLte and endTimeGt cannot both be provided',
      );
      expect(tx.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
