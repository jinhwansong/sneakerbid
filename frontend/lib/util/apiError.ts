/** HTTP 상태 코드별 기본 사용자 친화 메시지 */
const STATUS_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다.',
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 항목을 찾을 수 없습니다.',
  409: '이미 처리된 요청입니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

/** 기술적/영문 에러 문자열 → 사용자 친화 메시지 매핑 */
const TECHNICAL_MESSAGE_MAP: Record<string, string> = {
  Unauthorized: '로그인이 필요합니다.',
  'Unauthorized Exception': '로그인이 필요합니다.',
  Forbidden: '접근 권한이 없습니다.',
  'Forbidden Exception': '접근 권한이 없습니다.',
  'Not Found': '요청한 항목을 찾을 수 없습니다.',
  'Not Found Exception': '요청한 항목을 찾을 수 없습니다.',
  'Bad Request': '잘못된 요청입니다.',
  'Conflict': '이미 처리된 요청입니다.',
  'Internal Server Error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  'Failed to fetch': '네트워크 연결을 확인해 주세요.',
  'Network request failed': '네트워크 연결을 확인해 주세요.',
};

/** 한글 또는 사용자 친화적 메시지인지 판단 (간단 휴리스틱) */
function isUserFriendlyMessage(msg: string): boolean {
  if (!msg || msg.length < 2) return false;
  // 한글이 포함되어 있으면 백엔드에서 온 친화적 메시지로 간주
  if (/[\uac00-\ud7af]/.test(msg)) return true;
  // 짧은 영문 메시지(기술적)가 아니면 유지 (예: "Minimum bid is 50,000원")
  if (msg.length > 40 && !TECHNICAL_MESSAGE_MAP[msg]) return true;
  return false;
}

export interface ApiErrorLike {
  message?: string;
  status?: number;
}

/**
 * API 에러를 사용자 친화적인 한글 메시지로 변환.
 * - 백엔드에서 이미 한글 메시지를 보냈으면 그대로 사용
 * - 기술적/영문 메시지는 매핑 테이블로 변환
 * - status 코드로 폴백
 */
export function toUserFriendlyMessage(
  error: unknown,
  fallback = '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  const msg =
    (error && typeof error === 'object' && 'message' in error
      ? String((error as ApiErrorLike).message)
      : String(error ?? '')) || '';
  const status =
    error && typeof error === 'object' && 'status' in error
      ? (error as ApiErrorLike).status
      : undefined;

  const trimmed = msg.trim();
  if (isUserFriendlyMessage(trimmed)) return trimmed;
  if (TECHNICAL_MESSAGE_MAP[trimmed]) return TECHNICAL_MESSAGE_MAP[trimmed];
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (trimmed) return trimmed;
  return fallback;
}
