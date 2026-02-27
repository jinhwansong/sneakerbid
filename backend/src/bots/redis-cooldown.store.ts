import { RedisService } from '@/redis/redis.service';
import {
  auctionCooldownKey,
  cooldownKey,
  type BotCooldownStore,
} from './cooldown.store';

export class RedisBotCooldownStore implements BotCooldownStore {
  constructor(private readonly redis: RedisService) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.redis.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async acquireCooldown(
    auctionId: string,
    botId: string,
    botTtlSeconds: number,
    auctionTtlSeconds: number,
  ): Promise<boolean> {
    const auctionKey = auctionCooldownKey(auctionId);
    const botKey = cooldownKey(auctionId, botId);
    const value = String(Date.now());

    const auctionSet = await this.redis.setIfNotExists(
      auctionKey,
      value,
      auctionTtlSeconds,
    );
    if (!auctionSet) return false;

    const botSet = await this.redis.setIfNotExists(
      botKey,
      value,
      botTtlSeconds,
    );
    if (!botSet) {
      await this.redis.del(auctionKey);
      return false;
    }
    return true;
  }
}
