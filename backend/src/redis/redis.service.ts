import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REFRESH_TOKEN_PREFIX } from '@/common/constants/auth.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private subscriberClient: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Redis {
    if (!this.client) {
      const host = this.configService.get<string>('REDIS_HOST') ?? 'localhost';
      const port = this.configService.get<number>('REDIS_PORT') ?? 6379;
      this.client = new Redis({ host, port });
    }
    return this.client;
  }

  /** Pub/Sub 구독 전용 클라이언트 (subscribe 모드에서는 getClient로 다른 명령 불가) */
  getSubscriber(): Redis {
    if (!this.subscriberClient) {
      this.subscriberClient = this.getClient().duplicate();
    }
    return this.subscriberClient;
  }

  /** Pub/Sub 발행 */
  async publish(channel: string, message: string): Promise<number> {
    return this.getClient().publish(channel, message);
  }

  async onModuleDestroy() {
    if (this.subscriberClient) {
      await this.subscriberClient.quit();
      this.subscriberClient = null;
    }
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  /** SET if Not eXists with TTL. Returns true if key was set, false if already existed. */
  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.getClient().set(
      key,
      value,
      'EX',
      ttlSeconds,
      'NX',
    );
    return result === 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.getClient().get(key);
  }

  async del(key: string): Promise<number> {
    return this.getClient().del(key);
  }

  /** Redis 연결 가능 여부 확인 (PING) */
  async ping(): Promise<void> {
    await this.getClient().ping();
  }

  /** 리프레시 토큰 저장 (key: refreshToken, value: userId) */
  async setRefreshToken(
    refreshToken: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.set(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      userId,
      ttlSeconds,
    );
  }

  /** 리프레시 토큰으로 userId 조회 */
  async getUserIdByRefreshToken(refreshToken: string): Promise<string | null> {
    return this.get(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
  }

  /** 리프레시 토큰 삭제 (로그아웃) */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
  }
}
