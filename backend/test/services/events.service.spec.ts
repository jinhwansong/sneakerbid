import { EventsService } from '../../src/events/events.service';
import { RedisService } from '../../src/redis/redis.service';

describe('EventsService', () => {
  let service: EventsService;
  let mockRedis: {
    getSubscriber: jest.Mock;
    publish: jest.Mock;
  };

  beforeEach(() => {
    mockRedis = {
      getSubscriber: jest.fn().mockReturnValue({
        subscribe: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
      }),
      publish: jest.fn().mockResolvedValue(undefined),
    };
    service = new EventsService(mockRedis as unknown as RedisService);
  });

  describe('streamAuction', () => {
    it('구독 시 Observable 반환', () => {
      const obs = service.streamAuction('auction-1');
      expect(obs).toBeDefined();
      expect(obs).toHaveProperty('subscribe');
    });
  });

  describe('streamHistory', () => {
    it('Observable 반환', () => {
      const obs = service.streamHistory();
      expect(obs).toBeDefined();
      expect(obs).toHaveProperty('subscribe');
    });
  });

  describe('emitNewBid', () => {
    it('Redis publish 호출', () => {
      service.emitNewBid('auction-1', {
        id: 'bid-1',
        user: 'user1',
        amount: 10000,
        time: '방금 전',
        isBot: false,
        participantCount: 1,
      });
      expect(mockRedis.publish).toHaveBeenCalled();
    });
  });

  describe('emitAuctionClosed', () => {
    it('Redis publish 호출', () => {
      service.emitAuctionClosed('auction-1', {
        status: 'CLOSED',
        winnerUserId: 'u1',
        finalPrice: 50000,
      });
      expect(mockRedis.publish).toHaveBeenCalled();
    });
  });

  describe('emitNewDeal', () => {
    it('Redis publish 호출', () => {
      service.emitNewDeal({
        auctionId: 'a1',
        imageUrl: 'https://example.com/img.jpg',
        brand: 'Nike',
        modelName: 'Dunk',
        participants: 5,
        finalPrice: 100000,
        date: '2025.03.09',
        status: 'completed',
      });
      expect(mockRedis.publish).toHaveBeenCalled();
    });
  });
});
