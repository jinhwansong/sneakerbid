import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationRepository } from '@/database/repositories/notification.repository';
import { RedisService } from '@/redis/redis.service';
import { REDIS_CHANNEL_SSE_NOTIFICATIONS } from '@/common/constants/events.constants';
import type { RequestUser } from '@/common/decorator/user.decorator';

export type NotificationDto = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  metadata: unknown | null;
  createdAt: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationRepository,
    private readonly redis: RedisService,
  ) {}

  private toDto(row: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    readAt: Date | null;
    metadata: unknown | null;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(
    user: RequestUser,
    limit = 30,
    cursor?: string,
  ): Promise<{ items: NotificationDto[]; nextCursor: string | null }> {
    const cap = Math.min(100, Math.max(1, limit));
    const rows = await this.repo.listForUser(user.id, cap + 1, cursor);
    const hasMore = rows.length > cap;
    const slice = hasMore ? rows.slice(0, cap) : rows;
    const nextCursor =
      hasMore && slice.length > 0 ? slice[slice.length - 1].id : null;
    return {
      items: slice.map((r) => this.toDto(r)),
      nextCursor,
    };
  }

  async unreadCount(user: RequestUser): Promise<{ count: number }> {
    const count = await this.repo.countUnread(user.id);
    return { count };
  }

  async markRead(user: RequestUser, id: string): Promise<{ ok: boolean }> {
    const ok = await this.repo.markRead(user.id, id);
    if (!ok) throw new NotFoundException('알림을 찾을 수 없습니다.');
    return { ok: true };
  }

  async markAllRead(user: RequestUser): Promise<{ updated: number }> {
    const updated = await this.repo.markAllRead(user.id);
    return { updated };
  }

  /** 입찰 추월 — 이전 최고 입찰자에게 */
  async notifyBidOvertaken(
    userId: string,
    auctionId: string,
  ): Promise<void> {
    await this.createAndPublish({
      userId,
      type: 'BID_OVERTAKEN',
      title: '입찰이 추월되었습니다',
      body: '다른 참가자가 더 높은 금액으로 입찰했습니다.',
      metadata: { auctionId },
    });
  }

  /** 낙찰 — 낙찰자에게 */
  async notifyAuctionWon(
    userId: string,
    auctionId: string,
    finalPrice: number,
  ): Promise<void> {
    await this.createAndPublish({
      userId,
      type: 'AUCTION_WON',
      title: '경매에 낙찰되었습니다',
      body: `낙찰가 ${finalPrice.toLocaleString('ko-KR')}원입니다. 결제를 진행해 주세요.`,
      metadata: { auctionId, finalPrice },
    });
  }

  /** 찜한 경매 마감 임박 (스팸 방지: 동일 경매 24시간 내 1회) */
  async notifyWishlistEndingSoon(
    userId: string,
    auctionId: string,
    titleHint: string,
    endTimeIso: string,
  ): Promise<void> {
    const dup = await this.repo.existsRecentForAuctionType(
      userId,
      'WISHLIST_ENDING_SOON',
      auctionId,
      24 * 60,
    );
    if (dup) return;
    await this.createAndPublish({
      userId,
      type: 'WISHLIST_ENDING_SOON',
      title: '찜한 경매가 곧 마감됩니다',
      body: `${titleHint} — 마감 ${new Date(endTimeIso).toLocaleString('ko-KR')}`,
      metadata: { auctionId, endTime: endTimeIso },
    });
  }

  /** 찜한 경매에 새 입찰 (가격 변동 알림 — 60분당 1회) */
  async notifyWishlistBidActivity(
    userId: string,
    auctionId: string,
    brand: string,
    modelName: string,
    currentPrice: number,
  ): Promise<void> {
    const dup = await this.repo.existsRecentForAuctionType(
      userId,
      'WISHLIST_BID_ACTIVITY',
      auctionId,
      60,
    );
    if (dup) return;
    await this.createAndPublish({
      userId,
      type: 'WISHLIST_BID_ACTIVITY',
      title: '찜한 경매가격이 변동했습니다',
      body: `${brand} ${modelName} — 현재가 ${currentPrice.toLocaleString('ko-KR')}원`,
      metadata: { auctionId, currentPrice },
    });
  }

  private async createAndPublish(params: {
    userId: string;
    type: string;
    title: string;
    body: string | null;
    metadata: Record<string, unknown> | null;
  }): Promise<void> {
    const id = randomUUID();
    await this.repo.insert({
      id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata,
    });
    const payload = {
      id,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
    };
    void this.redis
      .publish(
        REDIS_CHANNEL_SSE_NOTIFICATIONS,
        JSON.stringify({ userId: params.userId, payload }),
      )
      .catch((err) =>
        this.logger.warn('Redis publish notification failed', {
          err: err as Error,
        }),
      );
  }
}
