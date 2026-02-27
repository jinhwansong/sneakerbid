import { Injectable, OnModuleInit } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import type Redis from 'ioredis';
import type {
  AuctionClosedPayload,
  NewBidPayload,
} from '../common/type/events.types';
import type { AuctionHistoryItem } from '../common/type/auction.type';
import {
  ALLOWED_AUCTION_EVENT_TYPES,
  HEARTBEAT_INTERVAL_MS,
  REDIS_CHANNEL_SSE_AUCTION,
  REDIS_CHANNEL_SSE_HISTORY,
} from '@/common/constants/events.constants';
import { RedisService } from '@/redis/redis.service';

@Injectable()
export class EventsService implements OnModuleInit {
  /** auctionId → Subject (해당 경매 구독자들에게 이벤트 전송) */
  private readonly auctionSubjects = new Map<string, Subject<MessageEvent>>();

  /** auctionId → 구독자 수 (0이 되면 Subject 정리) */
  private readonly auctionSubjectRefCounts = new Map<string, number>();

  /** 거래내역 구독자 (새 체결 시 브로드캐스트) */
  private readonly historySubject = new Subject<MessageEvent>();

  constructor(private readonly redis: RedisService) {}

  onModuleInit(): void {
    const sub: Redis = this.redis.getSubscriber();
    void sub
      .subscribe(REDIS_CHANNEL_SSE_AUCTION, REDIS_CHANNEL_SSE_HISTORY)
      .catch(() => {});
    sub.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message) as Record<string, unknown>;
        if (channel === REDIS_CHANNEL_SSE_AUCTION && data.auctionId) {
          const rawType = data.type as string | undefined;
          const eventType =
            typeof rawType === 'string' &&
            ALLOWED_AUCTION_EVENT_TYPES.has(rawType)
              ? rawType
              : 'newBid';
          this.emitToAuctionLocal(data.auctionId as string, {
            type: eventType,
            payload: data.payload,
          });
        } else if (channel === REDIS_CHANNEL_SSE_HISTORY && data.payload) {
          this.historySubject.next({
            data: {
              type: 'newDeal',
              payload: data.payload as AuctionHistoryItem,
            } as { type: string; payload: AuctionHistoryItem },
          } as MessageEvent);
        }
      } catch {
        // 잘못된 메시지 무시
      }
    });
  }

  /** 경매 실시간 스트림 구독 (구독자 0이 되면 Subject 정리) */
  streamAuction(auctionId: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const subject = this.getOrCreateSubject(auctionId);
      this.incrementRefCount(auctionId);

      const heartbeat = interval(HEARTBEAT_INTERVAL_MS).pipe(
        map(() => ({ data: { type: 'ping' } }) as MessageEvent),
      );
      const sub = merge(subject.asObservable(), heartbeat).subscribe(
        subscriber,
      );

      return () => {
        sub.unsubscribe();
        this.decrementRefCountAndCleanup(auctionId);
      };
    });
  }

  /** 거래내역 실시간 스트림 구독 (새 체결 시 newDeal 이벤트) */
  streamHistory(): Observable<MessageEvent> {
    const heartbeat = interval(HEARTBEAT_INTERVAL_MS).pipe(
      map(() => ({ data: { type: 'ping' } }) as MessageEvent),
    );
    return merge(this.historySubject.asObservable(), heartbeat);
  }

  /** 새 체결 이벤트 브로드캐스트 (경매 종료 시 호출) — Redis로 발행, 모든 인스턴스가 구독 */
  emitNewDeal(payload: AuctionHistoryItem): void {
    void this.redis
      .publish(
        REDIS_CHANNEL_SSE_HISTORY,
        JSON.stringify({ type: 'newDeal', payload }),
      )
      .catch(() => {});
  }

  /** 새 입찰 이벤트 브로드캐스트 */
  emitNewBid(auctionId: string, payload: NewBidPayload): void {
    void this.redis
      .publish(
        REDIS_CHANNEL_SSE_AUCTION,
        JSON.stringify({ auctionId, type: 'newBid', payload }),
      )
      .catch(() => {});
  }

  /** 경매 종료 이벤트 브로드캐스트 */
  emitAuctionClosed(auctionId: string, payload: AuctionClosedPayload): void {
    void this.redis
      .publish(
        REDIS_CHANNEL_SSE_AUCTION,
        JSON.stringify({ auctionId, type: 'auctionClosed', payload }),
      )
      .catch(() => {});
  }

  /** Redis 수신 메시지를 로컬 경매 Subject에만 전달 (다중 인스턴스 동기화용) */
  private emitToAuctionLocal(auctionId: string, data: object): void {
    const subject = this.auctionSubjects.get(auctionId);
    if (subject) {
      subject.next({ data } as MessageEvent);
    }
  }

  private getOrCreateSubject(auctionId: string): Subject<MessageEvent> {
    let subject = this.auctionSubjects.get(auctionId);
    if (!subject) {
      subject = new Subject<MessageEvent>();
      this.auctionSubjects.set(auctionId, subject);
    }
    return subject;
  }

  private incrementRefCount(auctionId: string): void {
    const count = this.auctionSubjectRefCounts.get(auctionId) ?? 0;
    this.auctionSubjectRefCounts.set(auctionId, count + 1);
  }

  private decrementRefCountAndCleanup(auctionId: string): void {
    const count = this.auctionSubjectRefCounts.get(auctionId) ?? 0;
    const next = Math.max(0, count - 1);
    if (next === 0) {
      this.auctionSubjectRefCounts.delete(auctionId);
      const subject = this.auctionSubjects.get(auctionId);
      if (subject) {
        subject.complete();
        this.auctionSubjects.delete(auctionId);
      }
    } else {
      this.auctionSubjectRefCounts.set(auctionId, next);
    }
  }
}
