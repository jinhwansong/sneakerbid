import type { AuctionSummary, AuctionItem } from '@/types/auction';

/** 백엔드 터미널 상태: 시간과 무관하게 해당 값 반환, time-based 로직 적용 안 함 */
const TERMINAL_STATUS_MAP: Record<string, AuctionItem['status']> = {
  CLOSED: 'closed',
  FAILED: 'failed',
  BUY_NOW: 'buy_now',
};

/** AuctionSummary → AuctionItem 변환 (공통) */
export function summaryToAuctionItem(s: AuctionSummary): AuctionItem {
  const terminalStatus = TERMINAL_STATUS_MAP[s.status];
  if (terminalStatus) {
    return buildItem(s, terminalStatus);
  }
  const msUntilEnd =
    typeof s.endTime === 'string'
      ? new Date(s.endTime).getTime() - Date.now()
      : (s.endTime as Date).getTime() - Date.now();
  const status: AuctionItem['status'] =
    msUntilEnd <= 0 ? 'closed' : msUntilEnd <= 60 * 1000 ? 'ending_soon' : 'ongoing';
  return buildItem(s, status);
}

function buildItem(s: AuctionSummary, status: AuctionItem['status']): AuctionItem {
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
    minimumIncrement: s.minimumIncrement,
  };
}
