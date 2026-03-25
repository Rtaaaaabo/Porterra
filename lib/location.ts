import * as exifr from "exifr";

export type LatLng = {
  lat: number;
  lng: number;
};

export async function extractLatLngFromImage(file: File): Promise<LatLng | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const gps = (await exifr.gps(buffer)) as { latitude?: number; longitude?: number } | null;

  if (!gps?.latitude || !gps?.longitude) {
    return null;
  }

  return {
    lat: gps.latitude,
    lng: gps.longitude,
  };
}

export async function geocodeSpotName(input: {
  spotName: string;
  prefecture: string;
  country: string;
}): Promise<LatLng | null> {
  const query = [input.spotName, input.prefecture, input.country]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(", ");

  if (!query) {
    return null;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Porterra/0.1 (Next.js App)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data[0];
    if (!first?.lat || !first?.lon) {
      return null;
    }

    const lat = Number(first.lat);
    const lng = Number(first.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}
