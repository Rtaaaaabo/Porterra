import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  FilterOptions,
  PostDetail,
  PostFeedItem,
  PostFilters,
  PostMapPoint,
  FriendsOverview,
  FriendUser,
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
          // 承認済みの関係だけを友達とみなす。PENDING では見えない。
          // 向きはどちらでもよい（A が申請して B が承認した関係は双方から見て友達）
          OR: [
            {
              friendships: {
                some: {
                  friendUserId: viewerUserId,
                  status: "ACCEPTED",
                },
              },
            },
            {
              friendedBy: {
                some: {
                  userId: viewerUserId,
                  status: "ACCEPTED",
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
  takenYear: number | null;
  spot: {
    name: string;
    city: string;
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
        city: input.spot.city,
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
        takenYear: input.takenYear,
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

function buildFilterConditions(filters?: PostFilters): Prisma.PostWhereInput[] {
  const conditions: Prisma.PostWhereInput[] = [];
  if (filters?.country) conditions.push({ spot: { country: filters.country } });
  if (filters?.prefecture) conditions.push({ spot: { prefecture: filters.prefecture } });
  if (filters?.city) conditions.push({ spot: { city: filters.city } });
  if (filters?.takenYear !== undefined) conditions.push({ takenYear: filters.takenYear });
  return conditions;
}

export async function getPostFeed(
  viewerUserId?: string,
  filters?: PostFilters,
): Promise<PostFeedItem[]> {
  const filterConditions = buildFilterConditions(filters);
  const where: Prisma.PostWhereInput =
    filterConditions.length > 0
      ? { AND: [buildPostVisibilityWhere(viewerUserId), ...filterConditions] }
      : buildPostVisibilityWhere(viewerUserId);

  const posts = await prisma.post.findMany({
    where,
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
    city: post.spot.city,
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
    city: post.spot.city,
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
  filters?: PostFilters,
): Promise<PostMapPoint[]> {
  const filterConditions = buildFilterConditions(filters);
  const posts = await prisma.post.findMany({
    where: {
      AND: [
        buildPostVisibilityWhere(viewerUserId),
        { spot: { lat: { not: null }, lng: { not: null } } },
        ...filterConditions,
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
    city: post.spot.city,
    prefecture: post.spot.prefecture,
    country: post.spot.country,
    lat: post.spot.lat as number,
    lng: post.spot.lng as number,
    createdAt: post.createdAt.toISOString(),
  }));
}

export async function getFilterOptions(
  viewerUserId?: string,
): Promise<FilterOptions> {
  const posts = await prisma.post.findMany({
    where: buildPostVisibilityWhere(viewerUserId),
    select: {
      takenYear: true,
      spot: {
        select: { country: true, prefecture: true, city: true },
      },
    },
  });

  const locationsMap = new Map<
    string,
    { country: string; prefecture: string; city: string }
  >();
  const yearsSet = new Set<number>();

  for (const post of posts) {
    const { country, prefecture, city } = post.spot;
    if (country) {
      const key = `${country}|${prefecture}|${city}`;
      if (!locationsMap.has(key)) {
        locationsMap.set(key, { country, prefecture, city });
      }
    }
    if (post.takenYear !== null) {
      yearsSet.add(post.takenYear);
    }
  }

  return {
    locations: Array.from(locationsMap.values()).sort(
      (a, b) =>
        a.country.localeCompare(b.country) ||
        a.prefecture.localeCompare(b.prefecture) ||
        a.city.localeCompare(b.city),
    ),
    years: Array.from(yearsSet).sort((a, b) => b - a),
  };
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

// --- 友達 ---

/** 権限エラーと区別せず「見つからない」に倒すためのエラー */
export class FriendshipError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

const friendUserSelect = { id: true, name: true, email: true } as const;

/**
 * 友達申請を送る。
 *
 * すれ違い（相手から自分あてに PENDING が来ている状態で申請した）場合は、
 * 新しい行を作らずにその申請を承認する。2行できるのを防ぐため。
 */
export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string,
): Promise<{ accepted: boolean }> {
  if (currentUserId === targetUserId) {
    throw new FriendshipError("cannot_friend_self", "自分自身には申請できません");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new FriendshipError("not_found", "ユーザーが見つかりません");
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: currentUserId, friendUserId: targetUserId },
        { userId: targetUserId, friendUserId: currentUserId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw new FriendshipError("already_related", "すでに友達です");
    }
    // 相手から届いていた申請なら、これを承認とみなす
    if (existing.friendUserId === currentUserId) {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      return { accepted: true };
    }
    throw new FriendshipError("already_related", "すでに申請しています");
  }

  await prisma.friendship.create({
    data: { userId: currentUserId, friendUserId: targetUserId },
  });
  return { accepted: false };
}

/**
 * 届いた申請を承認する。承認できるのは申請された側だけ。
 * 既に承認済みなら何もしない（冪等）。
 */
export async function acceptFriendRequest(
  currentUserId: string,
  friendshipId: string,
): Promise<void> {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });

  // 他人の関係は、存在自体を伏せて「見つからない」にする
  if (!friendship || friendship.friendUserId !== currentUserId) {
    throw new FriendshipError("not_found", "申請が見つかりません");
  }
  if (friendship.status === "ACCEPTED") return;

  await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });
}

/** 届いた申請を拒否する。行を消すので、同じ相手から再申請できる */
export async function rejectFriendRequest(
  currentUserId: string,
  friendshipId: string,
): Promise<void> {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });

  if (!friendship || friendship.friendUserId !== currentUserId) {
    throw new FriendshipError("not_found", "申請が見つかりません");
  }
  if (friendship.status === "ACCEPTED") {
    throw new FriendshipError("already_accepted", "すでに承認済みです");
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });
}

/** 送った申請を取り消す。取り消せるのは送った側だけ */
export async function cancelFriendRequest(
  currentUserId: string,
  friendshipId: string,
): Promise<void> {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });

  if (!friendship || friendship.userId !== currentUserId) {
    throw new FriendshipError("not_found", "申請が見つかりません");
  }
  if (friendship.status === "ACCEPTED") {
    throw new FriendshipError("already_accepted", "すでに承認済みです");
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });
}

/** 友達を解除する。承認済みの関係は、どちらからでも解除できる */
export async function removeFriend(
  currentUserId: string,
  friendUserId: string,
): Promise<void> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { userId: currentUserId, friendUserId },
        { userId: friendUserId, friendUserId: currentUserId },
      ],
    },
  });

  if (!friendship) {
    throw new FriendshipError("not_found", "友達が見つかりません");
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });
}

/** 承認済みの友達だけを返す */
export async function listFriends(currentUserId: string): Promise<FriendUser[]> {
  const rows = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ userId: currentUserId }, { friendUserId: currentUserId }],
    },
    include: {
      user: { select: friendUserSelect },
      friendUser: { select: friendUserSelect },
    },
  });

  return rows
    .map((row) => (row.userId === currentUserId ? row.friendUser : row.user))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

/** `/friends` 画面に必要な情報をまとめて取る */
export async function getFriendsOverview(currentUserId: string): Promise<FriendsOverview> {
  const [rows, allUsers] = await Promise.all([
    prisma.friendship.findMany({
      where: { OR: [{ userId: currentUserId }, { friendUserId: currentUserId }] },
      include: {
        user: { select: friendUserSelect },
        friendUser: { select: friendUserSelect },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { id: { not: currentUserId } },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: friendUserSelect,
    }),
  ]);

  const friends: FriendUser[] = [];
  const received: FriendsOverview["received"] = [];
  const sent: FriendsOverview["sent"] = [];
  const relatedIds = new Set<string>();

  for (const row of rows) {
    const other = row.userId === currentUserId ? row.friendUser : row.user;
    relatedIds.add(other.id);

    if (row.status === "ACCEPTED") {
      friends.push(other);
    } else if (row.friendUserId === currentUserId) {
      received.push({ id: row.id, user: other, createdAt: row.createdAt.toISOString() });
    } else {
      sent.push({ id: row.id, user: other, createdAt: row.createdAt.toISOString() });
    }
  }

  return {
    friends: friends.sort((a, b) => a.name.localeCompare(b.name, "ja")),
    received,
    sent,
    candidates: allUsers.filter((u) => !relatedIds.has(u.id)),
  };
}

/** 未対応の申請数。ヘッダーのバッジに使う */
export async function countPendingFriendRequests(currentUserId: string): Promise<number> {
  return prisma.friendship.count({
    where: { friendUserId: currentUserId, status: "PENDING" },
  });
}
