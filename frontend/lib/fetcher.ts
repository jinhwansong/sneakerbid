import { API_BASE_URL } from './config';

type FetcherOptions = RequestInit & {
  json?: boolean;
  /** 내부용: 401 시 refresh 재시도 스킵 (무한 루프 방지) */
  _skipRefreshRetry?: boolean;
};

async function doFetch<T>(
  input: RequestInfo,
  options?: FetcherOptions,
): Promise<{ res: Response; data?: T }> {
  // _skipRefreshRetry는 fetch 옵션에서 제외하기 위해 destructure (실제 fetch에는 전달 안 함)
  const { _skipRefreshRetry: _omit, ...fetchOpts } = options ?? {};
  void _omit;
  const res = await fetch(input, {
    credentials: 'include',
    ...fetchOpts,
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOpts.headers ?? {}),
    },
  });
  if (res.ok) {
    let data: T;
    if (options?.json === false) {
      data = res as unknown as T;
    } else {
      const body = (await res.json()) as unknown;
      // 백엔드 TransformInterceptor: { success: true, data } → 실제 payload만 반환
      data = (
        body &&
        typeof body === 'object' &&
        'success' in body &&
        (body as { success?: boolean }).success === true &&
        'data' in body
          ? (body as { data: T }).data
          : body
      ) as T;
    }
    return { res, data };
  }
  return { res };
}

/** 401이면 refresh 호출 후 요청 한 번 재시도. refresh도 401이면 그대로 throw */
export async function Fetcher<T>(
  input: RequestInfo,
  options?: FetcherOptions,
): Promise<T> {
  const _skipRefreshRetry = options?._skipRefreshRetry;
  const { res, data } = await doFetch<T>(input, options);

  if (res.ok && data !== undefined) {
    return data;
  }

  if (res.status === 401 && !_skipRefreshRetry) {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'GET',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      const retry = await doFetch<T>(input, {
        ...options,
        _skipRefreshRetry: true,
      });
      if (retry.res.ok && retry.data !== undefined) return retry.data;
    }
  }

  const message = await res.text().catch(() => '');
  throw new Error(message || 'api 요청 실패');
}
