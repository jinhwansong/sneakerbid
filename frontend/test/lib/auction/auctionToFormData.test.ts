import { describe, it, expect } from 'vitest';
import { toFormInitialData } from '@/lib/auction/auctionToFormData';
import type { AuctionItem } from '@/types/auction';

describe('toFormInitialData', () => {
  const validItem: AuctionItem = {
    id: 'auction-1',
    modelName: 'Nike Dunk',
    brand: 'Nike',
    imageUrl: 'https://example.com/img.png',
    startPrice: 50000,
    currentBid: 100000,
    endTime: '2024-12-31T23:59:59Z',
    participants: 5,
    status: 'ongoing',
    description: '상태 좋음',
    size: 270,
  };

  it('필수 필드가 있으면 폼 초기값을 반환한다', () => {
    const result = toFormInitialData(validItem);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('auction-1');
    expect(result?.modelName).toBe('Nike Dunk');
    expect(result?.brand).toBe('Nike');
    expect(result?.imageUrl).toBe('https://example.com/img.png');
    expect(result?.startPrice).toBe(50000);
    expect(result?.endTime).toBe('2024-12-31T23:59:59Z');
    expect(result?.size).toBe(270);
    expect(result?.description).toBe('상태 좋음');
  });

  it('null, undefined면 null을 반환한다', () => {
    expect(toFormInitialData(null)).toBeNull();
    expect(toFormInitialData(undefined)).toBeNull();
  });

  it('id가 없으면 null을 반환한다', () => {
    expect(toFormInitialData({ ...validItem, id: '' })).toBeNull();
  });

  it('modelName이 없으면 null을 반환한다', () => {
    expect(toFormInitialData({ ...validItem, modelName: '' })).toBeNull();
  });

  it('description이 undefined면 null을 반환한다', () => {
    const { description, ...rest } = validItem;
    expect(toFormInitialData({ ...rest, description: undefined })).toBeNull();
  });

  it('startPrice가 null이면 null을 반환한다', () => {
    expect(toFormInitialData({ ...validItem, startPrice: null! })).toBeNull();
  });

  it('endTime이 없으면 null을 반환한다', () => {
    expect(toFormInitialData({ ...validItem, endTime: '' })).toBeNull();
  });

  it('size가 null이면 null을 반환한다', () => {
    expect(toFormInitialData({ ...validItem, size: null! })).toBeNull();
  });

  it('유효하지 않은 status면 ongoing으로 기본값 적용한다', () => {
    const result = toFormInitialData({
      ...validItem,
      status: 'invalid' as AuctionItem['status'],
    });
    expect(result?.status).toBe('ongoing');
  });
});
