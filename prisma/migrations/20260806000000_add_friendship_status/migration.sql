-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
-- 既存行は検証用に手で入れたものなので、承認済みとして扱う
ALTER TABLE "friendships"
  ADD COLUMN "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "respondedAt" TIMESTAMP(3);

UPDATE "friendships" SET "status" = 'ACCEPTED', "respondedAt" = "createdAt";

-- CreateIndex
CREATE INDEX "friendships_friendUserId_status_idx" ON "friendships"("friendUserId", "status");
