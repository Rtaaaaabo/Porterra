"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { FilterOptions } from "@/lib/types";

type Props = FilterOptions;

export default function FilterPanel({ locations, years }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const country = searchParams.get("country") ?? "";
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const takenYear = searchParams.get("takenYear") ?? "";

  const countries = useMemo(
    () => [...new Set(locations.map((l) => l.country).filter(Boolean))].sort(),
    [locations],
  );

  const prefectures = useMemo(
    () =>
      [
        ...new Set(
          locations
            .filter((l) => !country || l.country === country)
            .map((l) => l.prefecture)
            .filter(Boolean),
        ),
      ].sort(),
    [locations, country],
  );

  const cities = useMemo(
    () =>
      [
        ...new Set(
          locations
            .filter(
              (l) =>
                (!country || l.country === country) &&
                (!prefecture || l.prefecture === prefecture),
            )
            .map((l) => l.city)
            .filter(Boolean),
        ),
      ].sort(),
    [locations, country, prefecture],
  );

  const updateFilter = useCallback(
    (key: string, value: string, reset?: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      reset?.forEach((k) => params.delete(k));
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push(window.location.pathname);
  }, [router]);

  const hasFilters = country || prefecture || city || takenYear;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">国</label>
        <select
          value={country}
          onChange={(e) =>
            updateFilter("country", e.target.value, ["prefecture", "city"])
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="">すべての国</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          都道府県 / 州
        </label>
        <select
          value={prefecture}
          onChange={(e) => updateFilter("prefecture", e.target.value, ["city"])}
          disabled={prefectures.length === 0}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
        >
          <option value="">すべて</option>
          {prefectures.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">市町村</label>
        <select
          value={city}
          onChange={(e) => updateFilter("city", e.target.value)}
          disabled={cities.length === 0}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
        >
          <option value="">すべて</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">撮影年</label>
        <select
          value={takenYear}
          onChange={(e) => updateFilter("takenYear", e.target.value)}
          disabled={years.length === 0}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
        >
          <option value="">すべての年</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}年
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          クリア
        </button>
      )}
    </div>
  );
}
