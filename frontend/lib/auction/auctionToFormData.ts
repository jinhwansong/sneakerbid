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
 * 수정 폼에 필요한 모든 필드가 있어야 함 (기본값 채우기로 덮어쓰기 방지).
 */
export function toFormInitialData(
  item: AuctionItem | null | undefined,
): GetAuctionResponse | null {
  if (
    !item?.id ||
    !item?.modelName ||
    !item?.brand ||
    !item?.imageUrl ||
    item.description === undefined ||
    item.startPrice == null ||
    !item?.endTime ||
    item.size == null
  ) {
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
    startPrice: item.startPrice,
    currentBid: item.currentBid,
    priceIncreasePercent: item.priceIncreasePercent ?? '0',
    participants: item.participants,
    endTime: item.endTime,
    status,
  };
}
