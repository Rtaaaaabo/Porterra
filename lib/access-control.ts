function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getProductionAllowlist(): Set<string> {
  const raw = process.env.PRODUCTION_ALLOWED_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter((email) => email.length > 0);

  return new Set(emails);
}

export function isProductionAccessRestrictionEnabled(): boolean {
  return process.env.NODE_ENV === "production" && process.env.PRODUCTION_ACCESS_RESTRICT === "true";
}

export function isEmailAllowedInProduction(email: string): boolean {
  if (!isProductionAccessRestrictionEnabled()) {
    return true;
  }

  const allowlist = getProductionAllowlist();
  if (allowlist.size === 0) {
    return false;
  }

  return allowlist.has(normalizeEmail(email));
}
