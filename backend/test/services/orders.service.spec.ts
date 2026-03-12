import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from '../../src/orders/orders.service';
import { DatabaseService } from '../../src/database/database.service';
import { AuctionRepository } from '../../src/database/repositories/auction.repository';
import { BidRepository } from '../../src/database/repositories/bid.repository';
import { OrderRepository } from '../../src/database/repositories/order.repository';
import { EventsService } from '../../src/events/events.service';
import { AuctionsService } from '../../src/auctions/auctions.service';
import { WalletService } from '../../src/wallet/wallet.service';
import type { RequestUser } from '../../src/common/decorator/user.decorator';
import { UserRole } from '../../src/common/enum/role.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockDb: { findUserById: jest.Mock; transaction: jest.Mock };
  let mockAuctionRepo: Record<string, jest.Mock>;
  let mockBidRepo: { findWinningBid: jest.Mock };
  let mockOrderRepo: { findForPay: jest.Mock; findMyOrders: jest.Mock };
  let mockEvents: { emitAuctionClosed: jest.Mock; emitNewDeal: jest.Mock };
  let mockAuctionsService: {
    getAuctionByIdRaw: jest.Mock;
    getTradeHistoryItem: jest.Mock;
  };
  let mockWallet: {
    pay: jest.Mock;
    convertHoldToPayment: jest.Mock;
    settleSeller: jest.Mock;
  };

  const mockUser: RequestUser = {
    id: 'u1',
    nickname: 'buyer',
    role: UserRole.USER,
    balance: 100000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuction = {
    id: 'a1',
    status: 'OPEN',
    endTime: new Date(Date.now() + 86400000),
    buyNowPrice: 50000,
    startPrice: 10000,
    currentPrice: 10000,
    sneakerId: 's1',
    sellerUserId: 'seller-1',
  };

  beforeEach(() => {
    mockDb = {
      findUserById: jest.fn(),
      transaction: jest.fn(),
    };
    mockAuctionRepo = {};
    mockBidRepo = { findWinningBid: jest.fn() };
    mockOrderRepo = {
      findForPay: jest.fn(),
      findMyOrders: jest.fn().mockResolvedValue([]),
    };
    mockEvents = { emitAuctionClosed: jest.fn(), emitNewDeal: jest.fn() };
    mockAuctionsService = {
      getAuctionByIdRaw: jest.fn(),
      getTradeHistoryItem: jest.fn().mockResolvedValue(null),
    };
    mockWallet = {
      pay: jest.fn().mockResolvedValue(true),
      convertHoldToPayment: jest.fn().mockResolvedValue(undefined),
      settleSeller: jest.fn().mockResolvedValue(undefined),
    };

    service = new OrdersService(
      mockDb as unknown as DatabaseService,
      mockAuctionRepo as unknown as AuctionRepository,
      mockBidRepo as unknown as BidRepository,
      mockOrderRepo as unknown as OrderRepository,
      mockEvents as unknown as EventsService,
      mockAuctionsService as unknown as AuctionsService,
      mockWallet as unknown as WalletService,
    );
  });

  describe('buyNow', () => {
    it('경매 없으면 NotFoundException', async () => {
      mockAuctionsService.getAuctionByIdRaw.mockResolvedValue(null);

      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        '경매를 찾을 수 없습니다.',
      );
    });

    it('종료된 경매면 BadRequestException', async () => {
      mockAuctionsService.getAuctionByIdRaw.mockResolvedValue({
        ...mockAuction,
        status: 'CLOSED',
      });

      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        '종료된 경매입니다.',
      );
    });

    it('즉시 구매 불가 경매면 BadRequestException', async () => {
      mockAuctionsService.getAuctionByIdRaw.mockResolvedValue({
        ...mockAuction,
        buyNowPrice: null,
      });

      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        '즉시 구매 가능한 경매가 아닙니다.',
      );
    });

    it('잔액 부족하면 BadRequestException', async () => {
      mockAuctionsService.getAuctionByIdRaw.mockResolvedValue(mockAuction);
      mockDb.findUserById.mockResolvedValue({
        id: 'u1',
        balance: 10000,
      });

      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.buyNow('a1', mockUser)).rejects.toThrow(
        '잔액이 부족합니다.',
      );
    });
  });

  describe('payOrder', () => {
    it('주문 없으면 NotFoundException', async () => {
      mockOrderRepo.findForPay.mockResolvedValue(null);

      await expect(service.payOrder('order-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.payOrder('order-1', mockUser)).rejects.toThrow(
        '주문을 찾을 수 없습니다.',
      );
    });

    it('다른 사용자 주문이면 ForbiddenException', async () => {
      mockOrderRepo.findForPay.mockResolvedValue({
        id: 'order-1',
        buyerUserId: 'u2',
        auctionId: 'a1',
        finalPrice: 50000,
        status: 'PENDING',
        sellerUserId: 'seller-1',
      });
      mockBidRepo.findWinningBid.mockResolvedValue(null);

      await expect(service.payOrder('order-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.payOrder('order-1', mockUser)).rejects.toThrow(
        '본인 주문만 결제할 수 있습니다.',
      );
    });

    it('PENDING이 아니면 BadRequestException', async () => {
      mockOrderRepo.findForPay.mockResolvedValue({
        id: 'order-1',
        buyerUserId: 'u1',
        auctionId: 'a1',
        finalPrice: 50000,
        status: 'PAID',
        sellerUserId: 'seller-1',
      });

      await expect(service.payOrder('order-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.payOrder('order-1', mockUser)).rejects.toThrow(
        '결제 가능한 상태가 아닙니다.',
      );
    });
  });

  describe('getMyOrders', () => {
    it('주문 목록 반환', async () => {
      mockOrderRepo.findMyOrders.mockResolvedValue([
        {
          id: 'o1',
          auctionId: 'a1',
          sneaker_modelName: 'Dunk',
          sneaker_imageUrl: 'https://example.com/img.jpg',
          sneaker_brand: 'Nike',
          finalPrice: 50000,
          status: 'PAID',
          createdAt: new Date(),
          paidAt: new Date(),
        },
      ]);

      const result = await service.getMyOrders(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'o1',
        auctionId: 'a1',
        sneakerName: 'Dunk',
        brand: 'Nike',
        finalPrice: 50000,
        status: 'PAID',
      });
    });
  });
});
