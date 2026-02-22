import type { MeResponse } from '@/types/auth';

const ME_CACHE_KEY = 'me_cache';

export function getMeCache(): MeResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || !('id' in parsed) || !('nickname' in parsed))
      return null;
    return parsed as MeResponse;
  } catch {
    return null;
  }
}

export function setMeCache(data: MeResponse): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ME_CACHE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded 등
  }
}

export function clearMeCache(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ME_CACHE_KEY);
}
