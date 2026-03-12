import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { summaryToAuctionItem } from '@/lib/auction/summaryToAuctionItem';
import type { AuctionSummary } from '@/types/auction';

describe('summaryToAuctionItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseSummary: AuctionSummary = {
    auctionId: 'auction-1',
    sneakerName: 'Nike Dunk',
    brand: 'Nike',
    imageUrl: 'https://example.com/img.png',
    size: '270',
    currentPrice: 100000,
    endTime: '2024-12-31T23:59:59Z',
    status: 'OPEN',
    bidCount: 5,
    buyNowPrice: 150000,
    minimumIncrement: 5000,
  };

  it('OPEN 상태면 ongoing으로 변환한다', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const result = summaryToAuctionItem({ ...baseSummary, status: 'OPEN' });
    expect(result.status).toBe('ongoing');
    expect(result.id).toBe('auction-1');
    expect(result.modelName).toBe('Nike Dunk');
    expect(result.currentBid).toBe(100000);
  });

  it('CLOSED 상태면 closed로 변환한다', () => {
    const result = summaryToAuctionItem({ ...baseSummary, status: 'CLOSED' });
    expect(result.status).toBe('closed');
  });

  it('FAILED 상태면 failed로 변환한다', () => {
    const result = summaryToAuctionItem({ ...baseSummary, status: 'FAILED' });
    expect(result.status).toBe('failed');
  });

  it('BUY_NOW 상태면 buy_now로 변환한다', () => {
    const result = summaryToAuctionItem({ ...baseSummary, status: 'BUY_NOW' });
    expect(result.status).toBe('buy_now');
  });

  it('종료 1분 이내면 ending_soon으로 변환한다', () => {
    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + 30);
    vi.setSystemTime(new Date());
    const result = summaryToAuctionItem({
      ...baseSummary,
      status: 'OPEN',
      endTime: endTime.toISOString(),
    });
    expect(result.status).toBe('ending_soon');
  });

  it('종료 시간이 지났으면 closed로 변환한다', () => {
    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() - 10);
    vi.setSystemTime(new Date());
    const result = summaryToAuctionItem({
      ...baseSummary,
      status: 'OPEN',
      endTime: endTime.toISOString(),
    });
    expect(result.status).toBe('closed');
  });

  it('size를 숫자로 변환한다', () => {
    const result = summaryToAuctionItem(baseSummary);
    expect(result.size).toBe(270);
  });
});
