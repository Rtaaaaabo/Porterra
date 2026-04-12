import Link from "next/link";
import { Suspense } from "react";
import FilterPanel from "@/app/components/filter-panel";
import MapClient from "@/app/map/map-client";
import { getCurrentUser } from "@/lib/auth";
import { getFilterOptions, getPostMapPoints } from "@/lib/db";
import { resolveSpotLabel } from "@/lib/spot-label";
import type { PostFilters } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  const rawYear = typeof params.takenYear === "string" ? parseInt(params.takenYear, 10) : NaN;
  const filters: PostFilters = {
    country: typeof params.country === "string" ? params.country || undefined : undefined,
    prefecture: typeof params.prefecture === "string" ? params.prefecture || undefined : undefined,
    city: typeof params.city === "string" ? params.city || undefined : undefined,
    takenYear: Number.isNaN(rawYear) ? undefined : rawYear,
  };

  const [points, filterOptions] = await Promise.all([
    getPostMapPoints(user?.id, filters),
    getFilterOptions(user?.id),
  ]);

  const pointsWithSpotLabel = await Promise.all(
    points.map(async (point) => ({
      ...point,
      spotName: await resolveSpotLabel({
        spotName: point.spotName,
        prefecture: point.prefecture,
        country: point.country,
        lat: point.lat,
        lng: point.lng,
      }),
    })),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">投稿マップ</h1>
          <p className="text-sm text-slate-600">投稿された場所をクラスタ表示します（拡大で細分化）</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          一覧へ戻る
        </Link>
      </header>

      <Suspense>
        <FilterPanel
          locations={filterOptions.locations}
          years={filterOptions.years}
        />
      </Suspense>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {pointsWithSpotLabel.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            条件に一致する位置情報付きの投稿がありません。
          </p>
        ) : (
          <MapClient points={pointsWithSpotLabel} />
        )}
      </section>
    </main>
  );
}
