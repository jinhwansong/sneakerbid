import { BidRepository } from '../../src/database/repositories/bid.repository';
import { DatabaseService } from '../../src/database/database.service';

describe('BidRepository', () => {
  let repo: BidRepository;
  let mockDb: { query: jest.Mock };

  beforeEach(() => {
    mockDb = { query: jest.fn().mockResolvedValue([]) };
    repo = new BidRepository(mockDb as unknown as DatabaseService);
  });

  describe('findAuctionIdsByUserId', () => {
    it('DISTINCT auctionId 반환', async () => {
      mockDb.query.mockResolvedValueOnce([
        { auctionId: 'a1' },
        { auctionId: 'a2' },
      ]);

      const result = await repo.findAuctionIdsByUserId('u1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DISTINCT "auctionId"'),
        ['u1'],
      );
      expect(result).toEqual(['a1', 'a2']);
    });
  });

  describe('countByAuctionId', () => {
    it('count 파싱하여 반환', async () => {
      mockDb.query.mockResolvedValueOnce([{ count: '5' }]);

      const result = await repo.countByAuctionId('a1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        ['a1'],
      );
      expect(result).toBe(5);
    });

    it('행 없으면 0', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repo.countByAuctionId('a1');

      expect(result).toBe(0);
    });
  });

  describe('findWinningBid', () => {
    it('최고가 1건 반환', async () => {
      mockDb.query.mockResolvedValueOnce([
        { userId: 'u1', bidPrice: 100000 },
      ]);

      const result = await repo.findWinningBid('a1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY "bidPrice" DESC LIMIT 1'),
        ['a1'],
      );
      expect(result).toEqual({ userId: 'u1', bidPrice: 100000 });
    });

    it('없으면 null', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repo.findWinningBid('a1');

      expect(result).toBeNull();
    });
  });
});
