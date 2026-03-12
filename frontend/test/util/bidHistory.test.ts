import { describe, it, expect } from 'vitest';
import { sortBidHistory } from '@/lib/util/bidHistory';
import type { BidLogItem } from '@/types/auction';

describe('sortBidHistory', () => {
  it('금액 내림차순으로 정렬한다', () => {
    const items: BidLogItem[] = [
      { id: '1', user: 'a', amount: 100, time: '1분 전' },
      { id: '2', user: 'b', amount: 200, time: '2분 전' },
      { id: '3', user: 'c', amount: 150, time: '3분 전' },
    ];
    expect(sortBidHistory(items)).toEqual([
      { id: '2', user: 'b', amount: 200, time: '2분 전' },
      { id: '3', user: 'c', amount: 150, time: '3분 전' },
      { id: '1', user: 'a', amount: 100, time: '1분 전' },
    ]);
  });

  it('금액이 같으면 "방금 전"이 앞으로 간다', () => {
    const items: BidLogItem[] = [
      { id: '1', user: 'a', amount: 100, time: '방금 전' },
      { id: '2', user: 'b', amount: 100, time: '1분 전' },
    ];
    const result = sortBidHistory(items);
    expect(result[0].time).toBe('방금 전');
    expect(result[1].time).toBe('1분 전');
  });

  it('금액·시간 같으면 id 숫자 내림차순으로 정렬한다', () => {
    const items: BidLogItem[] = [
      { id: 'bid-10', user: 'a', amount: 100, time: '1분 전' },
      { id: 'bid-5', user: 'b', amount: 100, time: '1분 전' },
      { id: 'bid-20', user: 'c', amount: 100, time: '1분 전' },
    ];
    const result = sortBidHistory(items);
    expect(result[0].id).toBe('bid-20');
    expect(result[1].id).toBe('bid-10');
    expect(result[2].id).toBe('bid-5');
  });

  it('원본 배열을 변경하지 않는다', () => {
    const items: BidLogItem[] = [
      { id: '1', user: 'a', amount: 200, time: '1분 전' },
      { id: '2', user: 'b', amount: 100, time: '2분 전' },
    ];
    const original = [...items];
    sortBidHistory(items);
    expect(items).toEqual(original);
  });
});
