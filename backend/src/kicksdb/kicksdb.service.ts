import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KICKS_BACKOFF_BASE_MS,
  KICKS_BACKOFF_JITTER_MS,
  KICKS_SEARCH_MAX_RETRIES,
} from './kicksdb.constants';
import { KicksDBApiError, KicksDBRateLimitError } from './kicksdb.errors';
import type { KicksDBListResponse } from './kicksdb.types';

const KICKS_API_BASE = 'https://api.kicks.dev/v3/stockx';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface KicksDBSearchOptions {
  /** 429 시 최대 재시도 횟수 (기본: KICKS_SEARCH_MAX_RETRIES) */
  maxRetries?: number;
}

@Injectable()
export class KicksDBService {
  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string | undefined {
    return this.config.get<string>('KICKS_API_KEY');
  }

  get isEnabled(): boolean {
    return !!this.apiKey?.trim();
  }

  /**
   * 상품 검색 (query별 1회, per_page개 반환).
   * 429는 지수 백오프+지터로 재시도, 그 외 HTTP 오류는 즉시 throw.
   */
  async searchProducts(
    query: string,
    perPage = 20,
    options?: KicksDBSearchOptions,
  ): Promise<KicksDBListResponse['data']> {
    const key = this.apiKey;
    if (!key) {
      throw new Error('KICKS_API_KEY is not configured');
    }

    const maxRetries = options?.maxRetries ?? KICKS_SEARCH_MAX_RETRIES;
    const url = new URL(`${KICKS_API_BASE}/products`);
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(perPage));

    let lastBody = '';
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const body = (await res.json()) as KicksDBListResponse;
        return body.data ?? [];
      }

      lastBody = await res.text();

      if (res.status !== 429) {
        throw new KicksDBApiError(
          `KicksDB API error ${res.status}`,
          res.status,
          lastBody,
        );
      }

      if (attempt === maxRetries) {
        throw new KicksDBRateLimitError(lastBody);
      }

      const backoff =
        KICKS_BACKOFF_BASE_MS * 2 ** attempt +
        Math.random() * KICKS_BACKOFF_JITTER_MS;
      await sleep(backoff);
    }
  }
}
