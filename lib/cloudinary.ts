import crypto from "node:crypto";

const DEFAULT_UPLOAD_MAX_WIDTH = 1920;
const DEFAULT_UPLOAD_MAX_HEIGHT = 1920;
const DEFAULT_UPLOAD_QUALITY = "auto:good";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
}

function buildSignature(params: Record<string, string>, apiSecret: string): string {
  const query = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(`${query}${apiSecret}`).digest("hex");
}

function getExtension(fileName: string): string {
  const ext = fileName.split(".").pop();
  return ext ? ext.toLowerCase() : "";
}

function isHeicLike(file: File): boolean {
  const mime = file.type.toLowerCase();
  const ext = getExtension(file.name);
  return mime === "image/heic" || mime === "image/heif" || ext === "heic" || ext === "heif";
}

function buildOptimizedDeliveryUrl(url: string): string {
  return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

function readPositiveIntegerEnv(
  key: string,
  fallback: number,
): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function buildIncomingTransformation(): string {
  const maxWidth = readPositiveIntegerEnv(
    "CLOUDINARY_UPLOAD_MAX_WIDTH",
    DEFAULT_UPLOAD_MAX_WIDTH,
  );
  const maxHeight = readPositiveIntegerEnv(
    "CLOUDINARY_UPLOAD_MAX_HEIGHT",
    DEFAULT_UPLOAD_MAX_HEIGHT,
  );
  const quality =
    process.env.CLOUDINARY_UPLOAD_QUALITY?.trim() || DEFAULT_UPLOAD_QUALITY;

  return `c_limit,w_${maxWidth},h_${maxHeight},q_${quality}`;
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const folder = process.env.CLOUDINARY_FOLDER?.trim();
  const format = isHeicLike(file) ? "jpg" : undefined;
  const transformation = buildIncomingTransformation();

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signParams: Record<string, string> = {
    timestamp,
    transformation,
  };
  if (folder) {
    signParams.folder = folder;
  }
  if (format) {
    signParams.format = format;
  }

  const signature = buildSignature(signParams, apiSecret);

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", apiKey);
  uploadForm.append("timestamp", timestamp);
  uploadForm.append("signature", signature);
  uploadForm.append("transformation", transformation);
  if (folder) {
    uploadForm.append("folder", folder);
  }
  if (format) {
    uploadForm.append("format", format);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: uploadForm,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${errorBody}`);
  }

  const payload = (await response.json()) as { secure_url?: string };
  if (!payload.secure_url) {
    throw new Error("Cloudinary upload failed: secure_url not found");
  }

  return buildOptimizedDeliveryUrl(payload.secure_url);
}
