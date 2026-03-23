import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { KicksDBListResponse } from './kicksdb.types';

const KICKS_API_BASE = 'https://api.kicks.dev/v3/stockx';

@Injectable()
export class KicksDBService {
  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string | undefined {
    return this.config.get<string>('KICKS_API_KEY');
  }

  get isEnabled(): boolean {
    return !!this.apiKey?.trim();
  }

  /** 상품 검색 (query별 1회, per_page개 반환) */
  async searchProducts(
    query: string,
    perPage = 20,
  ): Promise<KicksDBListResponse['data']> {
    const key = this.apiKey;
    if (!key) {
      throw new Error('KICKS_API_KEY is not configured');
    }

    const url = new URL(`${KICKS_API_BASE}/products`);
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(perPage));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`KicksDB API error ${res.status}: ${text}`);
    }

    const body = (await res.json()) as KicksDBListResponse;
    return body.data ?? [];
  }
}
