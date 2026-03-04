import { Fetcher } from '@/lib/util/fetcher';

const baseUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? '';

function resolveUrl(path: string, query?: string): string {
  const base = baseUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return query ? `${base}${p}?${query}` : `${base}${p}`;
}

/** 쿼리 파라미터 객체를 URL search string으로 변환 (undefined/null 제외) */
export function buildQuery(
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }
  return search.toString();
}

async function request<T>(
  path: string,
  init?: RequestInit & {
    query?: Record<string, string | number | undefined | null>;
  },
): Promise<T> {
  const query = init?.query ? buildQuery(init.query) : '';
  const { query: _q, ...rest } = init ?? {};
  const url = resolveUrl(path, query || undefined);
  return Fetcher<T>(url, rest);
}

/** API 클라이언트 — 도메인 모듈에서만 사용 */
export const apiClient = {
  getBaseUrl: baseUrl,

  get<T>(
    path: string,
    query?: Record<string, string | number | undefined | null>,
  ): Promise<T> {
    return request<T>(path, { method: 'GET', query });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
    });
  },

  /** FormData 업로드 (multipart/form-data). Content-Type은 자동 설정됨 */
  postForm<T>(path: string, formData: FormData): Promise<T> {
    const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    return Fetcher<T>(url, {
      method: 'POST',
      body: formData,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body != null ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
