const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrl(url: string): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get("sslmode");
    const useLibpqCompat = parsed.searchParams.get("uselibpqcompat") === "true";

    if (sslMode && LEGACY_SSL_MODES.has(sslMode) && !useLibpqCompat) {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}
