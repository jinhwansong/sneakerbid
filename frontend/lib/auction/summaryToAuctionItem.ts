import type { AuctionSummary, AuctionItem } from '@/types/auction';

/** AuctionSummary → AuctionItem 변환 (공통) */
export function summaryToAuctionItem(s: AuctionSummary): AuctionItem {
  const msUntilEnd =
    typeof s.endTime === 'string'
      ? new Date(s.endTime).getTime() - Date.now()
      : (s.endTime as Date).getTime() - Date.now();
  const status =
    s.status === 'CLOSED'
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
