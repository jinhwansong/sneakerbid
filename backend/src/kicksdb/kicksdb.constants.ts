/** 429 시 추가 시도 횟수 (첫 요청 실패 후 재시도 횟수) */
export const KICKS_SEARCH_MAX_RETRIES = 4;

/** 지수 백오프 기본 간격 (ms) */
export const KICKS_BACKOFF_BASE_MS = 500;

/** 지수 백오프에 더할 지터 상한 (ms) */
export const KICKS_BACKOFF_JITTER_MS = 250;
