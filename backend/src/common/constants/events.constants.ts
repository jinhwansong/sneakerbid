export const HEARTBEAT_INTERVAL_MS = 15000;

/** Redis Pub/Sub 채널 (다중 인스턴스 SSE 브로드캐스트용) */
export const REDIS_CHANNEL_SSE_AUCTION = 'sse:auction';
export const REDIS_CHANNEL_SSE_HISTORY = 'sse:history';
