/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Redis/ioredis 타입 해석 이슈 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import type Redis from 'ioredis';
import type { NewBidPayload } from '../common/type/events.types';
import type { AuctionHistoryItem } from '../common/type/auction.type';
import {
  HEARTBEAT_INTERVAL_MS,
  REDIS_CHANNEL_SSE_AUCTION,
  REDIS_CHANNEL_SSE_HISTORY,
} from '@/common/constants/events.constants';
import { RedisService } from '@/redis/redis.service';

@Injectable()
export class EventsService implements OnModuleInit {
  /** auctionId → Subject (해당 경매 구독자들에게 이벤트 전송) */
  private readonly auctionSubjects = new Map<string, Subject<MessageEvent>>();

  /** 거래내역 구독자 (새 체결 시 브로드캐스트) */
  private readonly historySubject = new Subject<MessageEvent>();

  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly redis: RedisService) {}

  async onModuleInit(): Promise<void> {
    const sub: Redis = this.redis.getSubscriber();
    try {
      await sub.subscribe(REDIS_CHANNEL_SSE_AUCTION, REDIS_CHANNEL_SSE_HISTORY);
    } catch (err) {
      this.logger.error('Redis subscribe failed', err);
      throw err;
    }
    sub.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message) as Record<string, unknown>;
        if (
          channel === REDIS_CHANNEL_SSE_AUCTION &&
          data.auctionId &&
          data.payload
        ) {
          this.emitToAuctionLocal(data.auctionId as string, {
            type: 'newBid',
            payload: data.payload as NewBidPayload,
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

  /** 경매 실시간 스트림 구독 */
  streamAuction(auctionId: string): Observable<MessageEvent> {
    const subject = this.getOrCreateSubject(auctionId);
    const heartbeat = interval(HEARTBEAT_INTERVAL_MS).pipe(
      map(() => ({ data: { type: 'ping' } }) as MessageEvent),
    );
    return merge(subject.asObservable(), heartbeat);
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
      .catch((err) =>
        this.logger.warn('Redis publish newDeal failed', { err }),
      );
  }

  /** 새 입찰 이벤트 브로드캐스트 — Redis로 발행, 모든 인스턴스가 구독 */
  emitNewBid(auctionId: string, payload: NewBidPayload): void {
    void this.redis
      .publish(
        REDIS_CHANNEL_SSE_AUCTION,
        JSON.stringify({ auctionId, type: 'newBid', payload }),
      )
      .catch((err) =>
        this.logger.warn('Redis publish newBid failed', { auctionId, err }),
      );
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
}
