import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatPrice,
  formatRemainingTime,
  formatTime,
  formatJoinDate,
  formatCountdown,
} from '../../lib/util/format';

describe('formatPrice', () => {
  it('숫자를 한국 원화 형식으로 포맷팅한다', () => {
    expect(formatPrice(580000)).toBe('580,000');
    expect(formatPrice(0)).toBe('0');
    expect(formatPrice(1234567)).toBe('1,234,567');
  });
});

describe('formatRemainingTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('남은 시간을 HH:MM:SS 형식으로 반환한다', () => {
    const base = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(base);

    const endTime = new Date('2024-01-15T14:30:45Z').toISOString();
    expect(formatRemainingTime(endTime)).toBe('02:30:45');
  });

  it('이미 지난 시간이면 00:00:00을 반환한다', () => {
    const base = new Date('2024-01-15T15:00:00Z');
    vi.setSystemTime(base);

    const endTime = new Date('2024-01-15T14:00:00Z').toISOString();
    expect(formatRemainingTime(endTime)).toBe('00:00:00');
  });
});

describe('formatTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('현재 시각을 HH:MM:SS 형식으로 반환한다', () => {
    vi.setSystemTime(new Date('2024-01-15T09:05:03Z'));
    const result = formatTime();
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

describe('formatJoinDate', () => {
  it('날짜를 한국어 날짜 형식으로 변환한다', () => {
    expect(formatJoinDate(new Date(2024, 0, 15))).toMatch(/2024년.*1월.*15일/);
  });

  it('Date 객체를 받아 포맷팅한다', () => {
    expect(formatJoinDate(new Date(2024, 0, 15))).toMatch(/2024년.*1월.*15일/);
  });

  it('undefined, null, 빈 문자열이면 "-"를 반환한다', () => {
    expect(formatJoinDate(undefined)).toBe('-');
    expect(formatJoinDate('')).toBe('-');
  });

  it('유효하지 않은 날짜면 "-"를 반환한다', () => {
    expect(formatJoinDate('invalid')).toBe('-');
  });
});

describe('formatCountdown', () => {
  it('초를 HH:MM:SS 형식으로 변환한다', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(3661)).toBe('01:01:01');
    expect(formatCountdown(7325)).toBe('02:02:05');
  });
});
