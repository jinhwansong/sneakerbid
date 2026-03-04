import type { AuctionSummary, AuctionItem } from '@/types/auction';

/** 백엔드 터미널 상태 키 */
type TerminalStatusKey = 'CLOSED' | 'FAILED' | 'BUY_NOW';

/** 백엔드 터미널 상태 → 프론트엔드 status 매핑 (시간과 무관하게 해당 값 반환) */
const TERMINAL_STATUS_MAP: Record<TerminalStatusKey, AuctionItem['status']> = {
  CLOSED: 'closed',
  FAILED: 'failed',
  BUY_NOW: 'buy_now',
};

function isTerminalStatus(s: string): s is TerminalStatusKey {
  return s in TERMINAL_STATUS_MAP;
}

/** AuctionSummary → AuctionItem 변환 (공통) */
export function summaryToAuctionItem(s: AuctionSummary): AuctionItem {
  if (isTerminalStatus(s.status)) {
    return buildItem(s, TERMINAL_STATUS_MAP[s.status]);
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
