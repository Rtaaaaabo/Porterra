import crypto, { scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  createUser,
  deleteSessionByToken,
  findUserByEmail,
  findUserById,
  getSessionByToken,
} from "@/lib/db";

const scrypt = promisify(_scrypt);
const SESSION_COOKIE = "porterra_session";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID();
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;

  const key = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(hashHex, "hex");
  return key.length === stored.length && timingSafeEqual(key, stored);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    return { ok: false, error: "このメールアドレスはすでに使用されています。" };
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash,
  });

  await createAndSetSession(user.id);
  return { ok: true };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    return { ok: false, error: "メールアドレスまたはパスワードが違います。" };
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    return { ok: false, error: "メールアドレスまたはパスワードが違います。" };
  }

  await createAndSetSession(user.id);
  return { ok: true };
}

async function createAndSetSession(userId: string): Promise<void> {
  const session = await createSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSessionByToken(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  const user = await findUserById(session.userId);
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
