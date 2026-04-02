import { reverseGeocodeFromLatLng } from "@/lib/location";

type SpotLabelInput = {
  spotName: string;
  prefecture?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
};

export function isKnownPlaceText(value: string): boolean {
  const normalized = value.trim();
  return normalized !== "" && normalized !== "不明" && normalized !== "不明な場所";
}

function buildAreaFallback(prefecture = "", country = ""): string | null {
  const parts = [prefecture, country].filter(isKnownPlaceText);
  if (parts.length === 0) return null;
  return `${parts.join("・")}周辺`;
}

export async function resolveSpotLabel(input: SpotLabelInput): Promise<string> {
  if (isKnownPlaceText(input.spotName)) {
    return input.spotName;
  }

  const areaFallback = buildAreaFallback(input.prefecture, input.country);
  if (areaFallback) {
    return areaFallback;
  }

  if (input.lat !== null && input.lat !== undefined && input.lng !== null && input.lng !== undefined) {
    const resolved = await reverseGeocodeFromLatLng({ lat: input.lat, lng: input.lng });
    if (resolved?.name) {
      return `${resolved.name}周辺`;
    }
  }

  return "このエリア周辺";
}
