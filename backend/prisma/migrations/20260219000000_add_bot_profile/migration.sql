-- CreateTable
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
    "chatStyle" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bot_userId_key" ON "Bot"("userId");

-- CreateIndex
CREATE INDEX "Bot_type_idx" ON "Bot"("type");

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
