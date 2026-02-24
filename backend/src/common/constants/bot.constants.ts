/** 봇별 일일 지급 범위 (타입별) - 단위: 원 */
export const DAILY_TOPUP_RANGE_BY_TYPE: Record<string, [number, number]> = {
  AGGRESSIVE: [80_000, 150_000],
  CALCULATED: [50_000, 120_000],
  TROLL: [20_000, 60_000],
  EMOTIONAL: [40_000, 100_000],
  FOLLOWER: [50_000, 110_000],
};

export const DEFAULT_TOPUP_RANGE: [number, number] = [30_000, 80_000];
