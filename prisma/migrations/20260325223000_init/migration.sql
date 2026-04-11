CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "spots" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "prefecture" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "spots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "posts" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "spotId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "posts_userId_idx" ON "posts"("userId");
CREATE INDEX "posts_spotId_idx" ON "posts"("spotId");

CREATE TABLE "post_images" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "post_images_postId_idx" ON "post_images"("postId");

CREATE TABLE "likes" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "likes_postId_userId_key" ON "likes"("postId", "userId");
CREATE INDEX "likes_postId_idx" ON "likes"("postId");
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

ALTER TABLE "posts"
ADD CONSTRAINT "posts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts"
ADD CONSTRAINT "posts_spotId_fkey"
FOREIGN KEY ("spotId") REFERENCES "spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_images"
ADD CONSTRAINT "post_images_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "likes"
ADD CONSTRAINT "likes_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "likes"
ADD CONSTRAINT "likes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
