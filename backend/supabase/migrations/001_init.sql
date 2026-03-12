-- =============================================================================
-- Full schema from Prisma (User, SocialAccount, Sneaker, Auction, Bid, Order,
-- WalletTransaction, Wishlist, Bot)
-- =============================================================================

-- Enums
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'BOT');
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'KAKAO');
CREATE TYPE "AuctionStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');
CREATE TYPE "BidSourceType" AS ENUM ('USER', 'BOT');
CREATE TYPE "WalletTxType" AS ENUM ('BID_HOLD', 'BID_RELEASE', 'PAYMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "WalletRefType" AS ENUM ('AUCTION', 'ORDER', 'BID', 'SYSTEM');

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "profileImageUrl" TEXT,
    "nickname" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- SocialAccount
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SocialAccount_provider_providerId_key" ON "SocialAccount"("provider", "providerId");
CREATE INDEX "SocialAccount_userId_idx" ON "SocialAccount"("userId");
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sneaker
CREATE TABLE "Sneaker" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "colorway" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "styleCode" TEXT,
    "releaseYear" INTEGER,
    "condition" TEXT,
    "origin" TEXT,
    "boxIncluded" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sneaker_pkey" PRIMARY KEY ("id")
);

-- Auction
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "sneakerId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "startPrice" INTEGER NOT NULL,
    "currentPrice" INTEGER NOT NULL,
    "buyNowPrice" INTEGER,
    "minimumIncrement" INTEGER NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'OPEN',
    "endTime" TIMESTAMP(3) NOT NULL,
    "winnerUserId" TEXT,
    "closedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "lastExtendedAt" TIMESTAMP(3),
    "extendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sellerUserId" TEXT NOT NULL,
    "relistedFromAuctionId" TEXT,
    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Auction_minimum_increment_chk" CHECK ("minimumIncrement" > 0),
    CONSTRAINT "Auction_price_consistency_chk" CHECK ("currentPrice" >= "startPrice"),
    CONSTRAINT "Auction_buy_now_chk" CHECK ("buyNowPrice" IS NULL OR "buyNowPrice" >= "currentPrice"),
    CONSTRAINT "Auction_counters_nonnegative_chk" CHECK ("extendCount" >= 0 AND "version" >= 0),
    CONSTRAINT "Auction_relist_self_chk" CHECK ("relistedFromAuctionId" IS NULL OR "relistedFromAuctionId" <> "id")
);
CREATE INDEX "Auction_status_endTime_idx" ON "Auction"("status", "endTime");
CREATE INDEX "Auction_sneakerId_size_status_idx" ON "Auction"("sneakerId", "size", "status");
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_sneakerId_fkey" FOREIGN KEY ("sneakerId") REFERENCES "Sneaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_relistedFromAuctionId_fkey" FOREIGN KEY ("relistedFromAuctionId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "idx_auction_winner_user_id" ON "Auction"("winnerUserId");
CREATE INDEX "idx_auction_seller_user_id" ON "Auction"("sellerUserId");
CREATE INDEX "idx_auction_relisted_from_auction_id" ON "Auction"("relistedFromAuctionId");

-- Bid
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidPrice" INTEGER NOT NULL,
    "sourceType" "BidSourceType" NOT NULL DEFAULT 'USER',
    "strategyType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disqualifiedAt" TIMESTAMP(3),
    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Bid_bidPrice_positive" CHECK ("bidPrice" > 0)
);
CREATE INDEX "Bid_auctionId_createdAt_idx" ON "Bid"("auctionId", "createdAt" DESC);
CREATE INDEX "Bid_auctionId_bidPrice_idx" ON "Bid"("auctionId", "bidPrice" DESC);
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "idx_bid_user_id" ON "Bid"("userId");

-- Order
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_auctionId_key" ON "Order"("auctionId");
CREATE INDEX "Order_buyerUserId_idx" ON "Order"("buyerUserId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- WalletTransaction
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "refType" "WalletRefType" NOT NULL,
    "refId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");
CREATE INDEX "WalletTransaction_refType_refId_idx" ON "WalletTransaction"("refType", "refId");
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Wishlist
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Wishlist_userId_auctionId_key" ON "Wishlist"("userId", "auctionId");
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");
CREATE INDEX "Wishlist_auctionId_idx" ON "Wishlist"("auctionId");
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bot
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "riskTolerance" INTEGER NOT NULL,
    "bidUnit" INTEGER NOT NULL,
    "maxBidMultiplier" DOUBLE PRECISION NOT NULL,
    "activityStartHour" INTEGER NOT NULL,
    "activityEndHour" INTEGER NOT NULL,
    "favoriteBrands" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Bot_activity_hours_valid" CHECK (
        "activityStartHour" >= 0 AND "activityStartHour" <= 23
        AND "activityEndHour" >= 0 AND "activityEndHour" <= 23
    )
);
CREATE UNIQUE INDEX "Bot_userId_key" ON "Bot"("userId");
CREATE INDEX "Bot_type_idx" ON "Bot"("type");
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- updatedAt auto-update triggers
CREATE OR REPLACE FUNCTION set_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updatedAt_User
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION set_updated_timestamp();

CREATE TRIGGER trg_set_updatedAt_Sneaker
  BEFORE UPDATE ON "Sneaker"
  FOR EACH ROW EXECUTE FUNCTION set_updated_timestamp();

CREATE TRIGGER trg_set_updatedAt_Auction
  BEFORE UPDATE ON "Auction"
  FOR EACH ROW EXECUTE FUNCTION set_updated_timestamp();

CREATE TRIGGER trg_set_updatedAt_Bot
  BEFORE UPDATE ON "Bot"
  FOR EACH ROW EXECUTE FUNCTION set_updated_timestamp();
