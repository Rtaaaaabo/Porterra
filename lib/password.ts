import crypto, { scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

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
