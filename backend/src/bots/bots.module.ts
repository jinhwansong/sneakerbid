import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotsService } from './bots.service';
import { AuctionsModule } from '@/auctions/auctions.module';
import { RedisService } from '@/redis/redis.service';
import type { BotCooldownStore } from './cooldown.store';
import { RedisBotCooldownStore } from './redis-cooldown.store';
import { MemoryBotCooldownStore } from './memory-cooldown.store';

@Module({
  imports: [AuctionsModule],
  providers: [
    {
      provide: 'BOT_COOLDOWN_STORE',
      useFactory: (
        config: ConfigService,
        redis: RedisService,
      ): BotCooldownStore => {
        const useMemory = config.get<string>('BOT_COOLDOWN_STORE') === 'memory';
        return useMemory
          ? new MemoryBotCooldownStore()
          : new RedisBotCooldownStore(redis);
      },
      inject: [ConfigService, RedisService],
    },
    BotsService,
  ],
  exports: [BotsService],
})
export class BotsModule {}
