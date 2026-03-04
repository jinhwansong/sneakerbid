import type { AuctionSummary, AuctionItem } from '@/types/auction';

/** 백엔드 터미널 상태: 이 상태면 시간과 무관하게 closed */
const TERMINAL_STATUSES = new Set<string>(['CLOSED']);

/** AuctionSummary → AuctionItem 변환 (공통) */
export function summaryToAuctionItem(s: AuctionSummary): AuctionItem {
  const msUntilEnd =
    typeof s.endTime === 'string'
      ? new Date(s.endTime).getTime() - Date.now()
      : (s.endTime as Date).getTime() - Date.now();
  const status = TERMINAL_STATUSES.has(s.status)
    ? 'closed'
    : msUntilEnd <= 0
      ? 'closed'
      : msUntilEnd <= 60 * 1000
        ? 'ending_soon'
        : 'ongoing';

  return {
    id: s.auctionId,
    modelName: s.sneakerName,
    brand: s.brand,
    imageUrl: s.imageUrl,
    currentBid: s.currentPrice,
    buyNowPrice: s.buyNowPrice ?? undefined,
    endTime: typeof s.endTime === 'string' ? s.endTime : (s.endTime as Date).toISOString(),
    participants: s.bidCount ?? 0,
    status,
    size: s.size ? Number(s.size) : undefined,
    winnerUserId: s.winnerUserId,
  };
}
