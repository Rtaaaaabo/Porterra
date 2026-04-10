CREATE TYPE "PostVisibility" AS ENUM ('CUSTOM', 'FRIENDS', 'PUBLIC');

ALTER TABLE "posts"
ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';

CREATE TABLE "post_visibility_accesses" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_visibility_accesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_visibility_accesses_postId_userId_key" ON "post_visibility_accesses"("postId", "userId");
CREATE INDEX "post_visibility_accesses_postId_idx" ON "post_visibility_accesses"("postId");
CREATE INDEX "post_visibility_accesses_userId_idx" ON "post_visibility_accesses"("userId");

ALTER TABLE "post_visibility_accesses"
ADD CONSTRAINT "post_visibility_accesses_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_visibility_accesses"
ADD CONSTRAINT "post_visibility_accesses_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "friendships" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "friendUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "friendships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "friendships_userId_friendUserId_different" CHECK ("userId" <> "friendUserId")
);

CREATE UNIQUE INDEX "friendships_userId_friendUserId_key" ON "friendships"("userId", "friendUserId");
CREATE INDEX "friendships_userId_idx" ON "friendships"("userId");
CREATE INDEX "friendships_friendUserId_idx" ON "friendships"("friendUserId");

ALTER TABLE "friendships"
ADD CONSTRAINT "friendships_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friendships"
ADD CONSTRAINT "friendships_friendUserId_fkey"
FOREIGN KEY ("friendUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
