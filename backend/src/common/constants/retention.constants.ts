/** 한 번에 삭제할 경매 id 개수 (대량 시 잠금 완화) */
export const DATA_RETENTION_BATCH_SIZE = 200;

/** 매일 03:15 KST — 오래된 종료 경매·관련 행 정리 */
export const DATA_RETENTION_CRON = '15 3 * * *';
