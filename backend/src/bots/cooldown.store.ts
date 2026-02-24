/** 봇 입찰 쿨다운 저장소 인터페이스 (Redis / InMemory) */
export interface BotCooldownStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** 쿨다운 즉시 해제 (입찰 실패 시 호출) */
  delete(key: string): Promise<void>;
}

/** 연속 입찰 x를 위한 쿨다운 키 */
const COOLDOWN_KEY_PREFIX = 'bot:cooldown:';

export function cooldownKey(auctionId: string, botId: string): string {
  return `${COOLDOWN_KEY_PREFIX}${auctionId}:${botId}`;
}
