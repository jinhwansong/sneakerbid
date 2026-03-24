import type { BotCooldownStore } from '../../src/bots/cooldown.store';
import { BotsService } from '../../src/bots/bots.service';
import { DatabaseService } from '../../src/database/database.service';
import { AuctionRepository } from '../../src/database/repositories/auction.repository';
import { BotRepository } from '../../src/database/repositories/bot.repository';
import { AuctionsService } from '../../src/auctions/auctions.service';

describe('BotsService', () => {
  let service: BotsService;
  let mockDb: Record<string, jest.Mock>;
  let mockAuctionRepo: {
    findMainAuctions: jest.Mock;
    findOpenWithBotSeller: jest.Mock;
    findClosedForRelist: jest.Mock;
  };
  let mockBotRepo: {
    findAll: jest.Mock;
    findWithUsers: jest.Mock;
    findUserIds: jest.Mock;
    findRelistedAuctionIds: jest.Mock;
    incrementUserBalance: jest.Mock;
  };
  let mockAuctionsService: { placeBidAsBot: jest.Mock };
  let mockCooldownStore: {
    get: jest.Mock;
    set: jest.Mock;
    acquireCooldown: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {};
    mockAuctionRepo = {
      findMainAuctions: jest.fn().mockResolvedValue([]),
      findOpenWithBotSeller: jest.fn().mockResolvedValue([]),
      findClosedForRelist: jest.fn().mockResolvedValue([]),
    };
    mockBotRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findWithUsers: jest.fn().mockResolvedValue([]),
      findUserIds: jest.fn().mockResolvedValue([]),
      findRelistedAuctionIds: jest.fn().mockResolvedValue([]),
      incrementUserBalance: jest.fn().mockResolvedValue(undefined),
    };
    mockAuctionsService = { placeBidAsBot: jest.fn().mockResolvedValue(null) };
    mockCooldownStore = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      acquireCooldown: jest.fn().mockResolvedValue(false),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    service = new BotsService(
      mockDb as unknown as DatabaseService,
      mockAuctionRepo as unknown as AuctionRepository,
      mockBotRepo as unknown as BotRepository,
      mockAuctionsService as unknown as AuctionsService,
      mockCooldownStore as unknown as BotCooldownStore,
    );
  });

  describe('dailyBotBalanceTopUp', () => {
    it('봇 없으면 아무것도 하지 않음', async () => {
      mockBotRepo.findAll.mockResolvedValue([]);

      await service.dailyBotBalanceTopUp();

      expect(mockBotRepo.incrementUserBalance).not.toHaveBeenCalled();
    });

    it('봇 있으면 잔액 지급', async () => {
      mockBotRepo.findAll.mockResolvedValue([
        { id: 'bot-1', userId: 'u1', type: 'AGGRESSIVE' },
      ]);

      await service.dailyBotBalanceTopUp();

      expect(mockBotRepo.incrementUserBalance).toHaveBeenCalledWith(
        'u1',
        expect.any(Number),
      );
    });
  });

  describe('runBotBidding', () => {
    it('경매 없으면 조기 반환', async () => {
      mockAuctionRepo.findMainAuctions.mockResolvedValue([]);
      mockAuctionRepo.findOpenWithBotSeller.mockResolvedValue([]);
      mockBotRepo.findWithUsers.mockResolvedValue([
        {
          id: 'b1',
          userId: 'u1',
          user_id: 'u1',
          user_nickname: 'Bot',
          user_balance: 100000,
        },
      ]);

      await service.runBotBidding();

      expect(mockAuctionsService.placeBidAsBot).not.toHaveBeenCalled();
    });

    it('봇 없으면 조기 반환', async () => {
      mockAuctionRepo.findMainAuctions.mockResolvedValue([
        {
          id: 'a1',
          sneakerId: 's1',
          sneaker_brand: 'Nike',
          sneaker_modelName: 'Dunk',
          currentPrice: 10000,
          minimumIncrement: 1000,
          startPrice: 10000,
          sellerUserId: 'seller-1',
        },
      ]);
      mockBotRepo.findWithUsers.mockResolvedValue([]);

      await service.runBotBidding();

      expect(mockAuctionsService.placeBidAsBot).not.toHaveBeenCalled();
    });
  });

  describe('relistBotWonAuctions', () => {
    it('봇 유저 없으면 조기 반환', async () => {
      mockBotRepo.findUserIds.mockResolvedValue([]);

      await service.relistBotWonAuctions();

      expect(mockAuctionRepo.findClosedForRelist).not.toHaveBeenCalled();
    });
  });
});
