import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Fetcher } from '@/lib/util/fetcher';

describe('Fetcher', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('성공 시 JSON 데이터를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: '1' } }),
      text: () => Promise.resolve(''),
    } as Response);

    const result = await Fetcher<{ id: string }>('https://api.example.com/test');
    expect(result).toEqual({ id: '1' });
  });

  it('success 래퍼 없이 직접 데이터면 그대로 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1' }),
      text: () => Promise.resolve(''),
    } as Response);

    const result = await Fetcher<{ id: string }>('https://api.example.com/test');
    expect(result).toEqual({ id: '1' });
  });

  it('에러 시 사용자 친화 메시지로 throw한다', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      text: () =>
        Promise.resolve(
          JSON.stringify({ success: false, data: '요청한 항목을 찾을 수 없습니다.' })
        ),
    } as Response);

    await expect(Fetcher('https://api.example.com/test')).rejects.toThrow(
      /찾을 수 없습니다/
    );
  });

  it('fetch 자체가 실패하면 에러를 throw한다', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch'));

    await expect(Fetcher('https://api.example.com/test')).rejects.toThrow(
      'Failed to fetch'
    );
  });

  it('401 시 _skipRefreshRetry면 refresh 없이 에러를 throw한다', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
    } as Response);

    await expect(
      Fetcher('https://api.example.com/test', { _skipRefreshRetry: true })
    ).rejects.toThrow(/로그인/);
  });
});
