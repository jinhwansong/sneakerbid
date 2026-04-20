import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EventsModule } from '@/events/events.module';
import { AuctionsModule } from '@/auctions/auctions.module';
import { WalletModule } from '@/wallet/wallet.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { ReviewsModule } from '@/reviews/reviews.module';

@Module({
  imports: [
    EventsModule,
    AuctionsModule,
    WalletModule,
    NotificationsModule,
    ReviewsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
