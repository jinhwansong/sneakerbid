import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotsService } from './bots.service';
import { AuctionsModule } from '@/auctions/auctions.module';
import { RedisService } from '@/redis/redis.service';
import type { BotCooldownStore } from './cooldown.store';
import { RedisBotCooldownStore } from './redis-cooldown.store';
import { MemoryBotCooldownStore } from './memory-cooldown.store';

const BOT_COOLDOWN_STORE_OPTIONS = ['memory', 'redis'] as const;

@Module({
  imports: [AuctionsModule],
  providers: [
    {
      provide: 'BOT_COOLDOWN_STORE',
      useFactory: async (
        config: ConfigService,
        redis: RedisService,
      ): Promise<BotCooldownStore> => {
        const logger = new Logger('BotsModule');
        const raw = config.get<string>('BOT_COOLDOWN_STORE') ?? 'memory';
        const storeType = raw.toLowerCase();
        if (
          !BOT_COOLDOWN_STORE_OPTIONS.includes(
            storeType as (typeof BOT_COOLDOWN_STORE_OPTIONS)[number],
          )
        ) {
          throw new Error(
            `BOT_COOLDOWN_STORE must be one of ${BOT_COOLDOWN_STORE_OPTIONS.join('|')}, got: ${raw}`,
          );
        }
        if (storeType === 'redis') {
          try {
            await redis.ping();
          } catch (err) {
            throw new Error(
              `BOT_COOLDOWN_STORE=redis but Redis is not reachable: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
          logger.log('Bot cooldown store: Redis');
          return new RedisBotCooldownStore(redis);
        }
        logger.log('Bot cooldown store: Memory');
        return new MemoryBotCooldownStore();
      },
      inject: [ConfigService, RedisService],
    },
    BotsService,
  ],
  exports: [BotsService],
})
export class BotsModule {}
