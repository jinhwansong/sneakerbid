import { Injectable } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import type { NewBidPayload } from '../common/type/events.types';
import type { AuctionHistoryItem } from '../common/type/auction.type';
import { HEARTBEAT_INTERVAL_MS } from '@/common/constants/events.constants';

@Injectable()
export class EventsService {
  /** auctionId → Subject (해당 경매 구독자들에게 이벤트 전송) */
  private readonly auctionSubjects = new Map<string, Subject<MessageEvent>>();

  /** 거래내역 구독자 (새 체결 시 브로드캐스트) */
  private readonly historySubject = new Subject<MessageEvent>();

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

  /** 새 체결 이벤트 브로드캐스트 (경매 종료 시 호출) */
  emitNewDeal(payload: AuctionHistoryItem): void {
    this.historySubject.next({
      data: {
        type: 'newDeal',
        payload,
      } as { type: string; payload: AuctionHistoryItem },
    } as MessageEvent);
  }

  /** 새 입찰 이벤트 브로드캐스트 */
  emitNewBid(auctionId: string, payload: NewBidPayload): void {
    this.emitToAuction(auctionId, { type: 'newBid', payload });
  }

  /** 경매 room에 이벤트 전송 */
  emitToAuction(auctionId: string, data: object): void {
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
