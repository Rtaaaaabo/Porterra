"use server";

import AuthError from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { requireUser } from "@/lib/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { createUser, createPostWithSpotAndImages, findUserByEmail, toggleLike } from "@/lib/db";
import { extractLatLngFromImage, geocodeSpotName } from "@/lib/location";
import { hashPassword } from "@/lib/password";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerAction(formData: FormData): Promise<void> {
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!name || !email || !password) {
    redirect("/register?error=required");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    redirect(`/register?error=${encodeURIComponent("このメールアドレスはすでに使用されています。")}`);
  }

  const passwordHash = await hashPassword(password);
  await createUser({
    name,
    email,
    passwordHash,
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/register?error=${encodeURIComponent("登録後のログインに失敗しました。")}`);
    }
    throw error;
  }
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=required");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=メールアドレスまたはパスワードが違います。");
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function createPostAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const spotName = getString(formData, "spotName");
  const prefecture = getString(formData, "prefecture");
  const country = getString(formData, "country");

  if (!title || !body || !spotName || !country) {
    redirect("/posts/new?error=required");
  }

  const files = formData.getAll("images");
  const imageUrls: string[] = [];
  let detectedLat: number | null = null;
  let detectedLng: number | null = null;

  for (const item of files) {
    if (!(item instanceof File)) continue;
    if (!item.name || item.size === 0) continue;
    if (detectedLat === null || detectedLng === null) {
      const gps = await extractLatLngFromImage(item);
      if (gps) {
        detectedLat = gps.lat;
        detectedLng = gps.lng;
      }
    }
    try {
      const url = await uploadImageToCloudinary(item);
      imageUrls.push(url);
    } catch (error) {
      console.error("Cloudinary upload error", error);
      redirect("/posts/new?error=upload_failed");
    }
  }

  if (imageUrls.length === 0) {
    redirect("/posts/new?error=image_required");
  }

  if (detectedLat === null || detectedLng === null) {
    const geocoded = await geocodeSpotName({
      spotName,
      prefecture,
      country,
    });
    if (geocoded) {
      detectedLat = geocoded.lat;
      detectedLng = geocoded.lng;
    }
  }

  const post = await createPostWithSpotAndImages({
    title,
    body,
    userId: user.id,
    spot: {
      name: spotName,
      prefecture,
      country,
      lat: detectedLat,
      lng: detectedLng,
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
