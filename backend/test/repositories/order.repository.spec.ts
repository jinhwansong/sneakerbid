import { OrderRepository } from '../../src/database/repositories/order.repository';
import { DatabaseService } from '../../src/database/database.service';

describe('OrderRepository', () => {
  let repo: OrderRepository;
  let mockDb: { query: jest.Mock };

  beforeEach(() => {
    mockDb = { query: jest.fn().mockResolvedValue([]) };
    repo = new OrderRepository(mockDb as unknown as DatabaseService);
  });

  describe('findExpiredPending', () => {
    it('PENDING, createdAt < deadline 조회', async () => {
      const deadline = new Date('2025-01-01');
      mockDb.query.mockResolvedValueOnce([{ id: 'o1' }]);

      const result = await repo.findExpiredPending(deadline);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('PENDING'),
        [deadline],
      );
      expect(result).toEqual([{ id: 'o1' }]);
    });
  });

  describe('findForPay', () => {
    it('주문 있으면 반환', async () => {
      const row = { id: 'o1', auctionId: 'a1', status: 'PENDING' };
      mockDb.query.mockResolvedValueOnce([row]);

      const result = await repo.findForPay('o1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE o.id = $1'),
        ['o1'],
      );
      expect(result).toEqual(row);
    });

    it('없으면 null', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await repo.findForPay('missing');

      expect(result).toBeNull();
    });
  });

  describe('findMyOrders', () => {
    it('buyerUserId로 조회', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      await repo.findMyOrders('u1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('buyerUserId'),
        ['u1'],
      );
    });
  });
});
