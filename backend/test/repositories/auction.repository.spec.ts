import { AuctionRepository } from '../../src/database/repositories/auction.repository';
import { DatabaseService } from '../../src/database/database.service';

describe('AuctionRepository', () => {
  let repo: AuctionRepository;
  let mockDb: { query: jest.Mock };

  beforeEach(() => {
    mockDb = { query: jest.fn().mockResolvedValue([]) };
    repo = new AuctionRepository(mockDb as unknown as DatabaseService);
  });

  describe('findMainAuctions', () => {
    it('OPEN 경매 endTime > now 조회, 20건 제한', async () => {
      const now = new Date('2025-03-13T12:00:00Z');
      mockDb.query.mockResolvedValueOnce([{ id: 'a1' }]);

      const result = await repo.findMainAuctions(now);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'OPEN'"),
        [now],
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 20'),
        expect.any(Array),
      );
      expect(result).toEqual([{ id: 'a1' }]);
    });
  });

  describe('findByIdWithSneaker', () => {
    it('경매 있으면 반환', async () => {
      const row = { id: 'a1', sneaker_modelName: 'Dunk' };
      mockDb.query.mockResolvedValueOnce([row]);

      const result = await repo.findByIdWithSneaker('a1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE a.id = $1'),
        ['a1'],
      );
      expect(result).toEqual(row);
    });

    it('경매 없으면 null', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repo.findByIdWithSneaker('missing');

      expect(result).toBeNull();
    });
  });

  describe('findMySelling', () => {
    it('all 필터 시 status 조건 없음', async () => {
      const now = new Date();
      mockDb.query.mockResolvedValueOnce([]);

      await repo.findMySelling('u1', 'all', now);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('sellerUserId'),
        ['u1'],
      );
    });

    it('ongoing 필터 시 OPEN, endTime 조건', async () => {
      const now = new Date();
      mockDb.query.mockResolvedValueOnce([]);

      await repo.findMySelling('u1', 'ongoing', now);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $2'),
        ['u1', 'OPEN', now],
      );
    });
  });

  describe('findByIdsWithSneaker', () => {
    it('auctionIds 비어있으면 빈 배열', async () => {
      const result = await repo.findByIdsWithSneaker([], 'all', new Date());
      expect(result).toEqual([]);
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });
});
