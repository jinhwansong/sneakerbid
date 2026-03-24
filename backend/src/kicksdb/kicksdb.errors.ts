/** KicksDB HTTP 오류 (429 제외 시 즉시 throw) */
export class KicksDBApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = 'KicksDBApiError';
  }
}

/** 429 재시도 소진 후에도 실패 */
export class KicksDBRateLimitError extends KicksDBApiError {
  constructor(responseBody?: string) {
    super('KicksDB rate limit (429)', 429, responseBody);
    this.name = 'KicksDBRateLimitError';
  }
}
