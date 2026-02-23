import type { BotCooldownStore } from './cooldown.store';

interface Entry {
  value: string;
  expiresAt: number;
}

const DEFAULT_CLEANUP_INTERVAL_MS = 60_000;

/** In-memory 쿨다운 저장소 (local/dev, 테스트용) */
export class MemoryBotCooldownStore implements BotCooldownStore {
  private readonly store = new Map<string, Entry>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup(DEFAULT_CLEANUP_INTERVAL_MS);
  }

  /** 만료된 항목 주기적 삭제 (process shutdown 전 stop() 호출 권장) */
  startCleanup(intervalMs: number): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now >= entry.expiresAt) this.store.delete(key);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

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

  delete(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }
}
