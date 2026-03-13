import { RedisService } from '../../src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { REFRESH_TOKEN_PREFIX } from '@/common/constants/auth.constants';

const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  publish: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue('PONG'),
  duplicate: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
};

jest.mock('ioredis', () => jest.fn(() => mockRedis));

describe('RedisService', () => {
  let service: RedisService;
  let mockConfig: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'REDIS_URL') return 'rediss://default:token@host.upstash.io:6379';
        return undefined;
      }),
    };
    service = new RedisService(mockConfig as unknown as ConfigService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('getClient', () => {
    it('REDIS_URL이 있으면 Redis 인스턴스 생성', async () => {
      await service.get('key');
      expect(mockConfig.get).toHaveBeenCalledWith('REDIS_URL');
      expect(mockRedis.get).toHaveBeenCalledWith('key');
    });
  });

  describe('set', () => {
    it('TTL 없이 set 호출', async () => {
      await service.set('key1', 'value1');
      expect(mockRedis.set).toHaveBeenCalledWith('key1', 'value1');
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('TTL 있으면 setex 호출', async () => {
      await service.set('key2', 'value2', 3600);
      expect(mockRedis.setex).toHaveBeenCalledWith('key2', 3600, 'value2');
    });
  });

  describe('get', () => {
    it('값이 있으면 반환', async () => {
      mockRedis.get.mockResolvedValueOnce('stored-value');
      const result = await service.get('key1');
      expect(result).toBe('stored-value');
      expect(mockRedis.get).toHaveBeenCalledWith('key1');
    });

    it('값이 없으면 null', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      const result = await service.get('missing');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('del 호출', async () => {
      await service.del('key1');
      expect(mockRedis.del).toHaveBeenCalledWith('key1');
    });
  });

  describe('publish', () => {
    it('publish 호출', async () => {
      const count = await service.publish('channel', 'message');
      expect(mockRedis.publish).toHaveBeenCalledWith('channel', 'message');
      expect(count).toBe(1);
    });
  });

  describe('setIfNotExists', () => {
    it('SET NX EX 호출, 성공 시 true', async () => {
      mockRedis.set.mockResolvedValueOnce('OK');
      const result = await service.setIfNotExists('key', 'val', 60);
      expect(mockRedis.set).toHaveBeenCalledWith('key', 'val', 'EX', 60, 'NX');
      expect(result).toBe(true);
    });

    it('키가 이미 있으면 false', async () => {
      mockRedis.set.mockResolvedValueOnce(null);
      const result = await service.setIfNotExists('key', 'val', 60);
      expect(result).toBe(false);
    });
  });

  describe('ping', () => {
    it('ping 호출', async () => {
      await service.ping();
      expect(mockRedis.ping).toHaveBeenCalled();
    });
  });

  describe('setRefreshToken', () => {
    it('prefix와 함께 set 호출', async () => {
      await service.setRefreshToken('token-123', 'u1', 604800);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `${REFRESH_TOKEN_PREFIX}token-123`,
        604800,
        'u1',
      );
    });
  });

  describe('getUserIdByRefreshToken', () => {
    it('prefix와 함께 get 호출', async () => {
      mockRedis.get.mockResolvedValueOnce('u1');
      const result = await service.getUserIdByRefreshToken('token-123');
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${REFRESH_TOKEN_PREFIX}token-123`,
      );
      expect(result).toBe('u1');
    });
  });

  describe('revokeRefreshToken', () => {
    it('prefix와 함께 del 호출', async () => {
      await service.revokeRefreshToken('token-123');
      expect(mockRedis.del).toHaveBeenCalledWith(
        `${REFRESH_TOKEN_PREFIX}token-123`,
      );
    });
  });

  describe('REDIS_URL 검증', () => {
    it('redis:// 또는 rediss://가 아니면 에러', async () => {
      const invalidConfig = { get: jest.fn().mockReturnValue('http://invalid') };
      const invalidService = new RedisService(
        invalidConfig as unknown as ConfigService,
      );
      await expect(invalidService.get('key')).rejects.toThrow(
        'Invalid REDIS_URL',
      );
    });
  });
});
