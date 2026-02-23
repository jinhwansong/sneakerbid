/** 봇 입찰 쿨다운 저장소 인터페이스 (Redis / InMemory) */
export interface BotCooldownStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
}

const COOLDOWN_KEY_PREFIX = 'bot:cooldown:';

export function cooldownKey(auctionId: string, botId: string): string {
  return `${COOLDOWN_KEY_PREFIX}${auctionId}:${botId}`;
}
