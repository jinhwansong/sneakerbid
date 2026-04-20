import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { WishlistAlertsService } from './wishlist-alerts.service';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [WishlistService, WishlistAlertsService],
  controllers: [WishlistController],
  exports: [WishlistService],
})
export class WishlistModule {}
