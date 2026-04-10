export const POST_VISIBILITY_VALUES = ["CUSTOM", "FRIENDS", "PUBLIC"] as const;

export type PostVisibilityValue = (typeof POST_VISIBILITY_VALUES)[number];

export function parsePostVisibility(
  value: string | null | undefined,
): PostVisibilityValue | null {
  if (!value) return null;
  return POST_VISIBILITY_VALUES.includes(value as PostVisibilityValue)
    ? (value as PostVisibilityValue)
    : null;
}

export function getPostVisibilityLabel(value: PostVisibilityValue): string {
  if (value === "CUSTOM") return "自分のみ/カスタム";
  if (value === "FRIENDS") return "友達のみ";
  return "全員";
}
