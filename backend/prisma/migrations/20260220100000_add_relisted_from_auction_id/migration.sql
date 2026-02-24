-- AlterTable
ALTER TABLE "Auction" ADD COLUMN "relistedFromAuctionId" TEXT;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_relistedFromAuctionId_fkey" FOREIGN KEY ("relistedFromAuctionId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
