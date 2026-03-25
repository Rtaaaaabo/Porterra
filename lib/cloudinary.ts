import crypto from "node:crypto";

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

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const folder = process.env.CLOUDINARY_FOLDER?.trim();

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signParams: Record<string, string> = { timestamp };
  if (folder) {
    signParams.folder = folder;
  }

  const signature = buildSignature(signParams, apiSecret);

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", apiKey);
  uploadForm.append("timestamp", timestamp);
  uploadForm.append("signature", signature);
  if (folder) {
    uploadForm.append("folder", folder);
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

  return payload.secure_url;
}
