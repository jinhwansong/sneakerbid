import { RedisService } from '@/redis/redis.service';
import type { BotCooldownStore } from './cooldown.store';

export class RedisBotCooldownStore implements BotCooldownStore {
  constructor(private readonly redis: RedisService) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.redis.set(key, value, ttlSeconds);
  }
}
