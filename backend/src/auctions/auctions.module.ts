import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { EventsModule } from '@/events/events.module';
import { WalletModule } from '@/wallet/wallet.module';

@Module({
  imports: [EventsModule, WalletModule],
  providers: [AuctionsService],
  controllers: [AuctionsController],
  exports: [AuctionsService],
})
export class AuctionsModule {}
