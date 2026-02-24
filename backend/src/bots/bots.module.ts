import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { AuctionsModule } from '@/auctions/auctions.module';
import { RedisService } from '@/redis/redis.service';
import type { BotCooldownStore } from './cooldown.store';
import { RedisBotCooldownStore } from './redis-cooldown.store';

@Module({
  imports: [AuctionsModule],
  providers: [
    {
      provide: 'BOT_COOLDOWN_STORE',
      useFactory: async (redis: RedisService): Promise<BotCooldownStore> => {
        await redis.ping();
        return new RedisBotCooldownStore(redis);
      },
      inject: [RedisService],
    },
    BotsService,
  ],
  exports: [BotsService],
})
export class BotsModule {}
