import * as exifr from "exifr";

export type LatLng = {
  lat: number;
  lng: number;
};

const COORD_DECIMALS = 6;

function roundCoordinate(value: number): number {
  return Number(value.toFixed(COORD_DECIMALS));
}

export function normalizeLatLng(input: LatLng): LatLng {
  return {
    lat: roundCoordinate(input.lat),
    lng: roundCoordinate(input.lng),
  };
}

export type SpotNameResult = {
  name: string;
  city: string;
  prefecture: string;
  country: string;
};

export async function extractLatLngFromImage(
  file: File,
): Promise<LatLng | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const gps = (await exifr.gps(buffer)) as {
    latitude?: number;
    longitude?: number;
  } | null;


  if (gps?.latitude == null || gps?.longitude == null) {
    return null;
  }

  return normalizeLatLng({
    lat: gps.latitude,
    lng: gps.longitude,
  });
}

export async function extractYearFromImage(file: File): Promise<number | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const data = (await exifr.parse(buffer, ["DateTimeOriginal"])) as {
      DateTimeOriginal?: Date;
    } | null;
    if (data?.DateTimeOriginal instanceof Date) {
      const year = data.DateTimeOriginal.getFullYear();
      const currentYear = new Date().getFullYear();
      return year > 1800 && year <= currentYear ? year : null;
    }
  } catch {
    // EXIF parse failed — skip silently
  }
  return null;
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

    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
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

export async function reverseGeocodeFromLatLng(
  input: LatLng,
): Promise<SpotNameResult | null> {
  const normalized = normalizeLatLng(input);
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1` +
    `&lat=${encodeURIComponent(String(normalized.lat))}&lon=${encodeURIComponent(String(normalized.lng))}`;

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

    const payload = (await response.json()) as {
      name?: string;
      display_name?: string;
      address?: {
        state?: string;
        province?: string;
        county?: string;
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        neighbourhood?: string;
        hamlet?: string;
        country?: string;
      };
    };

    const address = payload.address;
    const spotNameCandidates = [
      payload.name,
      address?.city,
      address?.town,
      address?.village,
      address?.suburb,
      address?.neighbourhood,
      address?.hamlet,
      address?.county,
      payload.display_name?.split(",")[0],
    ];
    const spotName = spotNameCandidates
      .map((value) => value?.trim())
      .find((value): value is string => Boolean(value));

    const city = (
      address?.city ??
      address?.town ??
      address?.village ??
      address?.suburb ??
      ""
    ).trim();

    const prefecture = (
      address?.state ??
      address?.province ??
      address?.county ??
      ""
    ).trim();
    const country = (address?.country ?? "").trim();

    if (!spotName || !country) {
      return null;
    }

    return {
      name: spotName,
      city,
      prefecture,
      country,
    };
  } catch {
    return null;
  }
}
