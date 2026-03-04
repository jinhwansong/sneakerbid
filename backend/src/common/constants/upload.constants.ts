/** 허용 이미지 MIME 타입 */
export const UPLOAD_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** 최대 파일 크기 (5MB) */
export const UPLOAD_MAX_FILE_SIZE = 5 * 1024 * 1024;
