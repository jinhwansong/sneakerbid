import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { EventsModule } from '@/events/events.module';
import { WalletModule } from '@/wallet/wallet.module';
import { WishlistModule } from '@/wishlist/wishlist.module';

@Module({
  imports: [EventsModule, WalletModule, WishlistModule],
  providers: [AuctionsService],
  controllers: [AuctionsController],
  exports: [AuctionsService],
})
export class AuctionsModule {}
