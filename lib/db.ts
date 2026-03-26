import { prisma } from "@/lib/prisma";
import type { PostDetail, PostFeedItem, PostMapPoint } from "@/lib/types";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    },
  });
}

export async function createPostWithSpotAndImages(input: {
  title: string;
  body: string;
  userId: string;
  spot: {
    name: string;
    prefecture: string;
    country: string;
    lat: number | null;
    lng: number | null;
  };
  imageUrls: string[];
}): Promise<{ id: string }> {
  const post = await prisma.$transaction(async (tx) => {
    const spot = await tx.spot.create({
      data: {
        name: input.spot.name,
        prefecture: input.spot.prefecture,
        country: input.spot.country,
        lat: input.spot.lat,
        lng: input.spot.lng,
      },
    });

    const createdPost = await tx.post.create({
      data: {
        title: input.title,
        body: input.body,
        userId: input.userId,
        spotId: spot.id,
      },
    });

    await tx.postImage.createMany({
      data: input.imageUrls.map((imageUrl) => ({
        postId: createdPost.id,
        imageUrl,
      })),
    });

    return createdPost;
  });

  return { id: post.id };
}

export async function getPostFeed(): Promise<PostFeedItem[]> {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      spot: true,
      images: { orderBy: { createdAt: "asc" } },
      _count: {
        select: { likes: true },
      },
    },
  });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    body: post.body,
    createdAt: post.createdAt.toISOString(),
    authorName: post.user.name,
    spotName: post.spot.name,
    prefecture: post.spot.prefecture,
    country: post.spot.country,
    imageUrls: post.images.map((img) => img.imageUrl),
    likeCount: post._count.likes,
  }));
}

export async function getPostDetail(postId: string, viewerUserId?: string): Promise<PostDetail | null> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: true,
      spot: true,
      images: { orderBy: { createdAt: "asc" } },
      likes: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!post) return null;

  return {
    id: post.id,
    title: post.title,
    body: post.body,
    createdAt: post.createdAt.toISOString(),
    authorId: post.userId,
    authorName: post.user.name,
    spotName: post.spot.name,
    prefecture: post.spot.prefecture,
    country: post.spot.country,
    lat: post.spot.lat,
    lng: post.spot.lng,
    imageUrls: post.images.map((img) => img.imageUrl),
    likeCount: post.likes.length,
    hasLiked: viewerUserId ? post.likes.some((like) => like.userId === viewerUserId) : false,
  };
}

export async function deletePostByIdForUser(postId: string, userId: string): Promise<boolean> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, spotId: true },
  });

  if (!post || post.userId !== userId) {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.delete({
      where: { id: postId },
    });

    await tx.spot.deleteMany({
      where: { id: post.spotId },
    });
  });

  return true;
}

export async function getPostMapPoints(): Promise<PostMapPoint[]> {
  const posts = await prisma.post.findMany({
    where: {
      spot: {
        lat: { not: null },
        lng: { not: null },
      },
    },
    include: {
      user: true,
      spot: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    authorName: post.user.name,
    spotName: post.spot.name,
    lat: post.spot.lat as number,
    lng: post.spot.lng as number,
    createdAt: post.createdAt.toISOString(),
  }));
}

export async function toggleLike(postId: string, userId: string): Promise<void> {
  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existing) {
    await prisma.like.delete({
      where: { id: existing.id },
    });
    return;
  }

  await prisma.like.create({
    data: {
      postId,
      userId,
    },
  });
}
