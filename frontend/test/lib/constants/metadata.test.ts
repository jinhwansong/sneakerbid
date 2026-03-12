import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMetadata } from '@/lib/constants/metadata';

describe('createMetadata', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('title에 사이트명을 붙인다', () => {
    const meta = createMetadata({ title: '로그인' });
    expect(meta.title).toBe('로그인 | LaceUp');
  });

  it('description 기본값을 적용한다', () => {
    const meta = createMetadata({ title: '홈' });
    expect(meta.description).toContain('실시간 스니커즈 경매');
  });

  it('path로 openGraph url을 설정한다', () => {
    const meta = createMetadata({ title: '테스트', path: '/auction' });
    expect(meta.openGraph?.url).toBe('https://example.com/auction');
  });

  it('path가 없으면 baseUrl만 사용한다', () => {
    const meta = createMetadata({ title: '홈' });
    expect(meta.openGraph?.url).toBe('https://example.com');
  });

  it('image가 상대 경로면 baseUrl을 붙인다', () => {
    const meta = createMetadata({ title: '홈', image: '/og.png' });
    expect(meta.openGraph?.images?.[0]?.url).toBe('https://example.com/og.png');
  });
});
