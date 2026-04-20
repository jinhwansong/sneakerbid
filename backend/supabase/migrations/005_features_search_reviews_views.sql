-- 경매 조회수, 거래 후 리뷰
ALTER TABLE "Auction" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Review_orderId_authorUserId_key" UNIQUE ("orderId", "authorUserId"),
  CONSTRAINT "Review_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5),
  CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Review_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Review_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Review_targetUserId_idx" ON "Review"("targetUserId");
CREATE INDEX IF NOT EXISTS "Review_orderId_idx" ON "Review"("orderId");
