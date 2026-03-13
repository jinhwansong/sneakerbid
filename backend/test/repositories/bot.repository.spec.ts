import { BotRepository } from '../../src/database/repositories/bot.repository';
import { DatabaseService } from '../../src/database/database.service';

describe('BotRepository', () => {
  let repo: BotRepository;
  let mockDb: { query: jest.Mock };

  beforeEach(() => {
    mockDb = { query: jest.fn().mockResolvedValue([]) };
    repo = new BotRepository(mockDb as unknown as DatabaseService);
  });

  describe('findAll', () => {
    it('모든 봇 반환', async () => {
      const rows = [{ id: 'b1', userId: 'u1', type: 'AGGRESSIVE' }];
      mockDb.query.mockResolvedValueOnce(rows);

      const result = await repo.findAll();

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, "userId", type FROM "Bot"',
      );
      expect(result).toEqual(rows);
    });
  });

  describe('findUserIds', () => {
    it('userId 배열 반환', async () => {
      mockDb.query.mockResolvedValueOnce([
        { userId: 'u1' },
        { userId: 'u2' },
      ]);

      const result = await repo.findUserIds();

      expect(result).toEqual(['u1', 'u2']);
    });
  });

  describe('findRelistedAuctionIds', () => {
    it('relistedFromAuctionId 배열 반환', async () => {
      mockDb.query.mockResolvedValueOnce([
        { relistedFromAuctionId: 'a1' },
        { relistedFromAuctionId: 'a2' },
      ]);

      const result = await repo.findRelistedAuctionIds();

      expect(result).toEqual(['a1', 'a2']);
    });
  });

  describe('incrementUserBalance', () => {
    it('UPDATE 쿼리 호출', async () => {
      mockDb.query.mockResolvedValueOnce(undefined);

      await repo.incrementUserBalance('u1', 50000);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('balance = balance + $1'),
        [50000, 'u1'],
      );
    });
  });
});
