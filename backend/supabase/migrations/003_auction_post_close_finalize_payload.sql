-- Prerequisites: 같은 DB에서 먼저 001_init.sql → 002_add_bot_enabled.sql 을 적용해야 함.
-- ERROR: relation "Auction" does not exist → 빈 DB이거나 Supabase 프로젝트/연결 문자열이 잘못됨. 001부터 실행.
--
-- Post-close finalize 재시도용 (경매 종료 커밋 후 지갑/이벤트 실패 시 JSON 저장)
ALTER TABLE "Auction"
  ADD COLUMN IF NOT EXISTS "postCloseFinalizePayload" JSONB NULL;

COMMENT ON COLUMN "Auction"."postCloseFinalizePayload" IS 'When set, post-commit finalize (wallet releases + events) must still run; cleared on success or auction reopen';

CREATE INDEX IF NOT EXISTS "Auction_postCloseFinalize_pending_idx"
  ON "Auction" ("updatedAt")
  WHERE "postCloseFinalizePayload" IS NOT NULL;
