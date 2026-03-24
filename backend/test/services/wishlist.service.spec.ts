import { NotFoundException } from '@nestjs/common';
import { WishlistService } from '../../src/wishlist/wishlist.service';
import { DatabaseService } from '../../src/database/database.service';
import { AuctionRepository } from '../../src/database/repositories/auction.repository';
import { WishlistReadRepository } from '../../src/database/repositories/wishlist-read.repository';
import { WishlistToggleRepository } from '../../src/database/repositories/wishlist-toggle.repository';
import type { RequestUser } from '../../src/common/decorator/user.decorator';
import { UserRole } from '../../src/common/enum/role.enum';

describe('WishlistService', () => {
  let service: WishlistService;
  let mockDb: {
    transaction: jest.Mock;
  };
  let mockAuctionRepo: {
    existsById: jest.Mock;
  };
  let mockWishlistReadRepo: {
    findMyWishlist: jest.Mock;
    findWishlistedAuctionIdsIn: jest.Mock;
  };
  let mockWishlistToggleRepo: { toggleAtomic: jest.Mock };

  const mockUser: RequestUser = {
    id: 'u1',
    nickname: 'test',
    role: UserRole.USER,
    balance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockDb = {
      transaction: jest.fn(),
    };
    mockAuctionRepo = {
      existsById: jest.fn(),
    };
    mockWishlistReadRepo = {
      findMyWishlist: jest.fn(),
      findWishlistedAuctionIdsIn: jest.fn(),
    };
    mockWishlistToggleRepo = { toggleAtomic: jest.fn() };
    service = new WishlistService(
      mockDb as unknown as DatabaseService,
      mockAuctionRepo as unknown as AuctionRepository,
      mockWishlistReadRepo as unknown as WishlistReadRepository,
      mockWishlistToggleRepo as unknown as WishlistToggleRepository,
    );
  });

  describe('toggle', () => {
    it('경매가 없으면 NotFoundException', async () => {
      mockAuctionRepo.existsById.mockResolvedValue(false);

      let thrown: unknown;
      try {
        await service.toggle('auction-1', mockUser);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(NotFoundException);
      expect((thrown as Error).message).toBe('경매를 찾을 수 없습니다.');
    });

    it('삭제 후 isWishlisted false', async () => {
      mockAuctionRepo.existsById.mockResolvedValue(true);
      mockDb.transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          mockWishlistToggleRepo.toggleAtomic.mockResolvedValue('deleted');
          return fn({});
        },
      );

      const result = await service.toggle('auction-1', mockUser);

      expect(result).toEqual({ isWishlisted: false });
    });

    it('추가 후 isWishlisted true', async () => {
      mockAuctionRepo.existsById.mockResolvedValue(true);
      mockDb.transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          mockWishlistToggleRepo.toggleAtomic.mockResolvedValue('inserted');
          return fn({});
        },
      );

      const result = await service.toggle('auction-1', mockUser);

      expect(result).toEqual({ isWishlisted: true });
    });
  });

  describe('getWishlistedMap', () => {
    it('auctionIds가 비어있으면 빈 객체', async () => {
      const result = await service.getWishlistedMap('u1', []);

      expect(result).toEqual({});
      expect(
        mockWishlistReadRepo.findWishlistedAuctionIdsIn,
      ).not.toHaveBeenCalled();
    });

    it('찜 여부 맵 반환', async () => {
      mockWishlistReadRepo.findWishlistedAuctionIdsIn.mockResolvedValue([
        'a1',
        'a3',
      ]);

      const result = await service.getWishlistedMap('u1', ['a1', 'a2', 'a3']);

      expect(
        mockWishlistReadRepo.findWishlistedAuctionIdsIn,
      ).toHaveBeenCalledWith('u1', ['a1', 'a2', 'a3']);
      expect(result).toEqual({ a1: true, a2: false, a3: true });
    });
  });

  describe('getMyWishlist', () => {
    it('찜 목록을 WishlistItem 형태로 변환하여 반환', async () => {
      const rows = [
        {
          id: 'w1',
          auctionId: 'a1',
          sneaker_modelName: 'Dunk',
          sneaker_brand: 'Nike',
          sneaker_imageUrl: 'https://example.com/img.jpg',
          size: '260',
          currentPrice: 100000,
          endTime: new Date('2024-12-31'),
          status: 'OPEN',
          bid_count: 5,
          buyNowPrice: 150000,
        },
      ];
      mockWishlistReadRepo.findMyWishlist.mockResolvedValue(rows);

      const result = await service.getMyWishlist(mockUser);

      expect(mockWishlistReadRepo.findMyWishlist).toHaveBeenCalledWith('u1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'w1',
        auctionId: 'a1',
        sneakerName: 'Dunk',
        brand: 'Nike',
        imageUrl: 'https://example.com/img.jpg',
        size: '260',
        currentPrice: 100000,
        endTime: new Date('2024-12-31'),
        status: 'OPEN',
        bidCount: 5,
        buyNowPrice: 150000,
      });
    });
  });
});
