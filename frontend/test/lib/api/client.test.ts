import { describe, it, expect } from 'vitest';
import { buildQuery } from '@/lib/api/client';

describe('buildQuery', () => {
  it('params를 URL search string으로 변환한다', () => {
    expect(buildQuery({ a: '1', b: '2' })).toBe('a=1&b=2');
  });

  it('숫자를 문자열로 변환한다', () => {
    expect(buildQuery({ limit: 10, page: 1 })).toBe('limit=10&page=1');
  });

  it('undefined, null은 제외한다', () => {
    expect(buildQuery({ a: '1', b: undefined, c: null })).toBe('a=1');
  });

  it('빈 객체면 빈 문자열을 반환한다', () => {
    expect(buildQuery({})).toBe('');
  });

  it('모두 undefined/null이면 빈 문자열을 반환한다', () => {
    expect(buildQuery({ a: undefined, b: null })).toBe('');
  });
});
