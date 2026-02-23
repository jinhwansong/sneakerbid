import type { BotCooldownStore } from './cooldown.store';

interface Entry {
  value: string;
  expiresAt: number;
}

/** In-memory 쿨다운 저장소 (local/dev, 테스트용) */
export class MemoryBotCooldownStore implements BotCooldownStore {
  private readonly store = new Map<string, Entry>();

  get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return Promise.resolve(null);
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.value);
  }

  set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds
      ? Date.now() + ttlSeconds * 1000
      : Number.POSITIVE_INFINITY;
    this.store.set(key, { value, expiresAt });
    return Promise.resolve();
  }
}
