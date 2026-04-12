-- AlterTable: add city to spots
ALTER TABLE "spots" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';

-- AlterTable: add takenYear to posts
ALTER TABLE "posts" ADD COLUMN "takenYear" INTEGER;
