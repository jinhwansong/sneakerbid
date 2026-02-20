import { Injectable } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import type { NewBidPayload } from '../common/type/events.types';

const HEARTBEAT_INTERVAL_MS = 15000;

@Injectable()
export class EventsService {
  /** auctionId → Subject (해당 경매 구독자들에게 이벤트 전송) */
  private readonly auctionSubjects = new Map<string, Subject<MessageEvent>>();

  /** 경매 실시간 스트림 구독 */
  streamAuction(auctionId: string): Observable<MessageEvent> {
    const subject = this.getOrCreateSubject(auctionId);
    const heartbeat = interval(HEARTBEAT_INTERVAL_MS).pipe(
      map(() => ({ data: { type: 'ping' } }) as MessageEvent),
    );
    return merge(subject.asObservable(), heartbeat);
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
