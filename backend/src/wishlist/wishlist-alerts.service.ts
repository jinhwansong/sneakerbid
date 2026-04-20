import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuctionRepository } from '@/database/repositories/auction.repository';
import { WishlistReadRepository } from '@/database/repositories/wishlist-read.repository';
import { NotificationsService } from '@/notifications/notifications.service';

/** 찜한 경매 마감 임박 알림 (5분마다, 15분 이내 마감) */
@Injectable()
export class WishlistAlertsService {
  private readonly logger = new Logger(WishlistAlertsService.name);

  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly wishlistReadRepo: WishlistReadRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('*/5 * * * *', { timeZone: 'Asia/Seoul' })
  async notifyEndingSoon(): Promise<void> {
    const now = new Date();
    const until = new Date(now.getTime() + 15 * 60 * 1000);
    const auctions = await this.auctionRepo.findOpenEndingBefore(until, now);
    for (const a of auctions) {
      const row = await this.auctionRepo.findByIdWithSneaker(a.id);
      if (!row) continue;
      const titleHint = `${row.sneaker_brand} ${row.sneaker_modelName}`;
      const endIso = new Date(row.endTime).toISOString();
      const userIds = await this.wishlistReadRepo.findUserIdsByAuctionId(a.id);
      for (const uid of userIds) {
        void this.notificationsService
          .notifyWishlistEndingSoon(uid, a.id, titleHint, endIso)
          .catch((err: unknown) =>
            this.logger.warn('notifyWishlistEndingSoon failed', {
              err: err instanceof Error ? err.message : String(err),
            }),
          );
      }
    }
  }
}
