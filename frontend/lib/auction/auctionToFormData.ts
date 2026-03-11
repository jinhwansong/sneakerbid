import type { AuctionItem, GetAuctionResponse } from '@/types/auction';

const VALID_STATUSES = [
  'ongoing',
  'ending_soon',
  'closed',
  'failed',
  'buy_now',
] as const;

/**
 * AuctionItem → GetAuctionResponse 변환 (AuctionForm initialData용)
 * 필수 필드 검증 후 기본값 적용. 검증 실패 시 null 반환.
 */
export function toFormInitialData(
  item: AuctionItem | null | undefined,
): GetAuctionResponse | null {
  if (!item?.id || !item?.modelName || !item?.brand || !item?.imageUrl) {
    return null;
  }

  const status = VALID_STATUSES.includes(item.status as (typeof VALID_STATUSES)[number])
    ? (item.status as GetAuctionResponse['status'])
    : 'ongoing';

  return {
    ...item,
    id: item.id,
    modelName: item.modelName,
    brand: item.brand,
    imageUrl: item.imageUrl,
    startPrice: item.startPrice ?? item.currentBid ?? 0,
    currentBid: item.currentBid ?? 0,
    priceIncreasePercent: item.priceIncreasePercent ?? '0',
    participants: item.participants ?? 0,
    endTime: item.endTime ?? '',
    status,
  };
}
