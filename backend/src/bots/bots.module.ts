import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { AuctionsModule } from '@/auctions/auctions.module';

@Module({
  imports: [AuctionsModule],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
