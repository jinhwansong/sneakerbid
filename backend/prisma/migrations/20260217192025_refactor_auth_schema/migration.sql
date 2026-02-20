-- AlterTable: Add email (nullable) to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- CreateTable: SocialAccount (replaces OAuthAccount with provider-based auth)
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- Migrate data from OAuthAccount to SocialAccount
INSERT INTO "SocialAccount" ("id", "provider", "providerId", "userId", "createdAt")
SELECT "id", "provider", "providerAccountId", "userId", "createdAt"
FROM "OAuthAccount";

-- Backfill User.email from OAuthAccount (first non-null email per user)
UPDATE "User" u
SET "email" = sub."email"
FROM (
    SELECT DISTINCT ON ("userId") "userId", "email"
    FROM "OAuthAccount"
    WHERE "email" IS NOT NULL
    ORDER BY "userId", "createdAt" ASC
) sub
WHERE u."id" = sub."userId";

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_provider_providerId_key" ON "SocialAccount"("provider", "providerId");
CREATE INDEX "SocialAccount_userId_idx" ON "SocialAccount"("userId");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop OAuthAccount
DROP TABLE "OAuthAccount";
