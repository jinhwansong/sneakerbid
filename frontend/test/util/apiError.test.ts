import { describe, it, expect } from 'vitest';
import { toUserFriendlyMessage } from '../../lib/util/apiError';

describe('toUserFriendlyMessage', () => {
  it('한글 메시지는 그대로 반환한다', () => {
    expect(toUserFriendlyMessage({ message: '입찰가가 최소 금액보다 낮습니다.' })).toBe(
      '입찰가가 최소 금액보다 낮습니다.'
    );
  });

  it('기술적 영문 메시지를 한글로 매핑한다', () => {
    expect(toUserFriendlyMessage({ message: 'Unauthorized' })).toBe('로그인이 필요합니다.');
    expect(toUserFriendlyMessage({ message: 'Forbidden' })).toBe('접근 권한이 없습니다.');
    expect(toUserFriendlyMessage({ message: 'Not Found' })).toBe('요청한 항목을 찾을 수 없습니다.');
    expect(toUserFriendlyMessage({ message: 'Bad Request' })).toBe('잘못된 요청입니다.');
    expect(toUserFriendlyMessage({ message: 'Conflict' })).toBe('이미 처리된 요청입니다.');
    expect(toUserFriendlyMessage({ message: 'Failed to fetch' })).toBe(
      '네트워크 연결을 확인해 주세요.'
    );
  });

  it('status 코드로 폴백 메시지를 반환한다', () => {
    expect(toUserFriendlyMessage({ message: 'Unknown', status: 401 })).toBe('로그인이 필요합니다.');
    expect(toUserFriendlyMessage({ message: 'Unknown', status: 404 })).toBe(
      '요청한 항목을 찾을 수 없습니다.'
    );
    expect(toUserFriendlyMessage({ message: 'Unknown', status: 500 })).toBe(
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    );
  });

  it('fallback을 지정할 수 있다', () => {
    expect(toUserFriendlyMessage({ message: '' }, '커스텀 메시지')).toBe('커스텀 메시지');
  });

  it('message가 없으면 fallback을 반환한다', () => {
    expect(toUserFriendlyMessage({ message: '' })).toBe(
      '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    );
  });
});
