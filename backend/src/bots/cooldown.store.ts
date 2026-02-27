/** 봇 입찰 쿨다운 저장소 인터페이스 (Redis / InMemory) */
export interface BotCooldownStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** 쿨다운 즉시 해제 (입찰 실패 시 호출) */
  delete(key: string): Promise<void>;
  /**
   * 원자적 쿨다운 획득. bot+auction 두 키를 SETNX로 설정.
   * 둘 다 성공 시 true, 하나라도 실패 시 롤백 후 false.
   */
  acquireCooldown(
    auctionId: string,
    botId: string,
    botTtlSeconds: number,
    auctionTtlSeconds: number,
  ): Promise<boolean>;
}

/** 연속 입찰 방지를 위한 쿨다운 키 */
const COOLDOWN_KEY_PREFIX = 'bot:cooldown:';
const AUCTION_COOLDOWN_PREFIX = 'bot:auction:';

export function cooldownKey(auctionId: string, botId: string): string {
  return `${COOLDOWN_KEY_PREFIX}${auctionId}:${botId}`;
}

/** 경매 단위 쿨다운 키 (어떤 봇이든 입찰 후 해당 경매 전체 쿨다운) */
export function auctionCooldownKey(auctionId: string): string {
  return `${AUCTION_COOLDOWN_PREFIX}${auctionId}`;
}
