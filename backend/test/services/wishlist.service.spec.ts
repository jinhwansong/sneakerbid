import { NotFoundException } from '@nestjs/common';
import { WishlistService } from '../../src/wishlist/wishlist.service';
import { DatabaseService } from '../../src/database/database.service';
import { WishlistRepository } from '../../src/database/repositories/wishlist.repository';
import type { RequestUser } from '../../src/common/decorator/user.decorator';
import { UserRole } from '../../src/common/enum/role.enum';

describe('WishlistService', () => {
  let service: WishlistService;
  let mockDb: {
    getSupabase: jest.Mock;
    transaction: jest.Mock;
  };
  let mockWishlistRepo: {
    findMyWishlist: jest.Mock;
  };

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
      getSupabase: jest.fn(),
      transaction: jest.fn(),
    };
    mockWishlistRepo = {
      findMyWishlist: jest.fn(),
    };
    service = new WishlistService(
      mockDb as unknown as DatabaseService,
      mockWishlistRepo as unknown as WishlistRepository,
    );
  });

  describe('toggle', () => {
    it('경매가 없으면 NotFoundException', async () => {
      mockDb.getSupabase.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      });

      await expect(service.toggle('auction-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.toggle('auction-1', mockUser)).rejects.toThrow(
        '경매를 찾을 수 없습니다.',
      );
    });

    it('삭제 후 isWishlisted false', async () => {
      mockDb.getSupabase.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'a1' } }),
            }),
          }),
        }),
      });
      mockDb.transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const mockTx = {
            $queryRaw: jest.fn().mockResolvedValue([{ action: 'deleted' }]),
          };
          return fn(mockTx);
        },
      );

      const result = await service.toggle('auction-1', mockUser);

      expect(result).toEqual({ isWishlisted: false });
    });

    it('추가 후 isWishlisted true', async () => {
      mockDb.getSupabase.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'a1' } }),
            }),
          }),
        }),
      });
      mockDb.transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const mockTx = {
            $queryRaw: jest.fn().mockResolvedValue([{ action: 'inserted' }]),
          };
          return fn(mockTx);
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
      expect(mockDb.getSupabase).not.toHaveBeenCalled();
    });

    it('찜 여부 맵 반환', async () => {
      mockDb.getSupabase.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ auctionId: 'a1' }, { auctionId: 'a3' }],
              }),
            }),
          }),
        }),
      });

      const result = await service.getWishlistedMap('u1', ['a1', 'a2', 'a3']);

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
      mockWishlistRepo.findMyWishlist.mockResolvedValue(rows);

      const result = await service.getMyWishlist(mockUser);

      expect(mockWishlistRepo.findMyWishlist).toHaveBeenCalledWith('u1');
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
