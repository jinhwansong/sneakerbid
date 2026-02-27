/*
  Warnings:

  - You are about to drop the column `sizeOptions` on the `Sneaker` table. All the data in the column will be lost.
  - Added the required column `sellerUserId` to the `Auction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "sellerUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sneaker" DROP COLUMN "sizeOptions";

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
