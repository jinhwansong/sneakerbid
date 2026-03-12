import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/util/cn';

describe('cn', () => {
  it('여러 클래스를 합친다', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('조건부 클래스를 처리한다', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('tailwind 충돌 시 나중 클래스가 우선한다', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('빈 값은 무시한다', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });
});
