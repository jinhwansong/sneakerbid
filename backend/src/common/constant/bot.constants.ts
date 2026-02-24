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

/** 입찰 턴당 시도할 (경매, 봇) 쌍 수 - 병렬 처리 */
export const BIDS_PER_TURN = 30;

/** 각 입찰 시도 간 랜덤 지연 최대값 (ms) - 봇들이 동시에 움직이지 않도록 분산 */
export const BID_STAGGER_MS = 18_000;
