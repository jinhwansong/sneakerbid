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
    it('모든 봇 반환 (enabled 포함)', async () => {
      const rows = [
        { id: 'b1', userId: 'u1', type: 'AGGRESSIVE', enabled: true },
      ];
      mockDb.query.mockResolvedValueOnce(rows);

      const result = await repo.findAll();

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, "userId", type, COALESCE(enabled, true) as enabled FROM "Bot"',
      );
      expect(result).toEqual(rows);
    });
  });

  describe('findAllForAdmin', () => {
    it('favoriteBrands·활동시간 포함 반환', async () => {
      const rows = [
        {
          id: 'b1',
          userId: 'u1',
          type: 'AGGRESSIVE',
          enabled: true,
          favoriteBrands: ['Nike', 'Adidas'],
          activityStartHour: 9,
          activityEndHour: 22,
        },
      ];
      mockDb.query.mockResolvedValueOnce(rows);

      const result = await repo.findAllForAdmin();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('favoriteBrands'),
      );
      expect(result[0].favoriteBrands).toEqual(['Nike', 'Adidas']);
      expect(result[0].activityEndHour).toBe(22);
    });
  });

  describe('findWithUsers', () => {
    it('활성 봇만 유저 정보와 함께 반환 (enabled 필터 적용)', async () => {
      const rows = [
        {
          id: 'b1',
          userId: 'u1',
          type: 'AGGRESSIVE',
          maxBidMultiplier: 1.5,
          bidUnit: 5000,
          activityStartHour: 9,
          activityEndHour: 22,
          favoriteBrands: null,
          user_id: 'u1',
          user_nickname: 'Bot1',
          user_balance: 100000,
        },
      ];
      mockDb.query.mockResolvedValueOnce(rows);

      const result = await repo.findWithUsers();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE(b.enabled, true) = true'),
      );
      expect(result).toEqual(rows);
      expect(result).toHaveLength(1);
    });
  });

  describe('findUserIds', () => {
    it('활성 봇 userId 배열 반환', async () => {
      mockDb.query.mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }]);

      const result = await repo.findUserIds();

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT "userId" FROM "Bot" WHERE COALESCE(enabled, true) = true',
      );
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

  describe('setEnabled', () => {
    it('봇 on/off 업데이트', async () => {
      mockDb.query.mockResolvedValueOnce([{ id: 'b1' }]);

      const result = await repo.setEnabled('b1', false);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('enabled = $1'),
        [false, 'b1'],
      );
      expect(result).toBe(true);
    });

    it('봇 없으면 false', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repo.setEnabled('missing', true);

      expect(result).toBe(false);
    });

    it('enabled 컬럼 없을 때 (42703) false 반환', async () => {
      mockDb.query.mockRejectedValueOnce({ code: '42703' });

      const result = await repo.setEnabled('someId', true);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('enabled = $1'),
        [true, 'someId'],
      );
      expect(result).toBe(false);
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
