/** 봇별 일일 지급 범위 (타입별) - 단위: 원 */
export const DAILY_TOPUP_RANGE_BY_TYPE: Record<string, [number, number]> = {
  AGGRESSIVE: [80_000, 150_000],
  CALCULATED: [50_000, 120_000],
  TROLL: [20_000, 60_000],
  EMOTIONAL: [40_000, 100_000],
  FOLLOWER: [50_000, 110_000],
};

export const DEFAULT_RANGE: [number, number] = [30_000, 80_000];

/** 같은 경매에 같은 봇이 연속 입찰 시 최소 간격 (ms) */
export const BOT_COOLDOWN_MS = 25_000;

/** 경매 단위 쿨다운: 어떤 봇이든 입찰 후 N초 동안 해당 경매에 입찰 불가 (다중 봇 집중 방지) */
export const AUCTION_COOLDOWN_SEC = 8;

/** 입찰 턴당 시도할 (경매, 봇) 쌍 수 - 병렬 처리 (봇 10개 기준) */
export const BIDS_PER_TURN = 8;

/** 각 입찰 시도 간 랜덤 지연 최대값 (ms) - 봇들이 동시에 움직이지 않도록 분산 */
export const BID_STAGGER_MS = 18_000;

/** 봇 낙찰 후 재등록: 종료 시각 이후 최소 N초 지난 뒤에만 INSERT (정산·finalize 여유) */
export const RELIST_DELAY_MIN_SEC = 10;

/** 재등록 후보 조회: 최근 N일 이내 종료된 경매만 (누락된 재등록 보정 + 스캔 범위 제한) */
export const RELIST_LOOKBACK_DAYS = 30;

/** relistBotWonAuctions 실행 주기 (초) */
export const RELIST_CHECK_INTERVAL_SEC = 60;

/** 재등록 시 새 경매 유지 시간 (초) */
export const RELIST_AUCTION_DURATION_SEC = 3600; // 1시간

/** 봇 판매자(재판매) OPEN 경매 조회 상한 */
export const BOT_SELLER_AUCTION_LIMIT = 20;

/** 봇 입찰 후보로 합친 경매 최대 개수 (메인 + 봇 판매자) */
export const MERGED_AUCTIONS_FOR_BOTS = 28;
