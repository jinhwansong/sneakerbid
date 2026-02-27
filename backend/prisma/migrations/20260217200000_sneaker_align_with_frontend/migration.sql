-- AlterTable: Sneaker 필드명을 AuctionDetailClient/AuctionItem과 일치시킴
ALTER TABLE "Sneaker" RENAME COLUMN "name" TO "modelName";
ALTER TABLE "Sneaker" RENAME COLUMN "color" TO "colorway";
ALTER TABLE "Sneaker" ALTER COLUMN "colorway" DROP NOT NULL;
