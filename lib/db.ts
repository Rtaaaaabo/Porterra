import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Database, Post, PostDetail, PostFeedItem, PostImage, Session, Spot, User } from "@/lib/types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function readDb(): Promise<Database> {
  const raw = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(raw) as Database;
}

async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  const db = await readDb();
  return db.users.find((u) => u.id === id);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  const db = await readDb();
  const user: User = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function createSession(userId: string): Promise<Session> {
  const db = await readDb();
  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    token: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  db.sessions.push(session);
  await writeDb(db);
  return session;
}

export async function getSessionByToken(token: string): Promise<Session | undefined> {
  const db = await readDb();
  return db.sessions.find((s) => s.token === token);
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const db = await readDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await writeDb(db);
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
}): Promise<Post> {
  const db = await readDb();

  const spot: Spot = {
    id: crypto.randomUUID(),
    name: input.spot.name,
    prefecture: input.spot.prefecture,
    country: input.spot.country,
    lat: input.spot.lat,
    lng: input.spot.lng,
    createdAt: new Date().toISOString(),
  };
  db.spots.push(spot);

  const post: Post = {
    id: crypto.randomUUID(),
    title: input.title,
    body: input.body,
    userId: input.userId,
    spotId: spot.id,
    createdAt: new Date().toISOString(),
  };
  db.posts.push(post);

  const images: PostImage[] = input.imageUrls.map((imageUrl) => ({
    id: crypto.randomUUID(),
    postId: post.id,
    imageUrl,
    createdAt: new Date().toISOString(),
  }));
  db.postImages.push(...images);

  await writeDb(db);
  return post;
}

export async function getPostFeed(): Promise<PostFeedItem[]> {
  const db = await readDb();

  return [...db.posts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((post) => {
      const user = db.users.find((u) => u.id === post.userId);
      const spot = db.spots.find((s) => s.id === post.spotId);
      const images = db.postImages
        .filter((img) => img.postId === post.id)
        .map((img) => img.imageUrl);
      const likeCount = db.likes.filter((like) => like.postId === post.id).length;

      return {
        id: post.id,
        title: post.title,
        body: post.body,
        createdAt: post.createdAt,
        authorName: user?.name ?? "Unknown",
        spotName: spot?.name ?? "Unknown",
        prefecture: spot?.prefecture ?? "",
        country: spot?.country ?? "",
        imageUrls: images,
        likeCount,
      };
    });
}

export async function getPostDetail(postId: string, viewerUserId?: string): Promise<PostDetail | null> {
  const db = await readDb();
  const post = db.posts.find((item) => item.id === postId);
  if (!post) return null;

  const user = db.users.find((u) => u.id === post.userId);
  const spot = db.spots.find((s) => s.id === post.spotId);
  const images = db.postImages.filter((img) => img.postId === post.id).map((img) => img.imageUrl);
  const postLikes = db.likes.filter((like) => like.postId === post.id);

  return {
    id: post.id,
    title: post.title,
    body: post.body,
    createdAt: post.createdAt,
    authorName: user?.name ?? "Unknown",
    spotName: spot?.name ?? "Unknown",
    prefecture: spot?.prefecture ?? "",
    country: spot?.country ?? "",
    lat: spot?.lat ?? null,
    lng: spot?.lng ?? null,
    imageUrls: images,
    likeCount: postLikes.length,
    hasLiked: viewerUserId ? postLikes.some((like) => like.userId === viewerUserId) : false,
  };
}

export async function toggleLike(postId: string, userId: string): Promise<void> {
  const db = await readDb();
  const existing = db.likes.find((like) => like.postId === postId && like.userId === userId);

  if (existing) {
    db.likes = db.likes.filter((like) => like.id !== existing.id);
  } else {
    db.likes.push({
      id: crypto.randomUUID(),
      postId,
      userId,
      createdAt: new Date().toISOString(),
    });
  }

  await writeDb(db);
}
