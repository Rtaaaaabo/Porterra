import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PostDetail,
  PostFeedItem,
  PostMapPoint,
  VisibilitySelectableUser,
} from "@/lib/types";
import type { PostVisibilityValue } from "@/lib/post-visibility";

function buildPostVisibilityWhere(
  viewerUserId?: string,
): Prisma.PostWhereInput {
  if (!viewerUserId) {
    return { visibility: "PUBLIC" };
  }

  return {
    OR: [
      { userId: viewerUserId },
      { visibility: "PUBLIC" },
      {
        visibility: "CUSTOM",
        visibilityAccesses: {
          some: {
            userId: viewerUserId,
          },
        },
      },
      {
        visibility: "FRIENDS",
        user: {
          OR: [
            {
              friendships: {
                some: {
                  friendUserId: viewerUserId,
                },
              },
            },
            {
              friendedBy: {
                some: {
                  userId: viewerUserId,
                },
              },
            },
          ],
        },
      },
    ],
  };
}

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

export async function listUsersForVisibilitySelector(
  currentUserId: string,
): Promise<VisibilitySelectableUser[]> {
  const users = await prisma.user.findMany({
    where: {
      id: {
        not: currentUserId,
      },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return users;
}

export async function createPostWithSpotAndImages(input: {
  title: string;
  body: string;
  userId: string;
  visibility: PostVisibilityValue;
  visibleToUserIds: string[];
  spot: {
    name: string;
    prefecture: string;
    country: string;
    lat: number | null;
    lng: number | null;
  };
  imageUrls: string[];
}): Promise<{ id: string }> {
  const visibleToUserIds = [...new Set(input.visibleToUserIds)]
    .filter(Boolean)
    .filter((id) => id !== input.userId);

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
        visibility: input.visibility,
      },
    });

    await tx.postImage.createMany({
      data: input.imageUrls.map((imageUrl) => ({
        postId: createdPost.id,
        imageUrl,
      })),
    });

    if (input.visibility === "CUSTOM" && visibleToUserIds.length > 0) {
      await tx.postVisibilityAccess.createMany({
        data: visibleToUserIds.map((userId) => ({
          postId: createdPost.id,
          userId,
        })),
      });
    }

    return createdPost;
  });

  return { id: post.id };
}

export async function getPostFeed(viewerUserId?: string): Promise<PostFeedItem[]> {
  const posts = await prisma.post.findMany({
    where: buildPostVisibilityWhere(viewerUserId),
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
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    authorName: post.user.name,
    spotName: post.spot.name,
    prefecture: post.spot.prefecture,
    country: post.spot.country,
    lat: post.spot.lat,
    lng: post.spot.lng,
    imageUrls: post.images.map((img) => img.imageUrl),
    likeCount: post._count.likes,
  }));
}

export async function getPostDetail(
  postId: string,
  viewerUserId?: string,
): Promise<PostDetail | null> {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      ...buildPostVisibilityWhere(viewerUserId),
    },
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
    visibility: post.visibility,
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
    hasLiked: viewerUserId
      ? post.likes.some((like) => like.userId === viewerUserId)
      : false,
  };
}

export async function getEditablePostByIdForUser(
  postId: string,
  userId: string,
): Promise<{
  id: string;
  title: string;
  body: string;
  visibility: PostVisibilityValue;
  visibleToUserIds: string[];
} | null> {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId,
    },
    select: {
      id: true,
      title: true,
      body: true,
      visibility: true,
      visibilityAccesses: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!post) {
    return null;
  }

  return {
    id: post.id,
    title: post.title,
    body: post.body,
    visibility: post.visibility,
    visibleToUserIds: post.visibilityAccesses.map((access) => access.userId),
  };
}

export async function updatePostByIdForUser(input: {
  postId: string;
  userId: string;
  title: string;
  body: string;
  visibility: PostVisibilityValue;
  visibleToUserIds: string[];
}): Promise<boolean> {
  const existing = await prisma.post.findFirst({
    where: {
      id: input.postId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return false;
  }

  const visibleToUserIds = [...new Set(input.visibleToUserIds)]
    .filter(Boolean)
    .filter((id) => id !== input.userId);

  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: {
        id: input.postId,
      },
      data: {
        title: input.title,
        body: input.body,
        visibility: input.visibility,
      },
    });

    await tx.postVisibilityAccess.deleteMany({
      where: {
        postId: input.postId,
      },
    });

    if (input.visibility === "CUSTOM" && visibleToUserIds.length > 0) {
      await tx.postVisibilityAccess.createMany({
        data: visibleToUserIds.map((userId) => ({
          postId: input.postId,
          userId,
        })),
      });
    }
  });

  return true;
}

export async function deletePostByIdForUser(
  postId: string,
  userId: string,
): Promise<boolean> {
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

export async function getPostMapPoints(
  viewerUserId?: string,
): Promise<PostMapPoint[]> {
  const posts = await prisma.post.findMany({
    where: {
      AND: [
        buildPostVisibilityWhere(viewerUserId),
        {
          spot: {
            lat: { not: null },
            lng: { not: null },
          },
        },
      ],
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
    visibility: post.visibility,
    authorName: post.user.name,
    spotName: post.spot.name,
    prefecture: post.spot.prefecture,
    country: post.spot.country,
    lat: post.spot.lat as number,
    lng: post.spot.lng as number,
    createdAt: post.createdAt.toISOString(),
  }));
}

export async function toggleLike(
  postId: string,
  userId: string,
): Promise<void> {
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
