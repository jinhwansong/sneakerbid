import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CreateAuctionDto } from '../../src/auctions/dto/create.auction.dto';
import { AuctionsService } from '../../src/auctions/auctions.service';
import { DatabaseService } from '../../src/database/database.service';
import { AuctionRepository } from '../../src/database/repositories/auction.repository';
import { BidRepository } from '../../src/database/repositories/bid.repository';
import { EventsService } from '../../src/events/events.service';
import { WalletService } from '../../src/wallet/wallet.service';
import { WishlistService } from '../../src/wishlist/wishlist.service';
import type { RequestUser } from '../../src/common/decorator/user.decorator';
import { UserRole } from '../../src/common/enum/role.enum';

describe('AuctionsService', () => {
  let service: AuctionsService;
  let mockDb: { transaction: jest.Mock };
  let mockAuctionRepo: {
    findByIdWithSneaker: jest.Mock;
    findMainAuctions: jest.Mock;
    countOpen: jest.Mock;
    sumClosedVolume24h: jest.Mock;
    findExpiredForClose: jest.Mock;
    findTradeHistoryItem: jest.Mock;
    rowToAuctionWithDetails: jest.Mock;
  };
  let mockBidRepo: {
    findDistinctUserIds: jest.Mock;
    findRecentCreatedAt: jest.Mock;
    findBidsForAuction: jest.Mock;
    countByAuctionId: jest.Mock;
  };
  let mockEvents: { emitNewBid: jest.Mock; emitAuctionClosed: jest.Mock };
  let mockWallet: { holdForBid: jest.Mock };
  let mockWishlist: { getWishlistedMap: jest.Mock };

  const mockUser: RequestUser = {
    id: 'u1',
    nickname: 'seller',
    role: UserRole.USER,
    balance: 100000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validCreateDto = {
    modelName: 'Dunk Low',
    brand: 'Nike' as const,
    color: 'Black',
    description: 'Test',
    imageUrl: 'https://example.com/img.jpg',
    size: '260' as const,
    startPrice: 10000,
    minimumIncrement: 1000,
    endTime: new Date(Date.now() + 86400000).toISOString(),
  };

  beforeEach(() => {
    mockDb = { transaction: jest.fn() };
    mockAuctionRepo = {
      findByIdWithSneaker: jest.fn(),
      findMainAuctions: jest.fn().mockResolvedValue([]),
      countOpen: jest.fn().mockResolvedValue(0),
      sumClosedVolume24h: jest.fn().mockResolvedValue(0),
      findExpiredForClose: jest.fn().mockResolvedValue([]),
      findTradeHistoryItem: jest.fn().mockResolvedValue(null),
      rowToAuctionWithDetails: jest.fn((r: unknown) => r),
    };
    mockBidRepo = {
      findDistinctUserIds: jest.fn().mockResolvedValue([]),
      findRecentCreatedAt: jest.fn().mockResolvedValue([]),
      findBidsForAuction: jest.fn().mockResolvedValue([]),
      countByAuctionId: jest.fn().mockResolvedValue(0),
    };
    mockEvents = { emitNewBid: jest.fn(), emitAuctionClosed: jest.fn() };
    mockWallet = { holdForBid: jest.fn().mockResolvedValue(true) };
    mockWishlist = { getWishlistedMap: jest.fn().mockResolvedValue({}) };

    service = new AuctionsService(
      mockDb as unknown as DatabaseService,
      mockAuctionRepo as unknown as AuctionRepository,
      mockBidRepo as unknown as BidRepository,
      mockEvents as unknown as EventsService,
      mockWallet as unknown as WalletService,
      mockWishlist as unknown as WishlistService,
    );
  });

  describe('createAuction', () => {
    it('허용되지 않은 브랜드면 BadRequestException', async () => {
      const dto = {
        ...validCreateDto,
        brand: 'InvalidBrand',
      } as unknown as CreateAuctionDto;
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        '허용된 브랜드가 아닙니다.',
      );
    });

    it('허용되지 않은 사이즈면 BadRequestException', async () => {
      const dto = {
        ...validCreateDto,
        size: '999',
      } as unknown as CreateAuctionDto;
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        '허용된 사이즈가 아닙니다.',
      );
    });

    it('즉시 구매가가 시작가보다 낮으면 BadRequestException', async () => {
      const dto = {
        ...validCreateDto,
        buyNowPrice: 5000,
      } as unknown as CreateAuctionDto;
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        '즉시 구매 가격은 시작 가격 이상이어야 합니다.',
      );
    });

    it('종료 시간이 과거면 BadRequestException', async () => {
      const dto = {
        ...validCreateDto,
        endTime: new Date(Date.now() - 86400000).toISOString(),
      } as unknown as CreateAuctionDto;
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createAuction(dto, 'u1')).rejects.toThrow(
        '경매 종료 시간은 현재보다 이후여야 합니다.',
      );
    });
  });

  describe('getLiveStats', () => {
    it('지표 객체 반환', async () => {
      mockBidRepo.findDistinctUserIds.mockResolvedValue([{ userId: 'u1' }]);
      mockAuctionRepo.countOpen.mockResolvedValue(5);
      mockAuctionRepo.sumClosedVolume24h.mockResolvedValue(100000);
      mockBidRepo.findRecentCreatedAt.mockResolvedValue([
        { createdAt: new Date(Date.now() - 5000) },
        { createdAt: new Date(Date.now() - 10000) },
      ]);

      const result = await service.getLiveStats();

      expect(result).toHaveProperty('activeBidders');
      expect(result).toHaveProperty('activeAuctions');
      expect(result).toHaveProperty('volume24h');
      expect(result).toHaveProperty('avgBidSpeedSeconds');
      expect(typeof result.activeBidders).toBe('number');
      expect(typeof result.activeAuctions).toBe('number');
      expect(typeof result.volume24h).toBe('number');
      expect(typeof result.avgBidSpeedSeconds).toBe('number');
    });
  });

  describe('getAuctionById', () => {
    it('경매 없으면 NotFoundException', async () => {
      mockAuctionRepo.findByIdWithSneaker.mockResolvedValue(null);

      await expect(
        service.getAuctionById('nonexistent', mockUser),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getAuctionById('nonexistent', mockUser),
      ).rejects.toThrow('경매를 찾을 수 없습니다.');
    });
  });

  describe('getBids', () => {
    it('입찰 목록 포맷 반환', async () => {
      mockBidRepo.findBidsForAuction.mockResolvedValue([
        {
          id: 'b1',
          user_nickname: 'user1',
          bidPrice: 15000,
          createdAt: new Date(),
          sourceType: 'USER',
        },
      ]);

      const result = await service.getBids('auction-1', 20);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'b1',
        user: 'user1',
        amount: 15000,
        isBot: false,
      });
    });
  });
});
