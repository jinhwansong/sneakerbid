import { WishlistReadRepository } from '../../src/database/repositories/wishlist-read.repository';
import { DatabaseService } from '../../src/database/database.service';

describe('WishlistReadRepository', () => {
  let repo: WishlistReadRepository;
  let mockDb: { query: jest.Mock };

  beforeEach(() => {
    mockDb = { query: jest.fn().mockResolvedValue([]) };
    repo = new WishlistReadRepository(mockDb as unknown as DatabaseService);
  });

  describe('findMyWishlist', () => {
    it('userId로 찜 목록 조회', async () => {
      const rows = [
        {
          id: 'w1',
          auctionId: 'a1',
          sneaker_modelName: 'Dunk',
          sneaker_brand: 'Nike',
        },
      ];
      mockDb.query.mockResolvedValueOnce(rows);

      const result = await repo.findMyWishlist('u1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('Wishlist'),
        ['u1'],
      );
      expect(result).toEqual(rows);
    });
  });
});
