-- Persist pending post-close finalize work (release holds + events) across process restarts
ALTER TABLE "Auction"
  ADD COLUMN IF NOT EXISTS "postCloseFinalizePayload" JSONB NULL;

COMMENT ON COLUMN "Auction"."postCloseFinalizePayload" IS 'When set, post-commit finalize (wallet releases + events) must still run; cleared on success or auction reopen';

CREATE INDEX IF NOT EXISTS "Auction_postCloseFinalize_pending_idx"
  ON "Auction" ("updatedAt")
  WHERE "postCloseFinalizePayload" IS NOT NULL;
