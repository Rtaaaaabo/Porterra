"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginUser, logoutUser, registerUser, requireUser } from "@/lib/auth";
import { createPostWithSpotAndImages, toggleLike } from "@/lib/db";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseNullableNumber(value: string): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

async function saveImageFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const targetDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, filename);
  await fs.writeFile(targetPath, buffer);

  return `/uploads/${filename}`;
}

export async function registerAction(formData: FormData): Promise<void> {
  const name = getString(formData, "name");
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!name || !email || !password) {
    redirect("/register?error=required");
  }

  const result = await registerUser({ name, email, password });
  if (!result.ok) {
    redirect(`/register?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=required");
  }

  const result = await loginUser({ email, password });
  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await logoutUser();
  redirect("/");
}

export async function createPostAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const spotName = getString(formData, "spotName");
  const prefecture = getString(formData, "prefecture");
  const country = getString(formData, "country");
  const lat = parseNullableNumber(getString(formData, "lat"));
  const lng = parseNullableNumber(getString(formData, "lng"));

  if (!title || !body || !spotName || !country) {
    redirect("/posts/new?error=required");
  }

  const files = formData.getAll("images");
  const imageUrls: string[] = [];

  for (const item of files) {
    if (!(item instanceof File)) continue;
    if (!item.name || item.size === 0) continue;
    const url = await saveImageFile(item);
    imageUrls.push(url);
  }

  if (imageUrls.length === 0) {
    redirect("/posts/new?error=image_required");
  }

  const post = await createPostWithSpotAndImages({
    title,
    body,
    userId: user.id,
    spot: {
      name: spotName,
      prefecture,
      country,
      lat,
      lng,
    },
    imageUrls,
  });

  revalidatePath("/");
  revalidatePath(`/posts/${post.id}`);
  redirect(`/posts/${post.id}`);
}

export async function toggleLikeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const postId = getString(formData, "postId");
  if (!postId) {
    redirect("/");
  }

  await toggleLike(postId, user.id);
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}
