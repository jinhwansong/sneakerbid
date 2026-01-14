
type FetcherOptions = RequestInit & {
  json?: boolean;
};

export async function Fetcher<T>(
  input: RequestInfo,
  options?: FetcherOptions
): Promise<T> {
  try {
    const res = await fetch(input, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const message = await res.text().catch(() => '');
      const error = new Error(message || 'api 요청실패');

     

      throw error;
    }

    return options?.json === false
      ? (res as unknown as T)
      : (res.json() as Promise<T>);
  } catch (error) {
    // 네트워크 에러 등 예기치 못한 에러 보고
    
    throw error;
  }
}
